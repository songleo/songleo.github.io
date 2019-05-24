---
layout: post
title: docker的manifest特性
date: 2019-05-24 00:12:05
---

一直都是在x86_64平台下编译docker镜像，最近因为需要在powerpc和z上面编译docker镜像，发现同一个镜像在不同的平台运行，结果竟然不一样，因为按docker的镜像机制，同一个镜像不应该出现不同行为，仔细分析后发现是docker提供了manifest功能，进而支持多平台，用户不需要根据平台不同而下载不同镜像，而是通过一个镜像就能覆盖各种平台。

例如，如果在amd64平台，拉取golang镜像，并允许go version命令，发现输出是go version go1.12.5 linux/amd64，如下所示：

```
# docker run --rm golang go version
go version go1.12.5 linux/amd64
# docker pull golang
Using default tag: latest
latest: Pulling from library/golang
Digest: sha256:cf0b9f69ad1edd652a7f74a1586080b15bf6f688c545044407e28805066ef2cb
Status: Image is up to date for golang:latest
```

但是在powerpc和z平台上，输出却不同，如下：

### z执行结果：

```
# docker run --rm golang go version
go version go1.12.5 linux/s390x
# docker pull golang
Using default tag: latest
latest: Pulling from library/golang
Digest: sha256:cf0b9f69ad1edd652a7f74a1586080b15bf6f688c545044407e28805066ef2cb
Status: Image is up to date for golang:latest
```

### powerpc执行结果：

```
# docker run --rm golang go version
go version go1.12.5 linux/ppc64le
# docker pull golang
Using default tag: latest
latest: Pulling from library/golang
Digest: sha256:cf0b9f69ad1edd652a7f74a1586080b15bf6f688c545044407e28805066ef2cb
Status: Image is up to date for golang:latest
```

从镜像的digest可以看到，确实是同一个镜像，但是在不同平台运行结果却不一样，说明镜像可以自动识别平台，运行相应平台镜像文件。即不同平台下载的golang镜像的manifest文件确实是一样的，但是通过查看image id，会发现镜像id不同，不同平台上的镜像却不相同，是因为docker的引入的manifest功能，负责处理多个平台间的镜像兼容问题，在pull镜像过程中，会判断manifest中是否包含该平台的docker镜像，然后自动下载该平台的镜像到本地运行，所以如果需要镜像支持多平台，需要在镜像中添加每个平台镜像信息到manifest文件中，并提供该平台的镜像，方便镜像可以在不同平台运行，这里在提供3个关键概念，有助于理解docker镜像的组成。

- image id：是所有层的文件的sha256sum，可以直接使用来下载镜像
- layerid：是docker的每个层的所有文件的sha256sum
- digest：是manifest文件的sha256sum

所以，在构建跨平台的docker镜像时，不需要在dockerfile中处理多平台问题，docker会自动按照manifest中的配置，下载和平台向匹配的镜像。
