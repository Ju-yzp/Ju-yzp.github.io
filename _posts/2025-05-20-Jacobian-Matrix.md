---
layout: mypost
title: 几何雅各比矩阵
categories: [机械臂]
---

Update: 2020/02/05

系统版本 CentOS 7

## 服务器配置

### 安装常用软件

```sh
yum update
yum groupinstall -y "Development Tools"
yum install cmake wget openssl openssl-devel yum-utils
yum install bash-completion lrzsz scl-utils screen net-tools telnet
yum install curl libcurl libcurl-devel bzip2 bzip2-deve libffi-devel
yum install freetype freetype-devel libjpeg libjpeg-devel
yum install libpng libpng-devel sqlite sqlite-devel
yum install libxml2 libxml2-devel libxslt libxslt-devel