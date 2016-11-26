---
layout: post
title: 工作中的小技巧分享
date: 2016-11-25 22:24:32
---

本文是为为了给dev2做一个knowledge share，分享一些工作中常使用的小技巧，以提高大家的工作效率。

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
alias psg='ps -ef | grep'
alias lsg='ls | grep'
alias llg='ll | grep'
```

### 明天继续写......

这次分享的目的：重复性无意义的动作，想办法自动化，节约时间，提高工作效率。

#### 本次荐书：代码大全

![image](https://img10.360buyimg.com/n1/s200x200_15093/2a690799-c814-4784-9027-b21e688415ff.jpg)

