---
layout: post
title: shell技巧分享（五）
date: 2018-06-05 00:05:00
---

这是一个系列文章，主要分享shell（部分功能仅适用于bash）的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 重定向相关知识

- 重定向标准输出到文件

```bash
$ echo line1 > test.log
$ cat test.log
line1
```

- 重定向标准错误到文件

```bash
$ echo line1 2> error.log
line1
$ cat error.log
```

- 重定向标准输出到标准错误

```bash
$ echo line1 1>&2
line1
```

- 重定向标准错误到标准输出

```bash
$ echo line1 2>&1
line1
```bash

- 重定向标准输出和标准错误到文件

```bash
$ echo line1 > test.log 2>&1
$ cat test.log
line1
```

### 2 同时打印到屏幕和文件

```bash
$ cat tee_demo.sh
#!/bin/bash

echo_ext(){
    echo "$1" 2>&1 | tee -a test.log
}

echo_ext line1
echo_ext line2
echo_ext line3
$ ./tee_demo.sh
line1
line2
line3
$ cat test.log
line1
line2
line3
```

写shell脚本时，有时候需要同时将输出信息打印到屏幕，并保存到文件。通过`tee`命令可以实现该功能。示例中可以看到，定义了一个`echo_ext`函数，封装`echo`命令，将输出信息打印到屏幕，并保存到test.log文件，`tee`命令的-a选项是将输出append到文件，而不是覆盖，运行完tee_demo.sh脚本，查看test.log文件内容，和屏幕输出相同。

### 3 进入上层目录

```bash
$ pwd
/root/tmp
$ alias ..='cd .. && ls -l'
$ ..
total 20
-rw-------. 1 root      root      2011 Feb 28 15:08 anaconda-ks.cfg
-rwxr-x---. 1 root      root      8576 May 25 14:58 checkpoint_demo
drwxr-xr-x. 2 mpi_user1 mpi_user1   37 May 29 17:50 chkpnt_dir
drwxr-xr-x. 2 root      root         6 Feb 28 15:14 Desktop
drwxr-xr-x. 2 root      root         6 Feb 28 15:14 Documents
drwxr-xr-x. 2 root      root         6 Feb 28 15:14 Downloads
-rw-r--r--. 1 root      root      2059 Feb 28 15:12 initial-setup-ks.cfg
drwxr-xr-x. 2 root      root         6 Feb 28 15:14 Music
drwxr-xr-x. 2 root      root         6 Feb 28 15:14 Pictures
drwxr-xr-x. 2 root      root         6 Feb 28 15:14 Public
drwxr-xr-x. 2 root      root         6 Feb 28 15:14 Templates
drwxr-xr-x. 2 root      root         6 Jun  4 17:17 tmp
drwxr-xr-x. 2 root      root         6 Feb 28 15:14 Videos
```

通过`alias`命令，定义一个`..`命令，当执行`..`命令时，会自动进入上层目录，然后列出上层目录的所有文件，不需要执行`cd ..`，然后执行`ls`，更加方便快捷。所以，你还可以定义一个`...`命令，进入上上层目录。
