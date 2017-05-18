---
layout: post
title: 工作中的小技巧分享
date: 2016-11-25 22:24:32
---

本文是为了给dev2做一个knowledge share，分享一些我日常工作中总结的小技巧和工具，主要是一些命令行的改造和定义，因为经常执行某一个命令，如果重复几次以后我就想把命令改造得短一些，方便再次执行以节约时间，所以分享出来希望对大家能有所帮助。

>Don't Repeat Yourself（不要重复你自己）

### 1 进入目录

如果需要频繁的进入某个目录，可以alias一个命令以达到目的，例如：

```
alias cdc='cd ${SCHEDULER_TOP}/conf && source ${SCHEDULER_TOP}/conf/profile.scheduler && ls'
```

当在终端执行cdc命令时，首先会进入我们常用的配置文件目录，并自动source环境变量，然后执行ls命令列出当前目录下文件。

其实我更喜欢将source环境变量单独写入bash配置文件，以便每次登陆时自动source环境变量。例如：

```
source  ${SCHEDULER_TOP}/conf/profile.scheduler
```

所以，你也可以alias以下命令：

```
alias cdl='cd ${SCHEDULER_TOP}/log && ls' # 进入日志目录
alias cdu='cd ${SCHEDULER_TOP} && ls' # 进入scheduler目录
alias cds='cd /media/sf_share' # 进入虚拟机和物理机的共享文件目录
alias ..='cd .. && ls' # 进入上层目录，并执行ls命令
alias ...='cd ../.. && ls' # 进入上上层目录，并执行ls命令
```

举这几个例子，只是想达到抛砖引玉的目的。你也可以alias属于你自己的命令，除非你愿意重复性的执行一些命令。

### 2 命令行改造

如果你频繁的执行某些命令，可以将这些命令alias为一个简短的命令，例如：

```
alias limreconfig="echo y | jadmin limreconfig "
alias mbdreconfig="jadmin schedreconfig "
```

执行limreconfig直接重置lim，省去输入jadmin和进入交互模式输入的y。执行mbdreconfig重置mbd。所以，你也可以alias以下命令：

```
alias jhstart="scheduler start"
alias jhstop="scheduler stop"
alias jhrestart="scheduler stop && scheduler start"
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
{ ps -ef | grep scheduler |awk '{print $2}' | xargs kill -9; } # 在从节点删除scheduler相关进程
```

### 3 定制bugzilla搜索

如果需要经常在bugzilla搜索bug，可以保存每次搜索，以便下次继续使用，具体步骤是搜索完bug后，点击Saved Searches即可保存本次搜索使用的条件和关键字。比如我做某项目时，我专门定制了以下几个bugzilla搜索：

> xxx_unfix_bug：所有关于xxx项目未fix的bug
>
> xxx_verify_bug：所有关于xxx项目已验证的bug
>
> xxx_fixed_bug：所有关于xxx项目已fix的bug
>
> xxx_bug: 所有关于xxx项目相关的bug

通过定制自己的搜索，可以很方便的查找符合特定条件的bug，实现一键搜索，尤其适合QA统计bug，开发在查找bug时也很实用。

在这里顺便提及一句，我们经常使用xshell连接某个虚拟机，可以通过类似的方法定义，保存连接后，下次ssh连接虚拟机时就可以一键连接，省去输入用户名和密码的步骤。

### 4 编译和换包

如果经常需要换包或者编译代码，可以定义一些命令实现，比如做某项目时，每次都需要通过登录网页或者服务器获取最新的安装包，很不方便。所以我定义了一个命令lget，执行该命令会将当天最新包复制到当前目录，这个命令应该大家都有使用过，如下：

```
lget(){
    PACKAGE=`date +"%F"`
    wget http://192.168.0.5/build/jhinno_ext/scheduler_ext/trunk/$PACKAGE/scheduler.tar.gz
}
```

由于每次换包需要复制许可证文件，我定义了一个命令cplic，将许可证文件放在一个固定的位置，执行该命令可以将许可证文件拷贝到conf目录：

```
alias cplic="cp /apps/license.dat ${SCHEDULER_TOP}/conf/"
```

但是一般我很少执行这个命令，因为每次拷贝安装包时，我就自动将许可证文件拷贝到conf目录，例如下面定义的命令是编译完代码后，执行该命令可以拷贝最新的安装包到apps目录：

```
alias cppkg="cp -rf  /apps/code/trunk/dist/linux-x86_64/* /apps/ && cp /apps/license.dat ${SCHEDULER_TOP}/conf/"
```

在fix bug时，编译完修改的代码后，如果想更换某个binary，可以alias几个命令实现，如下：

```
alias cpbin="cp -rf /apps/code/trunk/dist/linux-x86_64/scheduler/sbin/linux-x86_64/bin  ${SCHEDULER_TOP}/sbin/linux-x86_64/bin"
alias cpall="cpbin && cpcmd" # 更换所有的binary
```

每次fix bug或者调试代码时，经常需要重新编译代码，所以我定义了2个命令实现自动编译，如下：

```
alias lbuild4='curl --user username:password -d delay=0sec http://192.168.0.46:8088/view/scheduler/job/scheduler-trunk/build'
alias lbuild3="cd /apps/code/trunk && make -j 4 clean && make -j 4 && rm -rf ./dist/ && make -j 4 package && cd -"
```

### 5 代码运行

开发过程中，经常需要写一个简单的程序验证某个API，比如c语言，要编译运行c文件，需要执行gcc demo.c -o demo.c，编译完成后才能运行代码，这样每次编译比较麻烦且费时，于是我参考go语言的go run命令，定义一个crun命令直接运行c源代码，如下：

```
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

这里也将go语言的几个命令改造了下，因为每次运行都要输入那么多字符，我可受不了。

### 6 解压

每次换包时，都要解压压缩包，但是压缩格式很多，要记住那么多解压选项和命令不容易，可以定义如下命令，一个命令解压常见压缩格式的包：

```
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

最后分享一个小插件[listary](http://www.listary.com/)（极力推荐），在Windows上能快速定位某个文件。比如每次我需要打开我们的管理员手册时，我只需要在桌面输入glysc，即管理员手册汉字的首字母，listary就马上定位到我经常打开的管理员手册，回车就直接打开。不需要打开我的电脑，然后进入svn目录，然后一层一层寻找该文件。具体使用可以参考http://www.iplaysoft.com/listary.html。

### 8 总结

日常工作中，我们应该尽量少做一些无意义且重复性的操作，重复性的工作能自动化就让电脑自动完成，节约我们时间，提高工作效率。如果大家有什么好的技巧或者方法，可以分享出来，欢迎补充讨论。

最后附上我的bash配置，如果感兴趣可以参考。

https://github.com/songleo/bashrc/blob/master/.bashrc

#### 本次荐书：代码大全

![image](https://img10.360buyimg.com/n1/s200x200_15093/2a690799-c814-4784-9027-b21e688415ff.jpg)

