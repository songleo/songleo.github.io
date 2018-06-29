---
layout: post
title: centos安装openmpi
date: 2018-06-25 00:05:00
---

### 1 下载openmpi源码

通过官方网站提供的下载地址：[https://download.open-mpi.org/release/open-mpi/v3.1/openmpi-3.1.0.tar.gz](https://download.open-mpi.org/release/open-mpi/v3.1/openmpi-3.1.0.tar.gz)，下载3.1版的openmpi，在命令行执行如下命令，会将openmpi-3.1.0.tar.gz文件下载到当前目录：

```bash
$ wget https://download.open-mpi.org/release/open-mpi/v3.1/openmpi-3.1.0.tar.gz
```

### 2 解压openmpi源码

进入openmpi-3.1.0.tar.gz文件所在目录，执行以下命令解压源码：

```bash
$ tar -zxvf openmpi-3.1.0.tar.gz
```

### 3 安装openmpi

解压完毕后，按照linux软件的标准安装步骤：`./configure && make && make install `，安装openmpi，步骤如下：

```bash
$ cd openmpi-3.1.0/
$ ./configure
$ make && make install
```

### 4 验证安装

安装完毕后，进入openmpi-3.1.0目录下的examples目录，执行make命令编译示例程序，通过运行示例程序验证是否成功安装openmpi，如下所示：

```bash
$ cd examples/
$ make
$ ./hello_c
Hello, world, I am 0 of 1, (Open MPI v3.1.0, package: Open MPI root@ssli_centos7 Distribution, ident: 3.1.0, repo rev: v3.1.0, May 07, 2018, 112)
```

示例程序正确运行，说明安装成功。
