---
layout: post
title: 在kind中部署metrics-server
date: 2024-01-09 00:12:05
---

### 使用kind创建k8s集群

```
kind create cluster --name private-cloud --config kind/kind-config.yaml
kind export kubeconfig --name private-cloud
kubectl label nodes private-cloud-worker node-role.kubernetes.io/worker=worker
kubectl label nodes private-cloud-worker2 node-role.kubernetes.io/worker=worker
```

### 部署metrics-server

```
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

你会发现不work，需要在metrics-server的deployment中args部分添加一行`- --kubelet-insecure-tls`，让kubelet忽略tls证书验证，这样才能正常工作。

### 验证

```
$ k top no
NAME                          CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
private-cloud-control-plane   225m         3%     1375Mi          8%
private-cloud-worker          59m          0%     2522Mi          15%
private-cloud-worker2         59m          0%     2059Mi          12%
```

### 参考

- https://github.com/songleo/private-cloud
- https://github.com/kubernetes-sigs/metrics-server
