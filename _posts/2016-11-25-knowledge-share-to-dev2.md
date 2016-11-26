---
layout: post
title: 工作中的小技巧分享
date: 2016-11-25 22:24:32
---

本文是为为了给dev2做一个knowledge share，分享一些工作中常使用的小技巧，主要是一些命令行的操作。

>Don't Repeat Yourself

- 如果需要频繁的进入某个目录，alias一个命令以达到一键进入的目的，例如：

```bash
alias cdc='cd ${JHSCHEDULER_TOP}/conf && source ${JHSCHEDULER_TOP}/conf/profile.jhscheduler && ls'
```

当在终端输入命令cdc时，首先会进入我们经常进入的配置文件目录，自动source环境变量，然后执行ls命令列出当前目录下文件。

所以，你可以alias以下命令：

```bash
alias cdl='cd ${JHSCHEDULER_TOP}/log && ls' # 进入日志目录
alias cdu='cd ${JHSCHEDULER_TOP} && ls' # 进入unischeduler目录
alias cds='cd /media/sf_share' # 进入虚拟机和物理机的共享文件目录
```

举这几个例子，是想抛砖引玉，你可以alias属于你自己的快捷键，除非你愿意重复进行一些无意义的机械操作。

- 如果你频繁的执行某些命令，可以将这些命令alias为一个简短的命令，例如：

```bash
alias limreconfig="echo y | jadmin limreconfig "
alias mbdreconfig="jadmin schedreconfig "
```

执行limreconfig直接重置lim，省去jadmin和交互式输入时的y。执行mbdreconfig重置mbd。
所以，你可以alias以下命令：

```bash
alias jhstart="jhscheduler start"
alias jhstop="jhscheduler stop"
alias jhrestart="jhscheduler stop && jhscheduler start"
alias ip='ifconfig | awk -F"[: ]+" "/inet addr/ {print $4}"' # 查询ip，去掉无关信息
alias psg='ps -ef | grep' # 查看特定进程
alias lsg='ls | grep'
alias llg='ll | grep'
```

- 如果经常搜索bugzilla，可以将每次搜索保存，以便下次继续使用

具体步骤是搜索完bug后，点击Saved Searches即可保存本次搜索实用的条件。比如我做MIC调度项目时，我专门定制了以下几个bugzilla搜索：

> mic_unfix_bug：所有未fix的MIC调度bug
> mic_verify_bug：所有已经验证的MIC调度bug
> mic_fixed_bug：所有已经fix的MIC调度bug
> mic_bug: 所有MIC调度相关的bug

通过定制自己的搜索，可以很方面的查找符合特定条件的bug，实现一键搜索，尤其适合QA统计bug，开发在查找bug时也很实用。

- 如果经常需要换包或者编译包，可以定义一些命令实现

比如做4.0开发时，每次需要通过登录网页或者服务器获取最新的安装包，很不方便。所以我定义了一个命令lget4，执行该命令会将当天最新4.0包复制到当前目录。

```
lget4(){
    PACKAGE=`date +"%F"`
    wget http://192.168.0.43/build/jhinno_ext/jh_unischeduler_ext/trunk/$PACKAGE/unischeduler-4.0.tar.gz
}
```

由于每次换包需要复制许可证文件，我定义了一个命令cplic，将许可证文件放在一个固定的位置，执行该命令可以将许可证文件拷贝到conf目录：

```
alias cp3lic="cp /apps/license.dat ${JHSCHEDULER_TOP}/conf/"
```

一般我很少执行这个命令，因为每次拷贝安装包时，我就自动将许可证文件拷贝到conf目录，例如下面定义的命令时每次编译完后，执行cp3pkg命令可以拷贝最新的安装包到apps目录：

```
alias cp3pkg="cp -rf  /apps/code/trunk_3.2/dist/linux-x86_64/* /apps/ && cp /apps/license.dat ${JHSCHEDULER_TOP}/conf/"
```


### 明天继续写......

这次分享的目的：重复性无意义的动作，想办法自动化，节约时间，提高工作效率。如果大家有什么好的技巧或者方法，可以分享出来。欢迎补充讨论。

#### 本次荐书：代码大全

![image](https://img10.360buyimg.com/n1/s200x200_15093/2a690799-c814-4784-9027-b21e688415ff.jpg)

