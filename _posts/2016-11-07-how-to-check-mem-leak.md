---
layout: post
title: valgrind使用：检测内存泄漏
date: 2016-11-07 20:30:32
---


本文简单介绍c开发中的内存泄漏和动态内存分配函数，并使用valgrind分析c程序的内存泄漏问题。

## 1 什么是内存泄漏

c语言中，需由开发者负责内存的申请和释放，内存泄漏是指开发者在程序中使用动态内存分配函数**xxlloc**在堆(heap)上申请内存，内存在使用完毕后未使用free函数释放，那么这块内存在程序退出前都不能再次使用，导致内存使用逐渐增大，直至耗尽，程序异常退出。

> xxlloc函数指malloc、realloc和calloc

## 2 c动态内存分配函数有哪些

- void *malloc(size_t size): 分配大小为size字节的内存空间，并返回指向分配内存的指针。若分配内存失败，返回NULL，该函数不初始化其分配的内存空间。

- void *realloc(void *p, size_t size): 将p指向的内存空间修改为size个字节。若新内存空间比p指向的内存大，则p指向的内存的内容不变，反之内存被截取。增加的新内存不被初始化。返回指向新内存的指针，若分配失败，返回NULL，p指向的内存空间的内容不变。

- void *calloc(size_t nobj, size_t size): 
 
分配nobj*size字节大小的内存空间，并返回指向新内存的指针。若分配失败，返回NULL，该函数和malloc的区别是：malloc不初始化其分配的内存，而calloc会初始化其分配的内存。

- void free(void *p): 释放p指向的内存空间，在使用free函数前，必须确保p是指向由xxlloc分配的内存空间。当p=NULL，该函数不执行任何操作。

## 3 使用valgrind检测内存泄漏

示例代码如下：

```
#include <stdio.h>
#include <stdlib.h>

void my_malloc() {
    char *buffer = (char *)malloc(1024);
    // free(buffer);
}

int main () {
    my_malloc();
    return 0;
}
```

### 4 编译并使用valgrind检测内存

```
root@leo:demo# gcc valgrind_demo.c -o valgrind_demo 
root@leo:demo# valgrind --leak-check=full 
./valgrind_demo 1 > valgrind_demo.log 2>&1
```

### 5 查看检测结果

```
root@leo:demo# cat valgrind_demo.log 
==3936== Memcheck, a memory error detector
==3936== Copyright (C) 2002-2013, and GNU GPL'd, by Julian Seward et al.
==3936== Using Valgrind-3.10.1 and LibVEX; rerun with -h for copyright info
==3936== Command: ./valgrind_demo 1
==3936== 
==3936== 
==3936== HEAP SUMMARY:
==3936==     in use at exit: 1,024 bytes in 1 blocks
==3936==   total heap usage: 1 allocs, 0 frees, 1,024 bytes allocated
==3936== 
==3936== 1,024 bytes in 1 blocks are definitely lost in loss record 1 of 1
==3936==    at 0x4C2AB80: malloc (in /usr/lib/valgrind/vgpreload_memcheck-amd64-linux.so)
==3936==    by 0x40053E: my_malloc (in /media/sf_share/git/c/demo/valgrind_demo)
==3936==    by 0x400552: main (in /media/sf_share/git/c/demo/valgrind_demo)
==3936== 
==3936== LEAK SUMMARY:
==3936==    definitely lost: 1,024 bytes in 1 blocks
==3936==    indirectly lost: 0 bytes in 0 blocks
==3936==      possibly lost: 0 bytes in 0 blocks
==3936==    still reachable: 0 bytes in 0 blocks
==3936==         suppressed: 0 bytes in 0 blocks
==3936== 
==3936== For counts of detected and suppressed errors, rerun with: -v
==3936== ERROR SUMMARY: 1 errors from 1 contexts (suppressed: 0 from 0)
```

由日志可以看出，函数`my_malloc`分配了1024字节内存，直到程序退出都没有释放内存，造成内存泄漏。


### 6 没有内存泄漏的检测结果

将函数`my_malloc`中的注释语句打开，检测结果如下：

```
root@leo:demo# cat valgrind_demo.log 
==3967== Memcheck, a memory error detector
==3967== Copyright (C) 2002-2013, and GNU GPL'd, by Julian Seward et al.
==3967== Using Valgrind-3.10.1 and LibVEX; rerun with -h for copyright info
==3967== Command: ./valgrind_demo 1
==3967== 
==3967== 
==3967== HEAP SUMMARY:
==3967==     in use at exit: 0 bytes in 0 blocks
==3967==   total heap usage: 1 allocs, 1 frees, 1,024 bytes allocated
==3967== 
==3967== All heap blocks were freed -- no leaks are possible
==3967== 
==3967== For counts of detected and suppressed errors, rerun with: -v
==3967== ERROR SUMMARY: 0 errors from 0 contexts (suppressed: 0 from 0)
```

由日志可以看出没有造成内存泄漏，因为分配的内存被正确释放了。

## 7 参考

c程序设计语言


## 本次荐书：程序员的呐喊

![image](http://img10.360buyimg.com/n1/s200x200_jfs/t1588/15/333780144/52388/20c263a8/5577937bN85d703f0.jpg)

