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

- 给节点增加/删除标签

```
kubectl label nodes node-name key=value
kubectl label nodes node-name key-
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
kubectl port-forward minio-5cd8b89db8-rz2jk 9000:9000
kubectl port-forward pod/minio-5cd8b89db8-rz2jk 9000:9000
```

- 删除ns

```
export NAMESPACE=open-cluster-management-hub
kubectl get namespace $NAMESPACE -o json > tmp.json
sed -i '/kubernetes/d' ./tmp.json
kubectl replace --raw "/api/v1/namespaces/$NAMESPACE/finalize" -f ./tmp.json

curl -k -H "Content-Type: application/json" -X PUT --data-binary @tmp.json https://api.soli-ocp44-acm.dev05.red-chesterfield.com/api/v1/namespaces/$NAMESPACE/finalize

oc patch -n open-cluster-management-observability project/open-cluster-management-observability --type=merge -p '{"metadata": {"finalizers":null}}'
```

- 强制删除pod

```
kubectl delete pod --grace-period=0 --force --namespace [NAMESPACE] [POD_NAME]
```

- 节点污点

```
kubectl taint nodes node1 key=value:NoSchedule
kubectl taint nodes node1 key:NoSchedule-
```

- 标记节点不调度

```
kubectl cordon $NODENAME
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

- 登录到节点

```
oc debug node/worker001
```

> :) 未完待续......
