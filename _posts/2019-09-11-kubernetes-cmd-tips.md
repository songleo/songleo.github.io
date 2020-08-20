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

- apply当前目录下的所有yaml

```
kubectl apply -f .
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

- 查看详细的请求和响应信息

```
kubectl get pods --v=8
```

- 查看kubectl的http请求流程

```
kubectl get po -v 10
```

- 端口转发

```
kubectl port-forward pod/minio-5cd8b89db8-rz2jk 9000:9000
```

- 创建deployment

```
kubectl create deployment nginx --image=nginx
```

- 查看当前用户权限

```
kubectl auth can-i get po
```

- 使用本地代理转发请求到api server

```
oc proxy --port=8001
curl -X GET http://localhost:8001
```

> :) 未完待续......
