---
layout: post
title: 工作中的小技巧分享
date: 2016-11-25 22:24:32
---

本文是为了给dev2做一个knowledge share，分享一些工作中常使用的小技巧，主要是一些命令行的操作，希望对大家能有所帮助。

>Don't Repeat Yourself

### 1 进入目录

如果需要频繁的进入某个目录，alias一个命令以达到目的，例如：

```bash
alias cdc='cd ${JHSCHEDULER_TOP}/conf && source ${JHSCHEDULER_TOP}/conf/profile.jhscheduler && ls'
```

当在终端输入命令cdc时，首先会进入我们经常进入的配置文件目录，自动source环境变量，然后执行ls命令列出当前目录下文件，也可以将source环境变量这句单独放入用户的bash配置文件，每次登陆自动source环境变量。例如：

```bash
source  ${JHSCHEDULER_TOP}/conf/profile.jhscheduler
```

所以，你也可以alias以下命令：

```bash
alias cdl='cd ${JHSCHEDULER_TOP}/log && ls' # 进入日志目录
alias cdu='cd ${JHSCHEDULER_TOP} && ls' # 进入unischeduler目录
alias cds='cd /media/sf_share' # 进入虚拟机和物理机的共享文件目录
alias ..='cd .. && ls' # 进入上层目录，并执行ls命令
alias ...='cd ../.. && ls' # 进入上上层目录，并执行ls命令
```

举这几个例子，只是为了达到抛砖引玉的目的，你可以alias属于你自己的命令行，除非你愿意重复性的执行一些命令。

### 2 命令行改造

如果你频繁的执行某些命令，可以将这些命令alias为一个简短的命令，例如：

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
alias lsub="su jhadmin -c 'jsub sleep 10000'" # 以jhadmin用户提交一个作业
alias ljobs="su jhadmin -c 'jjobs -u all 0'" # 查询所有用户作业
alias ip='ifconfig | awk -F"[: ]+" "/inet addr/ {print $4}"' # 查询ip，去掉无关信息
alias psg='ps -ef | grep' # 查看特定进程
alias lsg='ls | grep'
alias llg='ll | grep'
alias lping='ping www.baidu.com' # 检测网络连接是否正常
ssh0()
{ ssh "192.168.0.$1";} # ssh连接时不用每次输入192.168.0.

ldkill()
{ ps -ef | grep unischeduler |awk '{print $2}' | xargs kill -9; } # 在从节点删除unischeduler相关进程
```

### 3 bugzilla搜索定制

如果经常搜索bugzilla，可以将每次搜索保存，以便下次继续使用

具体步骤是搜索完bug后，点击Saved Searches即可保存本次搜索使用的条件和关键字。比如我做MIC调度项目时，我专门定制了以下几个bugzilla搜索：

> mic_unfix_bug：所有未fix的MIC调度bug
>
> mic_verify_bug：所有已经验证的MIC调度bug
>
> mic_fixed_bug：所有已经fix的MIC调度bug
>
> mic_bug: 所有MIC调度相关的bug

通过定制自己的搜索，可以很方面的查找符合特定条件的bug，实现一键搜索，尤其适合QA统计bug，开发在查找bug时也很实用。

在这里顺便提及一句，我们经常使用xshell连接某个虚拟机，可以通过类似的方法定义，保存连接后，下次ssh连接虚拟机时就可以一键连接，省去输入用户名和密码的步骤。

### 4 编译和换包

如果经常需要换包或者编译包，可以定义一些命令实现，比如做4.0开发时，每次需要通过登录网页或者服务器获取最新的安装包，很不方便。所以我定义了一个命令lget4，执行该命令会将当天最新4.0包复制到当前目录。

```bash
lget4(){
    PACKAGE=`date +"%F"`
    wget http://192.168.0.43/build/jhinno_ext/jh_unischeduler_ext/trunk/$PACKAGE/unischeduler-4.0.tar.gz
}
```

由于每次换包需要复制许可证文件，我定义了一个命令cplic，将许可证文件放在一个固定的位置，执行该命令可以将许可证文件拷贝到conf目录：

```bash
alias cp3lic="cp /apps/license.dat ${JHSCHEDULER_TOP}/conf/"
```

一般我很少执行这个命令，因为每次拷贝安装包时，我就自动将许可证文件拷贝到conf目录，例如下面定义的命令是每次编译完后，执行cp3pkg命令可以拷贝最新的安装包到apps目录：

```bash
alias cp3pkg="cp -rf  /apps/code/trunk_3.2/dist/linux-x86_64/* /apps/ && cp /apps/license.dat ${JHSCHEDULER_TOP}/conf/"
```

如果需要进程更换文件，比如fix bug时，编译完修改的代码后，想更换binary如LIM和MBD等，可以alias几个命令实现，如下：

```bash
alias cplim="cp -rf /apps/code/trunk_3.2/dist/linux-x86_64/unischeduler/sbin/linux-x86_64/lim  ${JHSCHEDULER_TOP}/sbin/linux-x86_64/lim"
alias cpmbd="cp -rf /apps/code/trunk_3.2/dist/linux-x86_64/unischeduler/sbin/linux-x86_64/mbatchd  ${JHSCHEDULER_TOP}/sbin/linux-x86_64/mbatchd"
alias cpsched="cp -rf /apps/code/trunk_3.2/dist/linux-x86_64/unischeduler/sbin/linux-x86_64/sched  ${JHSCHEDULER_TOP}/sbin/linux-x86_64/sched"
alias cpsbd="cp -rf /apps/code/trunk_3.2/dist/linux-x86_64/unischeduler/sbin/linux-x86_64/sbatchd  ${JHSCHEDULER_TOP}/sbin/linux-x86_64/sbatchd"
alias cpall="cplim && cpmbd && cpsbd && cpres && cppim && cpjcmd && cpbcmd" # 更换所有的binary
```

由于每次需要重新编译代码，我定义了2个命令实现自动编译4.0和3.2，如下：

```bash
alias lbuild4='curl --user jhadmin:jhadmin -d delay=0sec http://192.168.0.43:8888/view/jh_unischeduler/job/unischeduler-trunk/build' # 运行4.0
alias lbuild3="cd /apps/code/trunk_3.2 && make -j 4 clean && make -j 4 && rm -rf ./dist/ && make -j 4 package && cd -" # build 3.2
```

### 5 代码运行

开发过程中，经常需要写一个简单的程序验证某个API，比如c语言，要编译运行c文件，需要执行gcc demo.c -o demo.c，编译完后才运行代码，比较麻烦，可以参考go语言的go run，一个命令运行源代码，如下：

```bash
crun(){
    gcc $* -g;
    if [ $? -ne 0 ]; then
        echo "failed build $1"
    else
        ./a.out
        rm -rf ./a.out
    fi
}
alias grun='go run'
alias gbuild='go build'
alias gtest='go test'
```

### 6 解压

每次换包时，都要解压压缩包，但是压缩格式很多，要记住那么多解压选项和命令不容易，可以定义如下命令，一个命令解压常见压缩格式：

```bash
ltar(){
if [ -f $1 ]; then
case $1 in
    *.tar.bz2) tar xjf $1;;
    *.tar.gz) tar zxvf  $1;;
    *.bz2) bunzip2 $1 ;;
    *.rar) unrar e $1 ;;
    *.gz) gunzip $1 ;;
    *.tar) tar xf $1 ;;
    *.tbz2) tar xjf $1 ;;
    *.tgz) tar xzf $1 ;;
    *.zip) unzip $1 ;;
    *.Z) uncompress $1 ;;
    *.7z)7z x $1 ;;
    *) echo "'$1' cannot be extracted";;
esac
else
    echo "'$1' is not a valid file"
fi
}
```

### 7 文件查询

最后分享一个小插件[listary](http://www.listary.com/)（极力推荐），在Windows上能快速定位某个文件。比如每次我需要打开我们3.2的管理员手册时，我只需要在桌面输入glysc，即管理员手册的首字母，listary就马上定位到我经常打开的管理员手册，回车就直接打开。不需要去打开我的电脑，然后进入svn目录，然后一层一层寻找该文件。具体使用可以参考连接http://www.iplaysoft.com/listary.html。

### 8 总结

我们工作中尽量少做一些无意义且重复性的操作，重复性的工作能自动化就让电脑自动完成，节约我们时间，提高工作效率。如果大家有什么好的技巧或者方法，可以分享出来，欢迎补充讨论。

最后附上我的bash配置，如果感兴趣可以参考。

https://github.com/songleo/bashrc/blob/master/.bashrc

#### 本次荐书：代码大全

![image](https://img10.360buyimg.com/n1/s200x200_15093/2a690799-c814-4784-9027-b21e688415ff.jpg)

