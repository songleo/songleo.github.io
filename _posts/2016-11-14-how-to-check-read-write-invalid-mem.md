---
layout: post
title: valgrind使用：检测内存非法读写
date: 2016-11-14 21:47:32
---

本文简单介绍c开发如何通过valgrind检测内存非法读写，避免发生不可预测行为。

## 什么内存非法读写

#### 非法写内存

非法写内存是指往不属于你分配的内存中写入数据。比如malloc一段内存，大小只有5个字节，那么你只能往这5个字节空间写入数据，在这5字节的内存空间之外写入数据，都是非法的。比如写数组时越界，拷贝字符串时忘记结尾结束符。

#### 非法读内存

非法读内存是指从不属于你分配的内存读取数据。比如malloc一段内存，大小只有5个字节，并拷贝数据到该内存，大小刚好5个字节。但是在读取数据时，在这5字节的内存空间之外读取数据，都是非法的。类似的例子也是数组访问越界和字符串拷贝时忘记结束符占一个字节。

## 使用valgrind检测内存非法读写

示例代码如下：

```
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main () {
    int index;
    char *buffer = (char *)malloc(5);
    strcpy(buffer, "01234");
    for (index = 0; index < 5; ++index)
    {
        printf("buffer[%d] = %c\n", index, buffer[index]);
    }


    printf("buffer[%d] = %c\n", 5, buffer[5]);
    printf("buffer[%d] = %c\n", 6, buffer[6]);
    free(buffer);
    return 0;
}

```

### 程序输出入下

```
buffer[0] = 0
buffer[1] = 1
buffer[2] = 2
buffer[3] = 3
buffer[4] = 4
buffer[5] = 
buffer[6] = 

```

### 编译并使用valgrind检测内存非法读写

```
root@leo:demo# gcc -o valgrind_test_for_read_invalid_mem 
valgrind_test_for_read_invalid_mem.c
root@leo:demo# valgrind --leak-check=full 
./valgrind_test_for_read_invalid_mem 1 > valgrind_demo.log 2>&1
```

### 查看检测结果

```
root@leo:demo# cat valgrind_demo.log 
==3879== Memcheck, a memory error detector
==3879== Copyright (C) 2002-2013, and GNU GPL'd, by Julian Seward et al.
==3879== Using Valgrind-3.10.1 and LibVEX; rerun with -h for copyright info
==3879== Command: ./valgrind_test_for_read_invalid_mem 1
==3879== 
==3879== Invalid write of size 2
==3879==    at 0x4005DD: main (valgrind_test_for_read_invalid_mem.c:8)
==3879==  Address 0x51fc044 is 4 bytes inside a block of size 5 alloc'd
==3879==    at 0x4C2AB80: malloc (in /usr/lib/valgrind/vgpreload_memcheck-amd64-linux.so)
==3879==    by 0x4005CE: main (valgrind_test_for_read_invalid_mem.c:7)
==3879== 
==3879== Invalid read of size 1
==3879==    at 0x400625: main (valgrind_test_for_read_invalid_mem.c:15)
==3879==  Address 0x51fc045 is 0 bytes after a block of size 5 alloc'd
==3879==    at 0x4C2AB80: malloc (in /usr/lib/valgrind/vgpreload_memcheck-amd64-linux.so)
==3879==    by 0x4005CE: main (valgrind_test_for_read_invalid_mem.c:7)
==3879== 
==3879== Invalid read of size 1
==3879==    at 0x400649: main (valgrind_test_for_read_invalid_mem.c:16)
==3879==  Address 0x51fc046 is 1 bytes after a block of size 5 alloc'd
==3879==    at 0x4C2AB80: malloc (in /usr/lib/valgrind/vgpreload_memcheck-amd64-linux.so)
==3879==    by 0x4005CE: main (valgrind_test_for_read_invalid_mem.c:7)
==3879== 
buffer[0] = 0
buffer[1] = 1
buffer[2] = 2
buffer[3] = 3
buffer[4] = 4
buffer[5] = 
buffer[6] = 
==3879== 
==3879== HEAP SUMMARY:
==3879==     in use at exit: 0 bytes in 0 blocks
==3879==   total heap usage: 1 allocs, 1 frees, 5 bytes allocated
==3879== 
==3879== All heap blocks were freed -- no leaks are possible
==3879== 
==3879== For counts of detected and suppressed errors, rerun with: -v
==3879== ERROR SUMMARY: 4 errors from 3 contexts (suppressed: 0 from 0)
```

由日志可以看出，首先是非法写入了2个字节，因为分配了5个字节的内存，只能容纳下4个字符加上字符串结尾符，共5个字节，但是程序中拷贝了5个字节数据，加上字符串结尾符，共有6个字节。即非法写入了buffer[4]和buffer[5]，因为buffer[4]应该是字符串结尾符，而buffer[5]不是程序分配的内存空间。其次，非法读取了2字节数据，即buffer[5]和buffer[6]，程序只分配了5个字节，即buffer[0]-buffer[4]，因此只能读取这5个字节内容。



本次荐书：数学之美


![image](http://img12.360buyimg.com/n1/s200x200_jfs/t535/313/495218117/815050/9be8097a/546b1647N4326ba2c.jpg)

