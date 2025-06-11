---
layout:     post
title:      "Problem of USB Flash Driver"
subtitle:   " \"thinking and learning \""
date:       2025-06-11 17:06:00
author:     "Ju-yzp"
header-img: "img/disk.png"
tags:
    - 存储介质
---

> “每天胡思乱想，有时候想人，有时候想事. “

## 背景
由于自己电脑的磁盘大小只有512GB，而且在经过两年的大学生活后，电脑磁盘容量所剩无几，尤其是虚拟机等资源占用较多的磁盘空间。我在经过一番考虑后打算删除我的其中一个ubuntu20.04虚拟机，因为它对于我已经不存在什么价值了，然后我就把虚拟机资源拷贝一份至u盘以避免真的有重要的东西被我删掉。

但是在拷贝途中，我觉得真的没有什么东西好拷贝的，然后直接强行停止拷贝的进程，删除虚拟机。

## 意想不到的问题

![u盘总文件大小](/img/in-post/25-06-11/size_display.png)
<small class="img-hint">u盘总文件大小</small>

![磁盘空间](/img/in-post/25-06-11/file_system.png)
<small class="img-hint">磁盘空间</small>

我的u盘有62GB大小(虽然实际上是64GB，但是厂家使用了一部分存储测试文件等)，但是现在里面的文件大小大约只有5GB，显示磁盘可用空间仅为302MB。

## 原因

我带着疑问下载了baobab(一款Uinx发行版下查询磁盘空间具体信息的软件)

```bash
#使用apt下载baobab
sudo apt update
sudo apt install baobab
#如果源有问题不能被下载，就考虑换国内源
#例如清华源，中科大源，阿里源
#因为默认源都是从外国的服务器获取资源的，所以连接不上
```

在下面的图中你可以看见磁盘空间内具体的文件信息

![全部文件显示](/img/in-post/25-06-11/real_size.png)
<small class="img-hint">具体磁盘空间信息</small>

看到这里，我们也知道原因:u盘是一种存储介质，在软件层面是一个文件系统，厂家们也给它设计了一个回收站机制，我们只需要
把垃圾站里的文件彻底删除，那么这块磁盘空间就会标记为未使用的。




