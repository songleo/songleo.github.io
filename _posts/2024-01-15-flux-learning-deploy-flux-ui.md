---
layout: post
title: flux学习之部署flux ui
date: 2024-01-09 00:12:05
---

### 前置条件

- kubectl
- kind v0.20.0
- docker
- flux version 2.2.2
- $GITHUB_USER
- $GITHUB_TOKEN

### 部署flux

参考这篇文章部署flux：http://reborncodinglife.com/2024/01/09/flux-learning-deploy-flux-in-kind/

### helm方式

```
PASSWORD="admin"
gitops create dashboard ww-gitops \
  --password=$PASSWORD \
  --export > ./clusters/private-cloud/weave-gitops/weave-gitops-dashboard.yaml
```

设置默认登录密码为admin，执行这个命令，会自动生成一个包含HelmRepository和HelmRelease的yaml文件。将这个文件提交到集群，flux会自动部署。

```
git add -A && git commit -m "Add Weave GitOps Dashboard"
git push
kubectl port-forward svc/weave-gitops -n flux-system 9001:9001
```

最后通过端口转发方式验证，登录flux ui：http://localhost:9001/

### yaml文件

也可以直接clone [weave-gitops](https://github.com/weaveworks/weave-gitops)仓库，自己生成部署需要的yaml，然后按照flux的方式创建相应的kustomization和gitrepository部署。

```
$ cd weave-gitops/
$ helm template charts/gitops-server/ > flux-ui.yaml
```

具体配置参考：
- https://github.com/songleo/private-cloud/blob/main/apps/weave-gitops/weave-gitops.yaml
- https://github.com/songleo/private-cloud/blob/main/clusters/private-cloud/weave-gitops/weave-gitops-dashboard.yaml

### 参考

- https://github.com/songleo/private-cloud
