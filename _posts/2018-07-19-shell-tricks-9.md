---
layout: post
title: shell技巧分享（九）
date: 2018-07-19 00:05:00
---

这是一个系列文章，主要分享shell（部分功能仅适用于bash）的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 gzip压缩和解压文件

```bash
$ ls
demo
$ gzip demo 
$ ls
demo.gz
$ gzip -d demo.gz 
$ ls
demo
```

通过gzip命令可以压缩和解压文件，由示例中可以看到，对文件demo执行gzip命令后，会生成一个demo.gz压缩文件，对gz格式的压缩文件执行gzip -d命令即可解压该文件。另外，gzip命令不能压缩目录，只能对单个文件进行压缩。

### 2 查看压缩的文本文件

```bash
$ ls
demo
$ cat demo 
line1
line2
line3
$ gzip demo 
$ ls
demo.gz
$ zcat demo.gz 
line1
line2
line3
```

如果想查看gz格式压缩文件的内容，直接使用cat命令是无法查看的，会显示乱码。借助zcat命令可以实现该功能，由示例中可以看到，使用zcat命令可以查看gz格式压缩文件的内容。

### 3 PATH配置顺序

```bash
# grep "JAVA" /etc/profile
JAVA_HOME=/opt/java1.8/jdk1.8.0_112
PATH=$JAVA_HOME/bin:$PATH
export PATH USER LOGNAME MAIL HOSTNAME HISTSIZE HISTCONTROL JAVA_HOME
# java -version
java version "1.8.0_112"
Java(TM) SE Runtime Environment (build 1.8.0_112-b15)
Java HotSpot(TM) 64-Bit Server VM (build 25.112-b15, mixed mode)
```

修改PATH的配置顺序，打开一个新终端执行java -version：

```bash
# grep "JAVA" /etc/profile
JAVA_HOME=/opt/java1.8/jdk1.8.0_112
PATH=$PATH:$JAVA_HOME/bin
export PATH USER LOGNAME MAIL HOSTNAME HISTSIZE HISTCONTROL JAVA_HOME
# java -version
openjdk version "1.8.0_131"
OpenJDK Runtime Environment (build 1.8.0_131-b12)
OpenJDK 64-Bit Server VM (build 25.131-b12, mixed mode)
```

linux执行命令时，是按顺序从PATH中的路径依次查找，如果找到相应的可执行文件，就不会继续查找后面的目录。由示例中可以看到，当配置的PATH为$JAVA_HOME/bin:$PATH时，将JAVA_HOME放置在PATH的最前面，此时执行的java版本是1.8.0_112。如果配置的PATH为$PATH:$JAVA_HOME/bin，将JAVA_HOME附在PATH后面，再打开一个终端执行java -version时，发现java版本是1.8.0_131，不是配置的JAVA_HOME指定的java版本。所以安装新软件修改PATH时，一定要注意顺序，否则有可能执行的命令不是新安装的软件命令，从而导致其他问题。我在公司已经听说过2个bug是由于这个原因导致，很不容易发现，希望对大家也有帮助。
