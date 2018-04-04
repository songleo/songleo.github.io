---
layout: post
title: shell技巧分享（一）
date: 2018-04-03 12:05:01
---

这是一个系列文章，主要分享shell（部分功能仅适用于bash）的使用建议和技巧，每次分享3点，希望你能有所收获。

另外，这些建议和技巧都是我工作用到的，只有我用到了才会记录并分享出来，所以没有什么顺序而言，用到什么我就分享什么。

### 1 sed替换文件内容

```
root@ssli_centos7:bash_practice$ cat demo
this is demo
root@ssli_centos7:bash_practice$ sed -i s/demo/test/g demo
root@ssli_centos7:bash_practice$ cat demo
this is test
```

通过sed，可以很方便替换文件中的某些字符串。比如这里的demo文件只有一行内容：this is demo。通过sed将文件中的demo字符串替换成test。这里的-i选项是直接修改文件内容，字母s表示替换字符，字母g表示替换一行内所有的匹配字符，反斜杆/是分割符，也可以使用其他符号比如？和@。

### 2 自动填充上一个命令的最后一个参数

```
root@ssli_centos7:bash_practice$ cd /media/sf_share/git/python_practice/
root@ssli_centos7:python_practice$ ls /media/sf_share/git/python_practice/
demo  dsa  euler  fluent_python_demo  README.md  tool
```

在输入命令时，有时候需要上一个命令行的最后一个参数，比如示例中的第一个命令的最后一个参数是/media/sf_share/git/python_practice/，如果下一个命令需要使用该参数，那么执行Alt+.就会自动填充/media/sf_share/git/python_practice/到命令后面，不用再次输入该路径。

### 3 ls + grep命令

```
root@ssli_centos7:bash_practice$ alias | grep lsg
alias lsg='ls | grep'
root@ssli_centos7:bash_practice$ ls | grep demo
demo
demo.sh
valgrind_demo
root@ssli_centos7:bash_practice$ lsg demo
demo
demo.sh
valgrind_demo
```

通过系统提供的alias命令将ls和grep命令合成一个命令lsg，实现快速搜索ls输出内容的目的。比如前一个命令是列出当前目录下所有名字包括demo字符的文件。通过执行`alias lsg='ls | grep'`命令，定义一个新命令lsg实现相同功能，输入的字符更少，效率也就更高了。