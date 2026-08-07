---
layout: post
title: 我使用最频繁的10个git命令
date: 2016-04-23 23:40:32
---

现在基本每天都在使用git，但是git的命令特别多，要全部搞懂需要花大量时间去实践学习，由于我使用git只是为了维护我的博客、平时写的一些代码和翻译一些书，用不到git很多的高级功能。因此在使用git过程中发现，使用得最多的命令是以下10个：

- git clone
- git init
- git status
- git add
- git commit
- git log
- git diff
- git push
- git pull
- git checkout

在介绍这10个命令之前，先介绍下git中4个术语：

- 工作区（workspace）：简单来说就是你写代码的地方；
- 暂存区（index）：对某个文件使用git add命令后，该文件就从工作去转移到暂存区；
- 本地仓库（repository）：对使用过git add命令的文件，执行git commit后，该文件就转移到本地仓库，这样该文件就被git管理了；
- 远程仓库（remote）：可以认为这是你的github或者你自己的git服务器。

这里分别解释下这10个命令的主要功能：

## 1）git clone

这个命令可以将远程仓库克隆到本地仓库。例如克隆我github的一个仓库到本地：

    root@leo:test# git clone git@github.com:songleo/update_hosts.git
    Cloning into 'update_hosts'...
    remote: Counting objects: 50, done.
    remote: Total 50 (delta 0), reused 0 (delta 0), pack-reused 50
    Receiving objects: 100% (50/50), 6.21 MiB | 103.00 KiB/s, done.
    Resolving deltas: 100% (23/23), done.
    Checking connectivity... done.

你会在执行该命令的目录下发现一个update_hosts目录（这个仓库主要功能是自动更新你电脑的hosts文件上谷歌）。

## 2）git init

这个命令会创建一个本地仓库，将执行该命令的当前目录变成git可以管理的仓库，执行该命令后，会在该目录生成一个.git目录。

    root@leo:test# git init
    Initialized empty Git repository in /media/sf_share/test/.git/

## 3）git status

该命令主要功能是查看git仓库状态。例如在执行完git init命令的目录中，添加一个文件gitdemo。执行git status时：

    root@leo:test# git status
    On branch master

    Initial commit

    Untracked files:
      (use "git add <file>..." to include in what will be committed)

    gitdemo

    nothing added to commit but untracked files present (use "git add" to track)

会提示gitdemo文件还没有被git追踪。需要执行git add命令将该文件提交到暂存区。

## 4）git add

当你修改一个文件后，使用git add将该文件从工作去提交到暂存区。例如：

    root@leo:test# git add gitdemo

将gitdemo文件提交到缓存区。在执行git status时，输出如下：

    root@leo:test# git status
    On branch master

    Initial commit

    Changes to be committed:
      (use "git rm --cached <file>..." to unstage)

    new file:   gitdemo

现在gitdemo文件已经在暂存区了，就算你rm删除该文件也可以恢复该文件，但是此时该文件还没有提交到本地仓库中。

## 5）git commit

这个命令主要功能是将暂存区的文件提交到本地仓库。例如将修改的gitdemo文件提交到本地仓库：

    root@leo:test# git commit  -m "first commit"
    [master (root-commit) 4973272] first commit
     1 file changed, 0 insertions(+), 0 deletions(-)
     create mode 100644 gitdemo

然后再执行git status时：

    root@leo:test# git status
    On branch master
    nothing to commit, working directory clean

提示没有可提交的文件。此时该文件就版本的概念了，本次提交就是一个版本。

## 6）git log

该命令主要是查看每次提交的日志的。例如：

    root@leo:test# git log
    commit 497327268b256014d137fe4417f0970b3d25ef31
    Author: songleo <lisong1205@126.com>
    Date:   Sun Apr 24 13:33:19 2016 +0800

        first commit

可以看到我们提交的日志。

## 7）git diff

该命令主要功能是显示工作区和暂存区及提交到仓库之间的差异。例如当我在工作去修改git文件后，执行git diff命令：

    root@leo:test# echo test >gitdemo
    root@leo:test# git diff
    diff --git a/gitdemo b/gitdemo
    index e69de29..9daeafb 100644
    --- a/gitdemo
    +++ b/gitdemo
    @@ -0,0 +1 @@
    +test

可以看到提示添加了一行内容test。将该文件提交到暂存区在执行git diff时没有任何输出。但是执行git diff HEAD时会提示暂存区和上一次提交时的差异，即添加了一行内容：

    root@leo:test# git diff HEAD
    diff --git a/gitdemo b/gitdemo
    index e69de29..9daeafb 100644
    --- a/gitdemo
    +++ b/gitdemo
    @@ -0,0 +1 @@
    +test

## 8）git push

该命令会将本地仓库的修改推送到远程仓库。

## 9）git pull

该命令会将远程仓库取回，并和本地仓库合并。例如，这里将远程仓库update_hosts取回本地和本地仓库合并：

    root@leo:update_hosts# git pull
    From github.com:songleo/update_hosts
     - [new tag]         v1.1       -> v1.1
    Already up-to-date.

可以看见远程仓库添加了一个新的标签（tag），现在本次仓库也有一个新标签。

## 10）git checkout

该命令主要是为了恢复提交到暂存区和本地仓库的文件到工作区或者暂存区区。例如恢复提交到缓存区的文件到工作区：

    root@leo:test# git checkout gitdemo

## 总结

本文只是简单介绍了我在使用gi过程中的一些常用及入门级的命令，如果想继续深入学习git可以查看参考文档的2个链接。

附上我的git别名：

    alias gad='git add --all'
    alias gbr='git branch'
    alias gck='git checkout'
    alias gcl='git clone'
    alias gco='git commit'
    alias gdf='git diff'
    alias glg='git log'
    alias gph='git push'
    alias gpu='git pull'
    alias gst='git status'

## 参考

http://www.liaoxuefeng.com/wiki/0013739516305929606dd18361248578c67b8067c8c017b000
http://www.ruanyifeng.com/blog/2015/12/git-cheat-sheet.html

ps：最近在看一本书：《写给大家看的设计书》，貌似排版有点改进了Orz
