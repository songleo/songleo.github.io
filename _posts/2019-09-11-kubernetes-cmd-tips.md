---
layout: post
title: kubernetes命令tips
date: 2019-09-11 00:12:05
---

- kubectl使用指定的配置文件

```
kubectl --kubeconfig /path/to/kubeconfig get no
```

- 进入pod中容器

```
kubectl exec -it  -n ns pod-name /bin/sh
```

- 设置KUBECONFIG

```
export KUBECONFIG=path/to/kubeconfig
```

- 删除所有po

```
kubectl delete po --all
```

- 查询所有ns下pod

```
kubectl get pods --all-namespaces
```

- 修改对象

```
kubectl edit deploy nginx-test
```

- 给节点加标签

```
kubectl label nodes node-name key=value
```

> :) 未完待续......
