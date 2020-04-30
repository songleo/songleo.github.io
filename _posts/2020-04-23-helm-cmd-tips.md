---
layout: post
title: helm命令tips
date: 2020-04-23 00:12:05
---

- 安装helm

```
curl -LO https://storage.googleapis.com/kubernetes-helm/helm-v2.8.2-linux-amd64.tar.gz
tar -xvf helm-v2.8.2-linux-amd64.tar.gz
mv linux-amd64/helm /usr/local/bin/
helm init
helm repo update

brew install helm
```

- 查找chart

```
helm search redis
```

- 查看chart详细信息

```
helm inspect stable/redis
```

- 检查chart语法

```
helm lint stable/app-name
```

- 打包helm chart

```
helm package stable/app-name
```

- 查看渲染效果

```
helm template --debug ./app-name-1.0.0.tgz
```

- 安装chart

```
helm install --name my-release stable/redis
```

- 删除chart

```
helm delete my-release
```

- 查询安装的chart

```
helm ls
```

> :) 未完待续......
