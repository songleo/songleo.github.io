---
layout: post
title: shell相关分享
date: 2016-07-05 20:43:32
---

由于工作原因，每天都会使用shell，难免会有很多重复性的命令操作，于是积累了一些shell别名和函数 ，特此分享，希望你能有所收获！

## 自动source环境变量

某些软件运行之前需要source环境变量，但是每次打开新终端都要去source环境变量太麻烦，所以我一般是将该软件所需的环境变量添加到`~/.bashrc`或者`/etc/profile`文件中，例如：

    export TEST_ENV=/path/to/dir

然后每次打开新终端都会自动source环境变量。

## 修改PATH

若经常需要执行某个目录下的可执行文件，可以将该目录添加到PATH中，每次执行时直接输入可执行文件名即可，例如：

    export PATH=/path/to/bin:$PATH

然后在终端就可以直接执行/path/to/bin目录中的可执行文件了，而不是每次进入该目录，然后执行`./cmd`，这里需要指出的是，切记将`$PATH`附在最后，因为shell在PATH中搜索可执行文件顺序是从前往后，如果将`$PATH`放在最前面，当系统中有2个同名的命令行时，你执行的命令可能是另外一个。

## 常用别名

在使用shell过程中，经常会频繁的执行一些命令，我的做法是设置一个别名，提高工作效率，例如我使用`cdd`进入我的日常开发目录developing，使用`cdc`进入经常需要修改配置文件的目录，`cdg`进入git的工作目录：

    alias cdd='cd /media/sf_share/git/developing'
    alias cdc='cd /path/to/config'
    alias cdg='cd /media/sf_share/git'

## git别名

每天都需要执行git命令，但是git命令实在太长，每次都输入那么长命令太费事，这里是一些我的git别名，希望对你也有用：

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
    alias ifconfig='ifconfig | awk -F"[: ]+" "/inet addr/ {print $4}"' # 查看ip地址更方便了
    alias lsrc="source ~/.bashrc" # 自动source当前用户的.bashrc文件

## 函数

### ltar

我们经常需要解压各种格式的压缩包，但是又记不住用哪个选项。可以将常见的解压命令封装成一个函数`ltar`。例如解压一个名为`package.tar.gz`的压缩包，只需要执行`ltar package.tar.gz`即可，你只需记住`ltar`命令：

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

### mcd

创建一个目录，并进入该目录：

    mcd(){ mkdir -p "$1"; cd "$1";}

### cdl

进入一个目录，并执行`ls`：

    cdl(){ cd "$1"; ls;}

## 总结

作为一名软件开发人员，其目的就是为了让电脑帮我们干更多的事，如果电脑能搞定的事，就不要自己动手了，节约你的时间，干更有意义的事，所以你也可以定制自己的shell配置文件，将那些重复性的工作交给电脑，可以将上面的例子添加到`~/.bashrc`或者`/etc/profile`文件中，然后source一下即可生效。

附上我的shell配置文件：

    https://github.com/songleo/bashrc/blob/master/.bashrc

如果你感兴趣可以下载使用，我的一般做法是将本地的`.bashrc`软链接到我的github本地仓库的`.bashrc`，这样换一个环境只需要从github将配置文件pull一下即可，欢迎分享交流！