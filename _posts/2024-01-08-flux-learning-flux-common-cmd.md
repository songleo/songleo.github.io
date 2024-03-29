---
layout: post
title: flux学习之flux常用命令
date: 2024-01-08 00:12:05
---

- 启用自动补全功能

```
. <(flux completion bash)
```

- 检查集群是否满足flux要求

```
flux check --pre
```

- 安装flux

```
flux bootstrap github \
  --owner=$GITHUB_USER \
  --repository=fleet-infra \
  --branch=main \
  --path=./clusters/private-cloud \
  --personal
```

- 为app创建一个GitRepository

```
flux create source git podinfo \
  --url=https://github.com/stefanprodan/podinfo \
  --branch=master \
  --interval=1m \
  --export > ./clusters/private-cloud/podinfo-source.yaml
```

- 部署app

```
flux create kustomization podinfo \
  --target-namespace=default \
  --source=podinfo \
  --path="./kustomize" \
  --prune=true \
  --wait=true \
  --interval=30m \
  --retry-interval=2m \
  --health-check-timeout=3m \
  --export > ./clusters/private-cloud/podinfo-kustomization.yaml
```

- 查看部署的app状态

```
flux get kustomizations --watch
```

- 暂停同步Kustomization

```
suspend: true

or

flux suspend kustomization argocd
```

- 恢复同步Kustomization

```
suspend: false

or

flux resume kustomization argocd
```

- 查看所有flux对象

```
flux get all
```

- 查看flux版本

```
flux version
```

### ref

- https://fluxcd.io/flux/get-started/
