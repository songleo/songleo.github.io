---
layout: post
title: 如何通过criu checkpoint/restore应用
date: 2018-05-29 00:05:00
---

[criu](https://criu.org/Main_Page)是linux平台在用户空间实现checkpoint/restore功能的工具软件。通过该工具，可以冻结正在运行的应用程序或者其中的一部分，并将应用程序的执行状态以文件形式保存在磁盘上，然后通过这些快照文件，可以将应用程序从冻结的时间点恢复回来继续运行。借助该软件，可以实现应用的实时迁移、应用快照和远程调试等功能。criu最显著的特点是在用户空间实现checkpoint/restore，不需要修改应用程序或者操作系统，并且也是内核中功能最丰富和最活跃的。

本文主要介绍如何在centos7安装criu，并通过criu checkpoint冻结应用，然后restore恢复应用。

### 1 安装criu

```
$ yum install -y criu
Loaded plugins: fastestmirror, langpacks
Loading mirror speeds from cached hostfile
 * base: mirrors.cqu.edu.cn
 * epel: mirrors.tongji.edu.cn
 * extras: mirrors.cqu.edu.cn
 * ius: mirrors.tongji.edu.cn
 * updates: mirrors.shu.edu.cn
Resolving Dependencies
--> Running transaction check
---> Package criu.x86_64 0:3.5-4.el7 will be installed
--> Finished Dependency Resolution
```

运行yum install -y criu命令即可安装criu。

### 2 设置应用的checkpoint

示例程序是一个不断打印数字的c程序，checkpoint_demo.c代码如下：

```c
#include <stdio.h>
#include <unistd.h>

int main(int argc, char const *argv[])
{
    int i = 0;
    for (i = 0; i < 100; ++i)
    {
        sleep(1);
        printf("%d\n", i);
    }
    return 0;
}
```

编译代码后，示例程序运行效果如下：

```
$ ./checkpoint_demo
0
1
2
3
4
5
6
```

将示例程序复制到/root/chkpnt_dir目录。

```
$ pwd
/root/chkpnt_dir
$ ls -l
total 12
-rwxr-x---. 1 root root 8576 May 29 10:44 checkpoint_demo
```

可以看到，在/root/chkpnt_dir目录下只有一个文件checkpoint_demo，运行示例程序：

```
$ ./checkpoint_demo
0
1
2
3
4
5
6
7
8
```

打开一个新终端，查找示例程序的进程号，通过criu设置应用的checkpoint。

```
$ ps -ef | grep checkpoint_demo
root     15748 15340  0 10:56 pts/1    00:00:00 ./checkpoint_demo
root     15751 15479  0 10:56 pts/2    00:00:00 grep --color=auto checkpoint_demo
$ criu dump -D /root/chkpnt_dir/ -j -t 15748
Warn  (compel/arch/x86/src/lib/infect.c:249): Will restore 15748 with interrupted system call
$ ps -ef | grep checkpoint_demo
root     15963 15479  0 11:03 pts/2    00:00:00 grep --color=auto checkpoint_demo
$ ls -l
total 164
-rw-r--r--. 1 root root   3475 May 29 10:56 cgroup.img
-rwxr-x---. 1 root root   8576 May 29 10:44 checkpoint_demo
-rw-r--r--. 1 root root   1778 May 29 10:56 core-15748.img
-rw-r--r--. 1 root root     44 May 29 10:56 fdinfo-2.img
-rw-r--r--. 1 root root    359 May 29 10:56 files.img
-rw-r--r--. 1 root root     18 May 29 10:56 fs-15748.img
-rw-r--r--. 1 root root     32 May 29 10:56 ids-15748.img
-rw-r--r--. 1 root root     40 May 29 10:56 inventory.img
-rw-r--r--. 1 root root    747 May 29 10:56 mm-15748.img
-rw-r--r--. 1 root root    184 May 29 10:56 pagemap-15748.img
-rw-r--r--. 1 root root 106496 May 29 10:56 pages-1.img
-rw-r--r--. 1 root root     26 May 29 10:56 pstree.img
-rw-r--r--. 1 root root     37 May 29 10:56 stats-dump
-rw-r--r--. 1 root root    177 May 29 10:56 tty-info.img
```

通过criu的dump命令，-D选项指定应用的快照文件保存目录，-j表示该应用是一个通过shell启动的作业，通过-t指定需要checkpoint的应用pid。当对应用设置checkpoint后，应用会自动退出，如果希望应用继续执行，需指定-R或--leave-running选项。由示例中可以看到，当设置进程15748的checkpoint后，再查找该进程，发现进程不存在，即进程已经退出。查看快照文件目录，生成很多img文件，这些文件主要用于恢复应用。这时候查看运行示例程序的终端，会发现程序已经终止运行，如下：

```
$ ./checkpoint_demo
0
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
Killed
```

即示例程序在输出26后，由于设置checkpoint被kill掉了。

### 3 恢复应用

```
$ criu restore -D /root/chkpnt_dir/ -j
27
28
29
30
31
32
33
34
35
36
```

```
$ ps -ef | grep checkpoint_demo
root     15748 15749  0 11:05 pts/2    00:00:00 ./checkpoint_demo
root     15759 15340  0 11:05 pts/1    00:00:00 grep --color=auto checkpoint_demo
```

通过criu的restore命令，-D选项指定应用的快照文件保存目录，checkpoint时指定的应用程序是由shell启动，所以restore时需要指定相应的-j选项。由示例中可以看到，恢复后的程序从设置checkpoint的时间点继续运行，程序在输出26时被kill掉，恢复后继续输出27，恢复后查找进程15748，发现进程使用原来的进程号继续运行。
