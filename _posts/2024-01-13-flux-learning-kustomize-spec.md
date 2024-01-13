---
layout: post
title: flux学习之kustomization spec
date: 2024-01-13 00:12:05
---

- commonMetadata

定义通用的元数据，如标签和注释，会覆盖已存在的元数据。

- dependsOn

指定当前kustomization依赖的其他资源。

- decryption

定义解密处理kubernetes加密清单的设置。

- interval

指定同步源的时间间隔。

- retryInterval

部署失败后重试的时间间隔，不指定时使用interval。

- kubeConfig

指定用于访问kubernetes集群的kubeconfig。

- path

指定git仓库中kustomization.yaml或者应用yaml的路径，默认就是根目录。

- postBuild

定义构建kustomize渲染后的操作。

- prune

是否自动删除不再由文件声明的kubernetes资源。

- healthChecks

定义部署资源后的健康检查。

- patches

定义应用于资源的补丁。

- images

定义用于替换的镜像源。

- serviceAccountName

指定执行kustomization的服务账户。

- sourceRef

指定资源同步的源引用。

- suspend

暂停或恢复kustomization的同步。

- targetNamespace

指定资源部署的命名空间。

- timeout

定义超时时间。

- force

强制应用更改。

- wait

是否等待所有资源都成功应用并成为就绪状态。如果启用，将忽略healthchecks。

- components

指定要包含的其他kustomization组件。

举例：

```
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: argocd
  namespace: flux-system
spec:
  interval: 1m0s
  path: ./argocd
  prune: true
  retryInterval: 1m0s
  sourceRef:
    kind: GitRepository
    name: kubernetes-apps
  targetNamespace: argocd
  timeout: 3m0s
  wait: true
```

主要用于自动从名为kubernetes-apps的git存储库同步argocd目录下的kubernetes 配置。它设定了每分钟检查一次更新，自动清理不再需要的资源，并确保所有更新在argocd命名空间中应用。此配置还包括在失败时重试同步以及等待所有资源就绪的功能。

### ref

- https://fluxcd.io/flux/components/kustomize/api/v1/
