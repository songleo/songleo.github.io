---
layout: post
title: 使用容器模拟虚拟机作为ssh服务器
date: 2024-01-06 00:12:05
---

在学习ansible时，需要添加一些远程host测试playbook，所以想通过docker模拟一个vm，然后安装ssh服务，方便测试运行playbook。

### 准备dockerfile

设置用户名和密码为admin/admin，方便测试。

```
$ cat Dockerfile
FROM ubuntu

RUN apt update && apt install -y openssh-server
RUN sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

RUN useradd -m -s /bin/bash admin
RUN echo "admin:admin" | chpasswd

EXPOSE 22

ENTRYPOINT service ssh start && sleep 36000
```

### 构建镜像

```
docker build -t songleo/ubuntu-ssh .
docker push songleo/ubuntu-ssh
```

### 运行docker模拟ssh服务器

在本地通过11111转发端口到容器22端口，然后ssh就可以登录到这个容器模拟的vm了。

```
$ docker run -d -p 11111:22 --name vm1 songleo/ubuntu-ssh
$ ssh admin@localhost -p 11111
admin@localhost's password:
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 6.5.11-linuxkit x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

This system has been minimized by removing packages and content that are
not required on a system that users do not log into.

To restore this content, you can run the 'unminimize' command.
Last login: Sat Jan  6 14:31:49 2024 from 192.168.65.1
```
