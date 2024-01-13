---
layout: post
title: flux学习之kustomization spec
date: 2024-01-13 00:12:05
---

- commonmetadata

定义通用的元数据，如标签和注释，会覆盖已存在的元数据。

- dependson

指定当前kustomization依赖的其他资源。

- decryption

定义解密处理kubernetes加密清单的设置。

- interval

指定同步源的时间间隔。

- retryinterval

部署失败后重试的时间间隔，不指定时使用interval。

- kubeconfig

指定用于访问kubernetes集群的kubeconfig。

- path

指定git仓库中kustomization.yaml或者应用yaml的路径，默认就是根目录。

- postbuild

定义构建kustomize渲染后的操作。

- prune

是否自动删除不再由文件声明的kubernetes资源。

- healthchecks

定义部署资源后的健康检查。

- patches

定义应用于资源的补丁。

- images

定义用于替换的镜像源。

- serviceaccountname

指定执行kustomization的服务账户。

- sourceref

指定资源同步的源引用。

- suspend

暂停或恢复kustomization的同步。

- targetnamespace

指定资源部署的命名空间。

- timeout

定义超时时间。

- force

强制应用更改。

- wait

是否等待所有资源都成功应用并成为就绪状态。如果启用，将忽略healthchecks。

- components

指定要包含的其他kustomization组件。

### ref

- https://fluxcd.io/flux/components/kustomize/api/v1/
