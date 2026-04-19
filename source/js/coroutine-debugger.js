const { useState, useLayoutEffect, useMemo, useRef, useCallback, useEffect } = React;

const U32 = {
    hex: (v) => `0x${(v >>> 0).toString(16).toUpperCase().padStart(8, '0')}`,
    parseMem: (str) => {
        if (!str) return null;
        const m = str.match(/\[(?:.*PTR\s+)?(\w+)([\+\-]\d+)?\]/);
        if (!m) return null;
        return { reg: m[1].toLowerCase(), offset: parseInt(m[2] || 0) };
    }
};

// 寄存器别名映射 (将 32/16/8 位寄存器映射回 64 位基准)
const getBaseReg = (r) => {
    const map = {
        'eax':'rax', 'ax':'rax', 'al':'rax',
        'ebx':'rbx', 'bx':'rbx', 'bl':'rbx',
        'ecx':'rcx', 'cx':'rcx', 'cl':'rcx',
        'edx':'rdx', 'dx':'rdx', 'dl':'rdx',
        'esi':'rsi', 'si':'rsi', 'sil':'rsi',
        'edi':'rdi', 'di':'rdi', 'dil':'rdi',
        'ebp':'rbp', 'bp':'rbp', 'bpl':'rbp',
        'esp':'rsp', 'sp':'rsp', 'spl':'rsp'
    };
    return map[r.toLowerCase()] || r.toLowerCase();
};

const AsmContextDebugger = ({ asmCode, heapBase = 0x55556000, stackBase = 0x7FFF00 }) => {
    const createInitialState = () => ({
        regs: { rax: 0, rbx: 0, rcx: 0, rdx: 0, rdi: 0, rsi: 0, rsp: stackBase, rbp: stackBase, flags: { zf: false, cf: false, sf: false } },
        memory: {},
        pc: -1,
        focusAddr: stackBase,
        halted: false,
        error: null
    });

    const [state, setState] = useState(createInitialState());
    const codeScrollRef = useRef(null);

    // --- 1. 修复版的汇编解析器 ---
    const { program, labels } = useMemo(() => {
        const prog = [];
        const lbs = {};
        asmCode.split('\n').forEach(line => {
            const t = line.trim();
            if (!t || t.startsWith(';') || t.startsWith('/')) return;
            if (t.endsWith(':')) {
                // 完美保留标号中的空格，如 my_coroutine(...) (.actor)
                lbs[t.substring(0, t.length - 1).trim()] = prog.length;
            } else {
                const spaceIdx = t.indexOf(' ');
                if (spaceIdx === -1) {
                    prog.push({ op: t.toLowerCase(), args: [], raw: t, addr: 0x401000 + prog.length * 4 });
                } else {
                    const op = t.substring(0, spaceIdx).trim().toLowerCase();
                    const argsStr = t.substring(spaceIdx).trim();
                    // 按逗号分割，但不破坏内部的空格
                    const args = argsStr.split(',').map(s => s.trim());
                    prog.push({ op, args, raw: t, addr: 0x401000 + prog.length * 4 });
                }
            }
        });
        return { program: prog, labels: lbs };
    }, [asmCode]);

    const initPC = useCallback(() => {
        const startIdx = labels['main'] !== undefined ? labels['main'] : 0;
        setState(s => ({ ...s, pc: startIdx }));
    }, [labels]);

    useEffect(() => { if (state.pc === -1) initPC(); }, [initPC, state.pc]);

    const handleReset = () => {
        setState({ ...createInitialState(), pc: labels['main'] !== undefined ? labels['main'] : 0 });
    };

useLayoutEffect(() => {
        const container = codeScrollRef.current;
        // 增加对 program.length 的判断，确保 PC 合法
        if (!container || state.pc < 0 || state.pc >= program.length || state.halted) return;

        // 使用 requestAnimationFrame 确保 DOM 已经根据 state.pc 完成了 .active 类的切换
        const handleScroll = () => {
            const activeLine = container.querySelector('.v4-c-line.active');
            
            if (activeLine) {
                // 1. 获取目标行相对于容器顶部的偏移 (px)
                const lineTop = activeLine.offsetTop;
                // 2. 获取目标行自身的高度 (通常为 20-30px)
                const lineHeight = activeLine.offsetHeight;
                // 3. 获取容器的可视高度 (400px)
                const containerHeight = container.clientHeight;

                // 计算公式：将行的中心点对齐到容器的中心点
                // 计算出的 top 是滚动条应该滑动到的位置
                const scrollToPosition = lineTop - (containerHeight / 2) + (lineHeight / 2);

                container.scrollTo({
                    top: scrollToPosition,
                    behavior: 'smooth'
                });
            }
        };

        // 稍微延迟一帧执行，等待 React 完成 DOM 的 class 注入
        requestAnimationFrame(handleScroll);
    }, [state.pc]);

    // --- 2. 交互式修改状态 ---
    const editReg = (reg) => {
        const val = prompt(`修改寄存器 ${reg.toUpperCase()} (支持十六进制如 0x1A 或十进制):`, U32.hex(state.regs[reg]));
        if (val !== null && val.trim() !== "") {
            const parsed = parseInt(val, val.startsWith('0x') ? 16 : 10);
            if (!isNaN(parsed)) setState(s => ({ ...s, regs: { ...s.regs, [reg]: parsed >>> 0 } }));
        }
    };

    const editMem = (addr) => {
        const val = prompt(`修改内存地址 ${U32.hex(addr)} 的值:`, U32.hex(state.memory[addr] || 0));
        if (val !== null && val.trim() !== "") {
            const parsed = parseInt(val, val.startsWith('0x') ? 16 : 10);
            if (!isNaN(parsed)) setState(s => ({ ...s, memory: { ...s.memory, [addr]: parsed >>> 0 } }));
        }
    };

    // --- 3. 核心执行引擎 ---
    const step = useCallback(() => {
        const { pc, regs, memory, halted } = state;
        if (halted || pc < 0 || pc >= program.length) return;

        const { op, args } = program[pc];
        let nr = { ...regs }, nm = { ...memory }, nextPc = pc + 1;
        let error = null;

        const getV = (v) => {
            if (!v) return 0;
            const cleanV = v.replace(/OFFSET FLAT:|BYTE PTR |WORD PTR |DWORD PTR |QWORD PTR /g, '').trim();
            const baseReg = getBaseReg(cleanV);
            if (nr[baseReg] !== undefined) return nr[baseReg];
            if (labels[cleanV] !== undefined) return labels[cleanV];
            return parseInt(cleanV) || 0;
        };

        const writeMem = (addr, val) => { nm[addr >>> 0] = val; };
        const readMem = (addr) => nm[addr >>> 0] || 0;

        try {
            switch (op) {
                case 'mov': case 'movzx': case 'movabs':
                    const dM = U32.parseMem(args[0]);
                    const sM = U32.parseMem(args[1]);
                    const val = sM ? readMem(nr[getBaseReg(sM.reg)] + sM.offset) : getV(args[1]);
                    if (dM) writeMem(nr[getBaseReg(dM.reg)] + dM.offset, val);
                    else nr[getBaseReg(args[0])] = val;
                    break;
                case 'push':
                    nr.rsp = (nr.rsp - 8) >>> 0;
                    writeMem(nr.rsp, getV(args[0]));
                    break;
                case 'pop':
                    nr[getBaseReg(args[0])] = readMem(nr.rsp);
                    nr.rsp = (nr.rsp + 8) >>> 0;
                    break;
                case 'call':
                    const callArg = args[0];
                    let targetPc;
                    const indM = U32.parseMem(callArg);
                    if (indM) { 
                        targetPc = readMem(nr[getBaseReg(indM.reg)] + indM.offset);
                    } else {
                        targetPc = getV(callArg);
                    }
                    
                    if (callArg.includes('new')) {
                        nr.rax = heapBase;
                    } else if (callArg.includes('delete')) {
                        // pass
                    } else {
                        nr.rsp = (nr.rsp - 8) >>> 0;
                        writeMem(nr.rsp, pc + 1); // 压入返回地址(数组索引)
                        nextPc = targetPc;
                    }
                    break;
                case 'ret':
                    const retAddr = readMem(nr.rsp);
                    if (nr.rsp >= stackBase) nextPc = -2; // 退出
                    else { 
                        nr.rsp = (nr.rsp + 8) >>> 0; 
                        nextPc = retAddr; 
                    }
                    break;
                case 'add': nr[getBaseReg(args[0])] = (nr[getBaseReg(args[0])] + getV(args[1])) >>> 0; break;
                case 'sub': nr[getBaseReg(args[0])] = (nr[getBaseReg(args[0])] - getV(args[1])) >>> 0; break;
                case 'or':  nr[getBaseReg(args[0])] = (nr[getBaseReg(args[0])] | getV(args[1])) >>> 0; break;
                case 'xor': nr[getBaseReg(args[0])] = (nr[getBaseReg(args[0])] ^ getV(args[1])) >>> 0; break;
                
                // 标志位运算分离修复
                case 'test': {
                    const res = (getV(args[0]) & getV(args[1])) >>> 0;
                    nr.flags = { zf: res === 0, cf: false, sf: (res & 0x80000000) !== 0 };
                    break;
                }
                case 'cmp': {
                    const v1 = getV(args[0]);
                    const v2 = getV(args[1]);
                    const res = (v1 - v2) | 0;
                    nr.flags = { zf: v1 === v2, cf: (v1 >>> 0) < (v2 >>> 0), sf: res < 0 };
                    break;
                }
                case 'je':  if (nr.flags.zf) nextPc = getV(args[0]); break;
                case 'jne': if (!nr.flags.zf) nextPc = getV(args[0]); break;
                case 'ja':  if (!nr.flags.cf && !nr.flags.zf) nextPc = getV(args[0]); break; // CF=0 and ZF=0
                case 'jbe': if (nr.flags.cf || nr.flags.zf) nextPc = getV(args[0]); break;
                case 'jg':  if (!nr.flags.zf && (nr.flags.sf === false)) nextPc = getV(args[0]); break; // 简化的有符号比较
                case 'jle': if (nr.flags.zf || nr.flags.sf) nextPc = getV(args[0]); break;
                case 'jmp': nextPc = getV(args[0]); break;
                case 'ud2': throw new Error("UD2 - 非法指令/协程状态异常");
                default:
                    if (op.startsWith('j')) nextPc = pc + 1; 
                    else throw new Error(`Unknown instruction: ${op}`);
            }
        } catch (e) { error = e.message; }

        const isHalted = nextPc < 0 || nextPc >= program.length || error !== null;
        setState(prev => ({
            ...prev,
            regs: nr, memory: nm,
            pc: isHalted ? prev.pc : nextPc,
            halted: isHalted,
            error: error,
            focusAddr: (U32.parseMem(args[0])?.reg === 'rdi' || op === 'push' || op === 'call') ? nr[getBaseReg(U32.parseMem(args[0])?.reg || 'rsp')] : prev.focusAddr
        }));
    }, [state, program, labels, heapBase, stackBase]);

    // --- 4. 内存以 8 字节对齐显示 ---
    const memLines = useMemo(() => {
        const lines = [];
        const start = (state.focusAddr & 0xFFFFFFF8); // 对齐到 8 字节边界
        for (let i = -2; i < 8; i++) {
            const addr = (start + i * 8) >>> 0;
            lines.push({ addr, val: state.memory[addr] || 0 });
        }
        return lines;
    }, [state.focusAddr, state.memory]);

    return (
        <div className="asm-v5-wrapper">
            <div className={`v5-toolbar ${state.error ? 'has-error' : ''}`}>
                <div className="v5-status">
                    {state.error ? `ERR: ${state.error}` : state.halted ? "HALTED" : `PC: ${U32.hex(program[state.pc]?.addr || 0)}`}
                </div>
                <div className="v5-actions">
                    <button className="btn-step" onClick={step} disabled={state.halted}>STEP (F10)</button>
                    <button className="btn-reset" onClick={handleReset}>RESET</button>
                </div>
            </div>

            <div className="v5-layout-grid">
                <div className="v5-panel v5-regs">
                    <div className="v5-p-title">REGISTERS (Click to Edit)</div>
                    {['rax', 'rbx', 'rcx', 'rdx', 'rdi', 'rsi', 'rsp', 'rbp'].map(r => (
                        <div key={r} className="v5-reg-row">
                            <span className="r-name">{r.toUpperCase()}</span>
                            <span className="editable-val" onClick={() => editReg(r)} title="点击修改数值">
                                {U32.hex(state.regs[r])}
                            </span>
                        </div>
                    ))}
                    <div className="v5-flags">
                        FLAGS: [ ZF: {state.regs.flags.zf?1:0} | CF: {state.regs.flags.cf?1:0} | SF: {state.regs.flags.sf?1:0} ]
                    </div>
                </div>

                <div className="v5-panel v5-mem">
                    <div className="v5-p-title">MEMORY (Click to Edit)</div>
                    {memLines.map(m => (
                        <div key={m.addr} className={`v5-mem-row ${state.regs.rsp === m.addr ? 'sp-active' : ''} ${m.addr >= heapBase && m.addr < heapBase+128 ? 'is-heap' : ''}`}>
                            <span className="m-addr">{U32.hex(m.addr)}</span>
                            <span className="editable-val" onClick={() => editMem(m.addr)} title="点击修改内存">
                                {U32.hex(m.val)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="v5-source">
                    <div className="v5-p-title">COROUTINE DISASSEMBLY</div>
                    <div className="v5-scroll-area" ref={codeScrollRef}>
                        <div className="v5-scroll-content">
                            {program.map((l, i) => {
                                const labelName = Object.keys(labels).find(k => labels[k] === i);
                                return (
                                    <React.Fragment key={i}>
                                        {labelName && <div className="v5-asm-label">{labelName}:</div>}
                                        <div className={`v4-c-line ${i===state.pc ? 'active' : ''}`}>
                                            <span className="ca">{U32.hex(l.addr)}</span>
                                            <code>{l.raw}</code>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.initAsmDebugger = (id, code) => {
    const el = document.getElementById(id);
    if (el) ReactDOM.createRoot(el).render(<AsmContextDebugger asmCode={code} />);
};
window.dispatchEvent(new Event('asm-debugger-ready'));