---
layout: post
title: shell相关分享
date: 2016-07-05 20:43:32
---

由于工作原因，基本每天都会使用shell，有时难免会有很多重复性的命令操作，于是积累了一些shell技巧 ，特此分享，希望你能有所收获！

## 自动source环境变量

某些软件运行之前需要`source`环境变量，我一般是将该环境变量添加到用户`home`目录下的`.bashrc`或者`/etc/profile`文件中，例如：

    export TEST_ENV=/path/to/dir

## 修改PATH

若经常需要执行某个目录下的可执行文件，可以将该目录添加到`PATH`中，每次执行时直接输入可执行文件名称即可，例如：

    export PATH=/path/to/bin:$PATH

然后在终端中就可以执行`/path/to/bin`目录中的可执行文件了，而不是每次都要进入该目录，然后执行`./cmd`。

## 常用别名

在使用shell的过程中，经常会频繁的执行一些命令，我的做法是设置一个别名，提高工作效率，例如我使用`cdd`进入我的日常开发目录`developing`，使用`cdc`进入经常需要修改配置文件的目录，`cdg`进入`git`的工作目录：

    alias cdd='cd /media/sf_share/git/developing'
    alias cdc='cd /path/to/config'
    alias cdg='cd /media/sf_share/git'

## git别名

每天都需要执行`git`命令，但是`git`命令实在太长，每次都输入那么长命令太费事，这里是一些我的`git`别名，希望对你也有用：

    alias gco='git commit'
    alias gcl='git clone'
    alias gck='git checkout'
    alias gbr='git branch'
    alias gad='git add --all'
    alias gst='git status'
    alias gph='git push'
    alias gpu='git pull'
    alias gdf='git diff'
    alias glg='git log'

## 其他别名

    alias ..='cd .. && ls' # 进入上级目录并执行ls命令（我的最爱）
    alias ...='cd ../.. && ls' # 进入上上级目录并执行ls命令
    alias :q='exit' # 以vi方式退出当前终端
    alias psg='ps -ef | grep' # 查找进程时不需要输入ps -ef | grep了
    alias ifconfig='ifconfig | awk -F"[: ]+" "/inet addr/ {print $4}"' # 查看ip地址更方面了
    alias lsrc="source ~/.bashrc" # 自动source当前用户的.bashrc文件

## 函数

解压各种常见格式的压缩包，例如解压一个名为`package.tar.gz`的压缩包，只需要执行`ltar package.tar.gz`即可，你只需记住`ltar`命令：

    ltar(){
    if [ -f $1 ]; then
    case $1 in
    *.tar.bz2)
    tar xjf $1
    ;;
    # *.tar.gz) tar xzf $1 ;;
    *.tar.gz)
    tar zxvf  $1
    ;;
    *.bz2) bunzip2 $1 ;;
    *.rar) unrar e $1 ;;
    *.gz) gunzip $1 ;;
    *.tar) tar xf $1 ;;
    *.tbz2) tar xjf $1 ;;
    *.tgz) tar xzf $1 ;;
    *.zip) unzip $1 ;;
    *.Z) uncompress $1 ;;
    *.7z)7z x $1 ;;
    *) echo "'$1' cannot be extracted via extract()";;
    esac
    else
     echo "'$1' is not a valid file"
    fi
    }

创建一个目录，并进入该目录：

    mcd(){ mkdir -p "$1"; cd "$1";}

进入一个目录，并执行`ls`：

    cdl(){ cd "$1"; ls;}

将以上的例子加入到你的`home`目录下的`.bashrc`或者`/etc/profile`文件，然后source一下即可生效，

## 总结

我的`shell`配置文件见：

    https://github.com/songleo/bashrc/blob/master/.bashrc

如果你感兴趣可以下载使用，在工作中，如果电脑能自动帮你完成的工作，就尽量让电脑完成，以节约你的时间，提高工作效率。所以你也可以创建属于自己的`shell`别名，欢迎分享交流！