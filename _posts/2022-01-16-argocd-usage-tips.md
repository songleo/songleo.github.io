---
layout: post
title: argocd使用tips
date: 2022-01-16 00:12:05
---

- 添加集群

```
kubectl config get-contexts -o name
argocd cluster add admin --name soli-mc
```

- 查看集群

```
argocd cluster list
```

- 在argocd中安装applicationset

```
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj-labs/applicationset/v0.3.0/manifests/install.yaml
```

- 忽略repo中某些文件

```
...
  source:
    path: ignore-files
    repoURL: 'https://github.com/songleo/argocd-demo.git'
    targetRevision: HEAD
    directory:
      recurse: true
      exclude: 'svc.yaml'
...
```

- 修改argocd cm配置plugin

```
...
data:
  configManagementPlugins: |
    - name: updateReplicas
      init:
        command: [sh, -c, 'sed -i "s/replicas: 2/replicas: 1/" hostname.yaml']
      generate:
        command: [sh, -c, 'cat hostname.yaml']
      lockRepo: true
...
```

- 资源同步顺序

```
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "-1"
```

> :) 未完待续......
