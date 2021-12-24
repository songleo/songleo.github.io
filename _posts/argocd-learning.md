---
layout: post
title: argocd学习
date: 2021-12-24 00:12:05
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
## ref

- https://argo-cd.readthedocs.io/en/stable/getting_started/
