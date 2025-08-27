---
layout:     post
title:      "Cache Coherency Animation"
subtitle:   " \"Love your life\""
date:       2025-07-09 22:14:00
author:     "Ju-yzp"
header-img: "img/sunset.jpg"
tags:
    - 缓存一致性
---


# 缓存一致性

对数据进行某一项操作时，保证是以最新数据为操作对象.

## Write-once

### 状态

|status|meanning|
|:---:|:---:|
|Invaild|cpu缓存中没有这个内容，未命中|
|Vaild|可能存在多个cpu缓存拥有同一个变量，并且他们的数据与内存中的保存一致|
|Reserved|只有一个cpu拥有数据在缓存中，而且数据与内存中的一致，数据经过修改|
|Dirty|cpu缓存独有一份，而且是最新的，与内存中的数据不同|

### 状态转换
&ensp;&ensp;&ensp;&ensp;如果要对某个数据作读取操作,此时缓存中还没有数据,那么将会通过地址总线给其他缓存块发消息,如果有缓存块处于Dirty状态,那么将会数据更新至内存中,然后通过内存读取数据,加载数据至对应缓存中.同时,这两个缓存块状态会被更新为Vaild.


&ensp;&ensp;&ensp;&ensp;当缓存块处于Reseved状态,如果此时要对数据作写入操作,那么将会将修改后的数据写入缓存,同时,不将数据更新到内存中,其他持有同一个数据处于Vaild状态的内存块将会更新为Invaild状态.

&ensp;&ensp;&ensp;&ensp;当缓存块处于Vaild状态,如果此时要对数据作写入操作,那么将会把数据更新至内存中，同时状态变为Reserved,其他处于Vaild状态的将会变为Ivaild状态.

&ensp;&ensp;&ensp;&ensp;当缓存块处于Resered状态，如果此时对数据做修改操作，那么状态会变为Dirty,同时数据不会更新至内存.

### 总结

## Write-through


## MESI

### 状态

|status|meanning|
|:---:|:---:|
|Invaild|缓存中没有这个数据|
|Exclusive|数据与缓存一致，并且只有一个缓存有数据|
|Shared|数据与内存一致，可能存在多个缓存都拥有数据|
|Modified|数据与内存不一致，并且只有一个缓存有数据|

### 状态转换

&ensp;&ensp;&ensp;当缓存处于Invaild状态时，如果对数据作读取操作，那么将会查看拥有目标数据的缓存是否处于Modified/Shared/Exclusive状态.如果有Exclusive状态，那么将数据加载至缓存中，两个缓存状态变为Shared.如果有Shared状态，那么将数据加载至缓存中，缓存状态变为Shared.如果有Modified状态，那么将会数据更新至内存，同时将数据加载至缓存中，两个缓存状态变为Shared.

&ensp;&ensp;&ensp;&ensp;当缓存处于Shared状态时，如果对数据作修改操作，那么将会变为Exlusive状态，将数据更新至内存,其他处于Shread状态的缓存会变为Invaild状态.

&ensp;&ensp;&ensp;当缓存处于Exlusive状态时，如果对数据作修改操作，那么将会变为Modified状态，不将数据更新至内存.

&ensp;&ensp;&ensp;当缓存处于Invaild状态时，如果对数据作修改操作，那么将会变为Exclusive状态，将数据更新至内存,其他处于任何状态的缓存都会变为Invaild状态.