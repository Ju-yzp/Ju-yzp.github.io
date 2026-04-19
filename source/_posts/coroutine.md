---
layout:     post
title:      "Coroutine"
subtitle:   " \"Just do it\""
date:       2026-04-19 15:32:00
author:     "Ju-yzp"
cover: "img/YuLinStreet.jpg"
tags:
    - 计算机
    - cpp
    - 汇编
---

# 协程

# 实验源码

```cpp
#include <coroutine>
#include <iostream>

struct Task {
    struct promise_type {
        Task get_return_object() { return {std::coroutine_handle<promise_type>::from_promise(*this)}; }
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        void unhandled_exception() {}
        void return_void() {}
    };
    std::coroutine_handle<promise_type> h;
};

[[gnu::noinline]]
Task my_coroutine(int n) {
    if (n > 0) {
        co_await std::suspend_always{};
    }
}

int main() {
    auto t = my_coroutine(1);
    t.h.resume();
    return 0;
}
```

## 程序可视化

用户可以修改寄存器和内存值，观察程序执行变化

<div id="final-asm-debugger"></div>

<script type="text/babel">
  const code = `
my_coroutine(_Z12my_coroutinei.Frame*) (.actor):
        movzx   eax, WORD PTR [rdi+24]
        test    al, 1
        je      .L2
        cmp     ax, 7
        ja      .L3
.L12:
        cmp     BYTE PTR [rdi+28], 0
        jne     .L17
        ret
.L2:
        cmp     ax, 4
        je      .L5
        ja      .L6
        test    ax, ax
        je      .L7
        mov     BYTE PTR [rdi+29], 1
        cmp     DWORD PTR [rdi+20], 0
        jle     .L5
        mov     WORD PTR [rdi+24], 4
        ret
.L6:
        cmp     ax, 6
        jne     .L3
        movzx   eax, WORD PTR [rdi+26]
        sub     eax, 1
        mov     WORD PTR [rdi+26], ax
        test    ax, ax
        je      .L12
        ret
.L3:
        ud2
.L7:
        mov     BYTE PTR [rdi+29], 0
        add     WORD PTR [rdi+26], 1
        mov     WORD PTR [rdi+24], 2
        ret
.L5:
        mov     QWORD PTR [rdi], 0
        mov     WORD PTR [rdi+24], 6
        ret
.L17:
        sub     rsp, 8
        mov     esi, 40
        call    operator delete(void*, unsigned long)
        add     rsp, 8
        ret
my_coroutine(_Z12my_coroutinei.Frame*) (.destroy):
        sub     rsp, 8
        or      WORD PTR [rdi+24], 1
        call    my_coroutine(_Z12my_coroutinei.Frame*) (.actor)
        add     rsp, 8
        ret
my_coroutine(int):
        push    rbp
        push    rbx
        sub     rsp, 8
        mov     ebp, edi
        mov     edi, 40
        call    operator new(unsigned long)
        mov     rbx, rax
        mov     BYTE PTR [rax+28], 1
        mov     QWORD PTR [rax], OFFSET FLAT:my_coroutine(_Z12my_coroutinei.Frame*) (.actor)
        mov     QWORD PTR [rax+8], OFFSET FLAT:my_coroutine(_Z12my_coroutinei.Frame*) (.destroy)
        mov     DWORD PTR [rax+20], ebp
        mov     WORD PTR [rax+24], 0
        mov     WORD PTR [rax+26], 1
        mov     rdi, rax
        call    my_coroutine(_Z12my_coroutinei.Frame*) (.actor)
        movzx   eax, WORD PTR [rbx+26]
        sub     eax, 1
        mov     WORD PTR [rbx+26], ax
        test    ax, ax
        je      .L23
.L21:
        mov     rax, rbx
        add     rsp, 8
        pop     rbx
        pop     rbp
        ret
.L23:
        mov     esi, 40
        mov     rdi, rbx
        call    operator delete(void*, unsigned long)
        jmp     .L21
main:
        sub     rsp, 8
        mov     edi, 1
        call    my_coroutine(int)
        mov     rdi, rax
        call    [QWORD PTR [rax]]
        mov     eax, 0
        add     rsp, 8
        ret
  `;

const startApp = () => {
    if (typeof window.initAsmDebugger === 'function') {
      window.initAsmDebugger('final-asm-debugger', code);
    }
  };

  // 情况 A：脚本已经加载完成
  if (window.initAsmDebugger) {
    startApp();
  } else {
    // 情况 B：脚本还没加载完，等待事件通知
    window.addEventListener('asm-debugger-ready', startApp);
  }
</script>