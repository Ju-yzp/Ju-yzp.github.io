---
layout:     post
title:      "Problem of USB Flash Driver"
subtitle:   " \"thinking and learning \""
date:       2025-06-11 17:06:00
author:     "Ju-yzp"
header-img: "img/disk.png"
tags:
    - 储存介质
---

> “待更新. “

## 背景
由于自己电脑的磁盘大小只有512GB，而且在经过两年的大学生活后，电脑磁盘容量所剩无几，尤其是虚拟机等资源占用较多的磁盘空间。我在经过一番考虑后打算删除我的其中一个ubuntu20.04虚拟机，因为它对于我已经不存在什么价值了，然后我就把虚拟机资源拷贝一份至u盘以避免真的有重要的东西被我删掉。

但是在拷贝途中，我觉得真的没有什么东西好拷贝的，然后直接强行停止拷贝的进程，删除虚拟机。

## 意想不到的问题

![u盘总文件大小](/img/in-post/25-06-11/size_display.png)
<small class="img-hint">u盘总文件大小</small>

![磁盘空间](/img/in-post/25-06-11/file_system.png)
<small class="img-hint">磁盘空间</small>

我的u盘有62GB大小(虽然实际上是64GB，但是厂家使用了一部分存储测试文件等)，但是现在里面的文件大小大约只有5GB，显示磁盘可用空间仅为302MB。

