---
layout: post
title: shell技巧分享（二）
date: 2018-04-10 00:05:01
---

这是一个系列文章，主要分享shell（部分功能仅适用于bash）的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 ps + grep命令

```
$ sleep 1234 &
[1] 19340
$ sleep 1234 &
[2] 19342
$ sleep 1234 &
[3] 19344
$ alias | grep psg
alias psg='ps -ef | grep --color=auto'
$ ps -ef | grep 1234
root     19340  2159  0 14:22 pts/1    00:00:00 sleep 1234
root     19342  2159  0 14:22 pts/1    00:00:00 sleep 1234
root     19344  2159  0 14:22 pts/1    00:00:00 sleep 1234
root     19360  2159  0 14:23 pts/1    00:00:00 grep --color=auto 1234
$ psg 1234
root     19340  2159  0 14:22 pts/1    00:00:00 sleep 1234
root     19342  2159  0 14:22 pts/1    00:00:00 sleep 1234
root     19344  2159  0 14:22 pts/1    00:00:00 sleep 1234
root     19366  2159  0 14:23 pts/1    00:00:00 grep --color=auto --color=auto 1234
```

通过系统提供的alias命令将ps和grep命令合成一个命令psg，实现快速查找特定字符串的相关进程。比如执行`ps -ef | grep 1234`命令查找包含1234字符串的相关进程，通过执行`alias psg='ps -ef | grep --color=auto'`命令，定义一个新命令psg实现相同功能，更加方便快捷。

### 2 ps + kill命令

```
$ psk(){ ps -ef | grep "$1" |awk '{print $2}' | xargs kill -9;}
$ sleep 1234 &
[1] 18055
$ sleep 1234 &
[2] 18057
$ sleep 1234 &
[3] 18060
$ ps -ef | grep 1234
root     18055  2159  0 14:03 pts/1    00:00:00 sleep 1234
root     18057  2159  0 14:03 pts/1    00:00:00 sleep 1234
root     18060  2159  0 14:03 pts/1    00:00:00 sleep 1234
root     18067  2159  0 14:03 pts/1    00:00:00 grep --color=auto 1234
$ psk 1234
kill: sending signal to 18073 failed: No such process
[1]   Killed                  sleep 1234
[2]-  Killed                  sleep 1234
[3]+  Killed                  sleep 1234
$ ps -ef | grep 1234
root     18082  2159  0 14:03 pts/1    00:00:00 grep --color=auto 1234
```

在日常工作中，有时候需要kill多个相关进程，如果单独去一个一个kill，很不方便且容易出错。通过定义一个函数psk可以实现查找并kill相关进程的功能。例如，示例中通过sleep命令模拟启动了3个进程，启动后可以查看到3个进程分别在后台运行，执行psk 1234命令即可同时kill这3个进程，执行完psk 1234命令后，再次查询相关进程，发现进程已经不存在。

### 3 ps + grep 查找进程时忽略自身进程

```
$ sleep 1234 &
[1] 17888
$ sleep 1234 &
[2] 17889
$ sleep 1234 &
[3] 17890
$ ps -ef | grep 1234
root     17888  2159  0 14:01 pts/1    00:00:00 sleep 1234
root     17889  2159  0 14:01 pts/1    00:00:00 sleep 1234
root     17890  2159  0 14:01 pts/1    00:00:00 sleep 1234
root     17902  2159  0 14:01 pts/1    00:00:00 grep --color=auto 1234
$ ps -ef | grep [1]234
root     17888  2159  0 14:01 pts/1    00:00:00 sleep 1234
root     17889  2159  0 14:01 pts/1    00:00:00 sleep 1234
root     17890  2159  0 14:01 pts/1    00:00:00 sleep 1234
```

如果注意看前面2个技巧，会发现psg查询进程时会包含自身进程，psk在kill相关进程时会打印一条信息：kill: sending signal to 18073 failed: No such process，这是因为查询进程时，没有将自身进程排除导致。示例中第一次执行`ps -ef | grep 1234`，发现有一个17902进程，这个进程就是执行`ps -ef | grep 1234`中的grep命令。如果执行`ps -ef | grep [1]234`会发现，已经将自身进程排除了。当然，也可以通过grep的-v选项实现过滤自身的功能，如下：

```
$ ps -ef | grep 1234 | grep -v grep
root     17888  2159  0 14:01 pts/1    00:00:00 sleep 1234
root     17889  2159  0 14:01 pts/1    00:00:00 sleep 1234
root     17890  2159  0 14:01 pts/1    00:00:00 sleep 1234
```

现在，你可以在psg和psk命令的字符串第一个字符添加中括号[]试一下效果了。

> 注：将分享的的alias或者函数写入你的shell配置文件（如：~/.bashrc或/etc/profile）中，这样每次打开终端都能使用。


