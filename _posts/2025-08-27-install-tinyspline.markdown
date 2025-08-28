---
layout:     post
title:      "Installing Tinyspline By Conan"
subtitle:   " \"To see who you love\""
date:       2025-07-27 23:26:00
author:     "Ju-yzp"
header-img: "img/in-post/25-08/basic_spline.png"
tags:
    - 运动规划
---

> 当未实现时，请不要过度的强调优雅，那只会成为你失败的借口

# 动机

由于tinyspline（用于样条插值的库）的作者在apt上没有更新，但是在conan上是一直更新的，并且作者在github上也是推荐使用conan下载cpp版本的，所以本次博客将带领大家完成一次使用conan下载tinyspline并链接编译一个demo.

# 下载tinyspline

## 下载conan

```sh
pip install conan
# pip可以替换成pip3
```

考虑到其实我们一版都是在ubuntu系统下下载pip，接下来就不讨论macOS下会碰到的问题以及解决措施，遇到问题的同学请查看[conan官方](https://docs.conan.io/2/installation.html)

## conan配置文件

conan可以通过conanfile.txt读取需要下载的库配置，进行相关行动

```sh
touch conanfile.txt #在项目根目录下

# conanfile.txt内容
[requires]
tinyspline/0.6.0  # 指定下载库与对应版本

[generators]
CMakeDeps
CMakeToolchain # 产生cmake工作链
```

除了conan我们还需要一个conan file来构建我们的项目，conan配置允许使用者能给编译器，构建配置，体系，共享库或者静态库这类事物定义一个配置集.由于conan默认不会自动尝试配置，所以我们自己要创建一个.为了让conan尝试基于最近的操作系统以及下载工具猜测配置，我们打开一个新的终端，运行以下命令:

```sh
conan profile detect --force
```

## 输出cmake工具链文件

接下来我们会使用conan下载tinyspline并产生能使得cmake能找的下载库，然后构建我们项目的文件(tinysplineConfig.cmake等一系列cmake文件)

```sh
conan install . --output-folder=build --build=missing
```
在这个命令运行前，请确保在当前目录下有build子目录存在，cmake文件将默认输出至build目录中


## demo


main.cpp

```sh

#include <iostream>
#include "tinysplinecxx.h"

int main(int argc, char **argv)
{
	std::vector<tinyspline::real> points;
	// P0
	points.push_back(1600); // time
	points.push_back(10);
	points.push_back(100);
	points.push_back(1);
	// P1
	points.push_back(1650); // time
	points.push_back(20);
	points.push_back(200);
	points.push_back(2);
	// P2
	points.push_back(1700); // time
	points.push_back(30);
	points.push_back(300);
	points.push_back(3);
	// P3
	points.push_back(1800); // time
	points.push_back(40);
	points.push_back(400);
	points.push_back(4);
	// P4
	points.push_back(1900); // time
	points.push_back(80);
	points.push_back(600);
	points.push_back(10);
	// P5
	points.push_back(2000); // time
	points.push_back(40);
	points.push_back(400);
	points.push_back(4);

	tinyspline::BSpline spline = tinyspline::BSpline::
		interpolateCubicNatural(points, 4);

	tinyspline::DeBoorNet net = spline.bisect(1850);
	std::vector<tinyspline::real> result = net.result();
	std::cout << "t = " << result[0] << ", p = (" << result[1] << ", "
			<< result[2] << ", " << result[3] << ")" << std::endl;
}

```
CMakeLists.txt

```sh
cmake_minimum_required( VERSION 3.10 )
project( test_basic_spline )

find_package( tinyspline )

add_executable( ${PROJECT_NAME} src/main.cpp )

target_include_directories( ${PROJECT_NAME} PRIVATE 
    $<BUILD_INTERFACE:${PROJECT_SOURCE_DIR}/include>
        ${tinyspline_INCLUDE_DIRS} )
    
target_link_libraries( ${PROJECT_NAME} PRIVATE 
        ${tinyspline_LIBRARIES}
)

install( TARGETS ${PROJECT_NAME}
         DESTINATION lib/${PROJECT_NAME}) 
```

打开一个新的终端,进入build目录下

```sh
cmake .. -DCMAKE_TOOLCHAIN_FILE=conan_toolchain.cmake -DCMAKE_BUILD_TYPE=Release

cmake --build .

./test_basic_spline
```

如果你能看见以下输出的话，就说明你这次的下载和链接非常成功

```sh
t = 1850, p = (62.9224, 518.696, 7.39752)
```