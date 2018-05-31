---
layout: post
title: 如何调试windows的stackdump文件
date: 2016-12-29 20:52:32
---

在windows上，通过cygwin编译的c程序在运行时，若有内存错误也会产生类似linux上的core文件，但是该文件一般是以stackdump为后缀的文本文件，且文件提供的信息有限，只包含了程序coredump时函数调用的栈信息，不能像linux一样使用gdb调试。所以，在windows平台调试cygwin编译的c程序不太方便。本文介绍一种方法，通过反汇编c程序，结合程序coredump时生成的stackdump文件，可以快速定位出程序的coredump位置。

示例c程序如下：

```c
#include <stdio.h>
#include <stdlib.h>

int f2() {
    printf("entering %s...\n", __func__);
    char *buff = "0123456789";
    free(buff);  // coredump
    printf("leaving %s...\n", __func__);
    return 0;
}

int f1() {
    printf("entering %s...\n", __func__);
    f2();
    printf("leaving %s...\n", __func__);
    return 0;
}

int main()
{
    printf("entering %s...\n", __func__);
    f1();
    printf("leaving %s...\n", __func__);
    return 0;
}
```

该程序在运行时，会产生stackdump文件。因为在f2函数中，调用free释放的内存不是由malloc分配，所以导致程序coredump。当然，这个示例程序比较简答，很容易就知道是由于free非法内存导致coredump。但如果在一个大项目中，定位coredump位置就没那么容易了。

使用cygwin的gcc编译该程序：

    gcc core_dump_demo.c -g -o core_dump_demo

这里需要使用-g选项，编译时添加调试信息，编译成功会生成一个可执行文件core_dump_demo.exe，然后使用反汇编工具objdump，将该可执行文件反汇编，运行下面命令反汇编该示例程序：

    objdump -D -S core_dump_demo.exe > core_dump_demo.rasm

这里将反汇编的结果重定向到core_dump_demo.rasm文件，由于该文件较大，这里只附上f2函数的反汇编结果，如下：

```
int f2() {
   1004010e0:   55                      push   %rbp
   1004010e1:   48 89 e5                mov    %rsp,%rbp
   1004010e4:   48 83 ec 30             sub    $0x30,%rsp
    printf("entering %s...\n", __func__);
   1004010e8:   48 8d 15 6b 1f 00 00    lea    0x1f6b(%rip),%rdx        # 10040305a <__func__.3391>
   1004010ef:   48 8d 0d 3a 1f 00 00    lea    0x1f3a(%rip),%rcx        # 100403030 <.rdata>
   1004010f6:   e8 f5 00 00 00          callq  1004011f0 <printf>
    char *buff = "0123456789";
   1004010fb:   48 8d 05 3e 1f 00 00    lea    0x1f3e(%rip),%rax        # 100403040 <.rdata+0x10>
   100401102:   48 89 45 f8             mov    %rax,-0x8(%rbp)
    free(buff);  // core dump location
   100401106:   48 8b 45 f8             mov    -0x8(%rbp),%rax
   10040110a:   48 89 c1                mov    %rax,%rcx
   10040110d:   e8 ce 00 00 00          callq  1004011e0 <free>
    printf("leaving %s...\n", __func__);
   100401112:   48 8d 15 41 1f 00 00    lea    0x1f41(%rip),%rdx        # 10040305a <__func__.3391>
   100401119:   48 8d 0d 2b 1f 00 00    lea    0x1f2b(%rip),%rcx        # 10040304b <.rdata+0x1b>
   100401120:   e8 cb 00 00 00          callq  1004011f0 <printf>
    return 0;
   100401125:   b8 00 00 00 00          mov    $0x0,%eax
}
   10040112a:   48 83 c4 30             add    $0x30,%rsp
   10040112e:   5d                      pop    %rbp
   10040112f:   c3                      retq
```

在命令行中运行该示例程序，输出如下：

```
E:\share>core_dump_demo.exe
entering main...
entering f1...
entering f2...
      1 [main] core_dump_demo 5476 cygwin_exception::open_stackdumpfile: Dumping
 stack trace to core_dump_demo.exe.stackdump
```

并在当前目录生成一个core_dump_demo.exe.stackdump文件，内容如下：

```
Stack trace:
Frame        Function    Args
000FFFFC400  0018005C48C (000FFFFE3F4, 0010000F54C, 0018006D05E, 000FFFFDE50)
000FFFFC4A0  0018005DA6B (00000000000, 00100000000, 0000000014C, 00000000000)
000FFFFC6F0  0018011F0D0 (00000000000, 00000000000, 00000000000, 000FFFFC9A4)
000FFFFC9E0  0018011BDAE (00000000000, 00000000000, 00000000000, 000FFFFC9F0)
000FFFFCB80  0018011C249 (00000000002, 00000000000, 000FFFFCC62, 00000000006)
000FFFFCB80  0018011C41A (000FFFFCA50, 00100403060, 00180143308, 001801430C0)
000FFFFCB80  0018011C6DF (00000000000, 000FFFFCB80, 00100403040, 00100403040)
000FFFFCB80  00180154325 (001801FB870, 00100403030, 000FFFFCB60, 00000000000)
000FFFFCB80  001800B9A63 (0010040305A, 000FFFFC8CC, 0018013D2D0, 00180219E83)
000FFFFCB80  00180117A4B (0010040305A, 000FFFFC8CC, 0018013D2D0, 00180219E83)
000FFFFCB80  00100401112 (0010040305D, 000FFFFC8FC, 0018013D2D0, 000FFFFCBE0)
000FFFFCBB0  00100401150 (00100403060, 00000000000, 00000000000, 000FFFFCCC0)
000FFFFCBE0  00100401193 (00000000020, FF06FF010000FF00, 00180047931, 000FFFFCDF0)
000FFFFCCC0  001800479A2 (00000000000, 00000000000, 00000000000, 00000000000)
00000000000  00180045733 (00000000000, 00000000000, 00000000000, 00000000000)
000FFFFFFF0  001800457E4 (00000000000, 00000000000, 00000000000, 00000000000)
End of stack trace (more stack frames may be present)
```

可以看到，该文件只提供了程序在coredump时函数调用的栈信息。如果只看这个stackdump文件，没法看出程序具体在哪个位置coredump。通过分析该文件，可以看见文件中的函数地址主要有2个段，分别是：

    00180xxxxxx
    00100xxxxxx

从反汇编文件中可以看到，00100xxxxxx地址段是示例程序中函数地址，而00180xxxxxx地址段应该是cygwin库函数地址段。由于栈是先进后出，所以在stackdump文件中，从下往上才是函数的调用顺序。在反汇编文件中查找coredump时最后调用的地址00100401112，就可以定位出具体的coredump位置了。这里需要指出，反汇编文件中的函数地址段没有前2个0，所以在反汇编文件查找00100401112时要省去前面2个0，经过查找，可以看到该地址位于函数f2。如下所示：

```
free(buff);  // coredump
100401106:   48 8b 45 f8             mov    -0x8(%rbp),%rax
10040110a:   48 89 c1                mov    %rax,%rcx
10040110d:   e8 ce 00 00 00          callq  1004011e0 <free>
printf("leaving %s...\n", __func__);
100401112:   48 8d 15 41 1f 00 00    lea    0x1f41(%rip),%rdx        # 10040305a <__func__.3391>
```

至此，就可以知道coredump位置位于地址00100401112的上一行代码，即调用free函数时coredump，如下：

```
10040110d:   e8 ce 00 00 00          callq  1004011e0 <free>
```

#### 本次荐书：写给大家看的设计书

![image](https://img13.360buyimg.com/n1/jfs/t2566/258/875499688/174965/1fb0edb3/566e85eeN3c005a34.jpg)

