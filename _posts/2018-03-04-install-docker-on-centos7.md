---
layout: post
title: centos7安装docker总结
date: 2018-03-04 23:55:00
---

最近工作中需要用到docker，所以决定自己搭建一个docker环境，于是选择在virtualbox上安装centos7虚拟机，并在虚拟机上安装docker，没搭建环境之前，觉得应该很简单，没想到折腾了好长时间。比如安装的centos7版本不支持docker，最后导致重装，所以特此记录下安装步骤及注意事项。

1） 创建虚拟机，选择centos系统镜像，比如CentOS-7-x86_64-DVD-1708.iso，务必使用官方最新支持的版本，如果选择的镜像版本不对，会导致安装完docker无法运行；

2）开始安装虚拟机，如果需要图形化界面，在安装最后一步记得选择带图形安装；

3）安装完毕，重启后，需要同意许可才能进入系统，如果是命令行界面，记得仔细阅读提示信息，需输入相应的选项同意许可才能进入系统；

4）安装virtualbox增强功能，一般会提示缺少gcc、make、perl和其他库文件，需安装和系统内核版本一致的库文件，否则不能安装virtualbox增强功能，例如：

```
Verifying archive integrity... All good.
Uncompressing VirtualBox 5.2.6 Guest Additions for Linux........
VirtualBox Guest Additions installer
Copying additional installer modules ...
Installing additional modules ...
VirtualBox Guest Additions: Building the VirtualBox Guest Additions kernel modules.
This system is currently not set up to build kernel modules.
Please install the gcc make perl packages from your distribution.
Please install the Linux kernel "header" files matching the current kernel
for adding new hardware support to the system.
The distribution packages containing the headers are probably:
    kernel-devel kernel-devel-3.10.0-693.el7.x86_64
VirtualBox Guest Additions: Starting.
VirtualBox Guest Additions: Building the VirtualBox Guest Additions kernel modules.
This system is currently not set up to build kernel modules.
Please install the gcc make perl packages from your distribution.
Please install the Linux kernel "header" files matching the current kernel
for adding new hardware support to the system.
The distribution packages containing the headers are probably:
    kernel-devel kernel-devel-3.10.0-693.el7.x86_64
Press Return to close this window...
```

按照提示信息，安装所需的工具和库：

```
[root@ssli-centos7 ~]# yum install gcc make perl
[root@ssli-centos7 ~]# yum install kernel-devel-$(uname -r)
[root@ssli-centos7 ~]# rpm -qa kernel\*
kernel-3.10.0-693.el7.x86_64
kernel-tools-3.10.0-693.el7.x86_64
kernel-headers-3.10.0-693.el7.x86_64
kernel-devel-3.10.0-693.el7.x86_64
kernel-tools-libs-3.10.0-693.el7.x86_64
```

再次安装virtualbox增强功能，成功安装。

5）安装docker：

```
root@ssli-centos7:~$ curl -fsSL https://get.docker.com/ | sh
root@ssli-centos7:~$ systemctl start docker
root@ssli-centos7:~$ systemctl status docker
root@ssli-centos7:~$ systemctl enable docker
```

安装docker，并启动docker，然后将docker服务设置成开机自启动。

6）运行docker hello world示例：

```
root@ssli-centos7:~$ docker pull hello-world
Using default tag: latest
latest: Pulling from library/hello-world
ca4f61b1923c: Pull complete
Digest: sha256:083de497cff944f969d8499ab94f07134c50bcf5e6b9559b27182d3fa80ce3f7
Status: Downloaded newer image for hello-world:latest
```

```
root@ssli-centos7:~$ docker run hello-world

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://cloud.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/engine/userguide/
```

至此，成功在centos7上安装docker。