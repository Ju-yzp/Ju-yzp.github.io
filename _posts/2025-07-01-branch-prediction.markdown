---
layout:     post
title:      "Branch Prediction"
subtitle:   " \"Just do it\""
date:       2025-07-04 01:40:00
author:     "Ju-yzp"
header-img: "img/running.jpg"
tags:
    - 计算机
---

# 计算机中的分支预测

[stack overflow中的形容](https://stackoverflow.com/questions/11227809/why-is-processing-a-sorted-array-faster-than-processing-an-unsorted-array)

![](/img/in-post/25-07-04/muxnt.jpg)
<small class="img-hint">变轨装置</small>

假设你在控制火车的一个转向轨道，当一个火车向这里开来时，你并不知道火车想转哪条轨道(假设不能在火车到达前获得信息),
那么你需要把火车叫停，然后询问或者火车司机往哪里走，这样子你才能控制轨道的变向。

在计算机中，类似这个场景的代码片段就是分支结构。由于计算机的流水线设计，那么只能能比较结果后，才能得知接下来需要执
行的指令，那么这个极大的破坏了原本流水线的设计，使得流水线的优势无效。

针对这个问题，人类研发了一种电路结构，通过一些复杂的原理，预测将会走哪一条分支，提前将指令取出，等待上一条指令执行
完后，就可以以流水线的方式继续。但是如果预测失败，那么付出的代价很昂贵，处理器要把状态恢复到上一条指令前，这往往要
浪费多个时钟周期。

## 实验阶段

在本次实验中，我们有两组数据，两组数据规模相同，且都是使用同一个函数进行处理，一组数据具有周期性规律，而另一组数据
是随机生成的。我们通过对比处理两组数据的耗时，看看分支预测电路在哪种情况下，会得到较低的耗时。

下面的是我们用到的计时器以及防止编译器优化循环的宏。

```bash
#include <iostream>
#include <chrono>
#include <string>
#include <vector>

const int N = 300*1024*1024;

// 防止编译器优化的宏
#define NOTOPTIMIZE(a) asm volatile("" : "+m,r"(a) : : "memory")

// 在一个作用域内使用，在生命周期结束后，将会输出时间差
// 不支持线程安全
class Timer{
public:
Timer(std::string name):
name_(name)
{
time_stamp_ = std::chrono::high_resolution_clock::now();
}
Timer() = delete;

~Timer()
{
auto time_diff = std::chrono::high_resolution_clock::now() - time_stamp_;
std::cout<< name_ << "operation cost time:\t"
         << std::chrono::duration_cast<std::chrono::milliseconds>(time_diff).count()
         << std::chrono::duration_cast<std::chrono::nanoseconds>(time_diff * 10 / N).count()
         << " *0.1ns" <<std::endl;
}
private:
std::string name_;
std::chrono::system_clock::time_point time_stamp_;
};

```

这部分代码是对数据进行处理的函数。

```bash


// 处理数据函数
void deal_with_data(const std::vector<int>& data_1,
                    const std::vector<int>& data_2,
                    const std::vector<uint8_t>& flag)
{
int data_size  = data_1.size();

assert(data_1.size() == data_2.size());
assert(data_2.size() == flag.size());

Timer timer("Normal branch");
int num;
for(int index = 0 ;index < data_size;index++)
{
if(flag[index])
num += data_1[index] + data_2[index];
else 
num += data_1[index] - data_2[index];
}
NOTOPTIMIZE(num);
}

```

产生随机数字和有规律数字。

```bash

// 随机生成标志和数字
void random_generate(std::vector<int>& data_1,
                     std::vector<int>& data_2,
                     std::vector<uint8_t>& flag)
{
flag.reserve(N);
data_1.reserve(N);
data_2.reserve(N);

// 设置随机数种子
srand(time(nullptr));

for(int count = 0 ; count < N; count++)
{
data_1.push_back(rand());
data_2.push_back(rand());
flag.push_back(rand() & 0x1);
}
}


// 有规律生成标志和数字
void regular_generate(std::vector<int>& data_1,
                      std::vector<int>& data_2,
                      std::vector<uint8_t>& flag)
{
flag.reserve(N);
data_1.reserve(N);
data_2.reserve(N);

for(int count = 0 ; count < N; count++)
{
data_1.push_back(rand());
data_2.push_back(rand());
flag.push_back(count  & 0x1);
}
}

```

执行过程。

```bash

int main()
{

std::vector<int> data_1;
std::vector<int> data_2;
std::vector<uint8_t> flag;
std::cout<<"-----Random Number test----"<<std::endl;
random_generate(data_1,data_2, flag);
deal_with_data(data_1,data_2, flag);


data_1.clear();
data_2.clear();
flag.clear();

std::cout<<"-----Ragular Number test----"<<std::endl;
regular_generate(data_1,data_2, flag);
deal_with_data(data_1,data_2, flag);
}

```

## 实验结果

![](/img/in-post/25-07/branch_prediction.png)
<small class="img-hint">实验结果</small>

从上面的实验结果来看,有规律的数字,分支预测电路能取得比较好的结果,但是在面对
大量无规律的数字时,分支预测电路便失去了它的优势。
