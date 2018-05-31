---
layout: post
title: linux应用如何进行cpu绑定
date: 2018-05-31 00:05:00
---

所谓cpu绑定，其实就是对进程或线程设置相应的cpu亲和力（affinity），确保进程或线程只会在设置了相应标志位的cpu上运行，进而提高应用对cpu的使用效率。如果应用在多个cpu上运行，操作系统会将应用在各个cpu之间频繁切换，引起cpu缓存失效，降低缓存的命中率，导致cpu的使用效率下降。所以，如果使用cpu绑定技术，在一定程度上会避免上述问题，提升系统性能，类似技术还有gpu绑定、mic绑定等等。

> There are only two hard things in Computer Science: cache invalidation and naming things.
>
> -- Phil Karlton

### 1 安装taskset

```
$ yum install util-linux
```

如果系统没有taskset命令，使用yum安装util-linux即可，这是一个工具集，其中包含了taskset命令。

### 2 查看应用的cpu亲和力（affinity）

```
$ taskset -p 14795
pid 14795's current affinity mask: 3
$ taskset -cp 14795
pid 14795's current affinity list: 0,1
```

示例中，先查看进程14795的cpu亲和力，如果使用-p选项指定需要查询的进程号，默认打印的是一个十六进制数3，如果使用-cp选项打印的是一个cpu列表，表示相应的cpu核。3的二进制形式是0011，相应的第0位和第1位都是1，对应了-cp打印的0和1，表示14795进程运行在cpu的第0个核和第1个核。

### 3 将应用绑定到指定的cpu运行

```
$ taskset -p 0x1 14795
pid 14795's current affinity mask: 3
pid 14795's new affinity mask: 1
```

或

```
$ taskset -cp 0 14795
pid 14795's current affinity list: 0,1
pid 14795's new affinity list: 0
```

示例中，通过taskset命令重新设置了进程14795的cpu亲和力，2种方式等效，都是表示进程14795只能运行在cpu的第0个核。因为-p指定的0x01二进制形式为0001，第0位是1，表示第0个cpu核。而-cp直接指定了0，表示指定进程运行在第0个cpu核上面。

除了通过taskset命令绑定应用到指定的cpu，也可以通过taskset命令启动应用，并指定应用运行的cpu，例如：

```
$ taskset 0x1 sleep 10000 &
[2] 14925
$ taskset -p 14925
pid 14925's current affinity mask: 1
$ taskset -cp 14925
pid 14925's current affinity list: 0
```

示例中，通过taskset启动应用（使用sleep命令模拟应用），并设置相应的cpu亲和力，即进程14925只能运行在cpu的第0个核。启动程序后查看进程的cpu亲和力，和启动时设置的相同。

另外，除了通过taskset命令实现cpu绑定，很多语言都提供了相应的api实现cpu绑定功能，例如c的`sched_setaffinity`和`sched_getaffinity`，python的`os.sched_setaffinity`和`os.sched_getaffinity`。