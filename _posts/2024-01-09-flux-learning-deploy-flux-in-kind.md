---
layout: post
title: flux学习之在kind中部署flux
date: 2024-01-09 00:12:05
---

### 前置条件

- kubectl
- kind v0.20.0
- docker
- flux version 2.2.2
- $GITHUB_USER
- $GITHUB_TOKEN

### 使用kind创建k8s集群

```
kind create cluster --name private-cloud --config kind/kind-config.yaml
kind export kubeconfig --name private-cloud
kubectl label nodes private-cloud-worker node-role.kubernetes.io/worker=worker
kubectl label nodes private-cloud-worker2 node-role.kubernetes.io/worker=worker
```

### 部署ingress-nginx

```
kubectl label nodes private-cloud-control-plane ingress-ready="true"
kubectl apply -f ingress-nginx/deploy.yaml
```

### 部署flux

```
flux bootstrap github \
  --owner=$GITHUB_USER \
  --repository=fleet-infra \
  --branch=main \
  --path=./clusters/private-cloud \
  --personal \
  --private false
```

这会在你的github创建一个public的repo：fleet-infra，然后将flux的配置都push到这个repo，让flux自管理。

### 测试flux

- 创建GitRepository配置应用的git源：

```
git clone https://github.com/$GITHUB_USER/fleet-infra
cd fleet-infra
mkdir -p ./clusters/private-cloud/podinfo
flux create source git podinfo \
  --url=https://github.com/songleo/podinfo \
  --branch=master \
  --interval=1m \
  --export > ./clusters/private-cloud/podinfo/podinfo-source.yaml
git add -A && git commit -m "Add podinfo GitRepository"
git push
```
- 创建Kustomization部署应用：

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
  --export > ./clusters/private-cloud/podinfo/podinfo-kustomization.yaml
git add -A && git commit -m "Add podinfo Kustomization"
git push
```

- 查看部署的应用

```
$ k get po -n default
NAME                       READY   STATUS    RESTARTS      AGE
podinfo-664f9748d8-98tvt   1/1     Running   1 (26m ago)   13h
podinfo-664f9748d8-tsrj6   1/1     Running   1 (26m ago)   13h
$ curl www.private-cloud.com/podinfo
{
  "hostname": "podinfo-664f9748d8-98tvt",
  "version": "6.5.4",
  "revision": "33dac1ba40f73555725fbf620bf3b4f6f1a5ad89",
  "color": "#34577c",
  "logo": "https://raw.githubusercontent.com/stefanprodan/podinfo/gh-pages/cuddle_clap.gif",
  "message": "greetings from podinfo v6.5.4",
  "goos": "linux",
  "goarch": "amd64",
  "runtime": "go1.21.5",
  "num_goroutine": "8",
  "num_cpu": "6"
}
```

应用已经成功部署，可以成功访问。现在就可以修改 https://github.com/songleo/podinfo 中应用配置，flux会自动检查并更新应用。比如你可以修改deployment的replicas为1，然后提交修改到repo，flux回自动更新应用deployment。

```
$ git add -A && git commit -m "change replicas to 1"
$ git push
$ k get po
NAME                       READY   STATUS    RESTARTS      AGE
podinfo-664f9748d8-98tvt   1/1     Running   1 (33m ago)   13h
```

### 参考

- https://github.com/songleo/private-cloud
- https://github.com/songleo/fleet-infra
- https://github.com/songleo/podinfo
