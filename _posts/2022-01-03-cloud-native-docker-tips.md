---
layout: post
title: 云原生之docker使用技巧
date: 2022-01-03 12:12:05
---

最近读到一本云原生相关的书，也结合自己使用容器的一些经验，分享下在云原生环境中使用容器的一些技巧：

- 容器镜像要存储在可信的镜像仓库中，预防恶意镜像。如在kubernetes中可以定义webhook确保pod的image只来自某些确定的仓库

- build镜像时要充分利用docker的build缓存，尽量将更改频率高的命令放在dockerfile文件末尾，build image时如果没有改动，会自动使用缓存，加快build速度

- 非必要情况下，不要使用特权模式运行容器，防止恶意容器改变宿主机的环境进而影响整体，在kubernetes中可以通过设置相应的策略防止容器以特权模式方式运行

- 指定特定的image标签，比如commit id或者v1.0等，尽量不要使用latest标签，会导致不一致行为

- 尽量减小容器镜像的体积，方便部署是快速运行，更小的体积也以为着更少的依赖和漏洞，只在镜像中包含必要的文件，一般建议通过docker分阶段build减少不必要的文件，或者使用体积更小的base image比如alpine

- 在kubernetes中尽量将image pull policy设置成ifnotpresent，加快应用运行速度，也确保在非联网环境pod能正常启动

- 容器中只运行一个进程，确保容器的生命周期和进程一致，容器更易维护，否则会出现某个进程失败了，容器还在运行着

- 为了加快应用构建速度和启动速度，可以将一些经过验证的公共镜像存储在内部镜像仓库

- 定期对镜像进行漏洞扫描，一般是镜像仓库自动扫描镜像，发现漏洞及时提醒和修复

- 不要将数据保存在容器中，因为容器会被随时删除和重建，保持数据和容器分离，如果是非持久性的写入，尽量使用tmpfs提高性能

- 不要在容器中防止配置信息，因为容器会被随时删除重启，应该通过环境变量或者存储卷获取配置，比如kubernetes中的configmap和secret，就是用来存储配置信息和敏感数据

> :) 未完待续......


### 参考

- 云原生：运用容器、函数计算和数据构建下一代应用