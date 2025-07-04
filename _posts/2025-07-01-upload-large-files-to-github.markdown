---
layout:     post
title:      "Upload Large Files To Github"
subtitle:   " \"love which you love\""
date:       2025-06-13 21:06:00
author:     "Ju-yzp"
header-img: "img/sun.jpg"
tags:
    - github
---

> 经常会思绪纷飞

# 上传大型文件至github

## 下载工具

GIT LFS支持GB级别的大文件版本控制

[GIT LFS下载路径](https://packagecloud.io/github/git-lfs/install)

```bash
#ubuntu22.04下载
sudo apt-get install git-lfs
```

## 使用Git Lfs管理大型文件

```bash
# 配置Git Lfs
git lfs track "*.pdf" # 跟踪所有位于项目目录下后缀名为pdf的文件

# 查看当前追踪的文件类型
git lfs track

# 提交.gitattribute文件，以时使得配置生效
git add .gitattribute
git commit -m <message>

# 上传文件至github
git add .
git commit -m <message>
git push
```
