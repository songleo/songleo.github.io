---
layout: post
title: kubernetes service之node port
date: 2019-09-26 00:12:05
---

deployment和service定义如下：

```
# cat service-via-node-port.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hostnames
spec:
  selector:
    matchLabels:
      app: hostnames
  replicas: 3
  template:
    metadata:
      labels:
        app: hostnames
    spec:
      containers:
      - name: hostnames
        image: k8s.gcr.io/serve_hostname
        ports:
        - containerPort: 9376
          protocol: TCP

---
apiVersion: v1
kind: Service
metadata:
  name: hostnames
spec:
  type: NodePort
  selector:
    app: hostnames
  ports:
  - name: default
    protocol: TCP
    port: 9376
    nodePort: 30000
```

这里部署的hostnames应用主要功能是当访问它的9376端口时，会返回它自己的主机名，创建相应的deployment和service：

```
# k apply -f service-via-node-port.yaml
deployment.apps/hostnames created
service/hostnames created
# k get deploy hostnames
NAME        READY   UP-TO-DATE   AVAILABLE   AGE
hostnames   3/3     3            3           11s
# k get po
NAME                        READY   STATUS    RESTARTS   AGE
hostnames-85bc9c579-bz98x   1/1     Running   0          17s
hostnames-85bc9c579-djjqm   1/1     Running   0          17s
hostnames-85bc9c579-k2kzt   1/1     Running   0          17s
```

查询service和相应的endpoints，并通过任意节点的ip和指定的node port（30000）访问pod:

```
# k get svc hostnames
NAME        TYPE       CLUSTER-IP    EXTERNAL-IP   PORT(S)          AGE
hostnames   NodePort   10.0.92.250   <none>        9376:30000/TCP   40s
# k get ep hostnames
NAME        ENDPOINTS                                              AGE
hostnames   10.1.161.13:9376,10.1.166.150:9376,10.1.166.188:9376   47s
# k get no
NAME             STATUS   ROLES               AGE   VERSION
172.16.217.225   Ready    etcd,master,proxy   51d   v1.13.5+icp-ee
172.16.244.153   Ready    management,worker   51d   v1.13.5+icp-ee
172.16.244.158   Ready    worker              51d   v1.13.5+icp-ee
# curl 172.16.217.225:30000
hostnames-85bc9c579-djjqm
# curl 172.16.244.153:30000
hostnames-85bc9c579-djjqm
# curl 172.16.244.158:30000
hostnames-85bc9c579-djjqm
# curl 172.16.244.158:30000
hostnames-85bc9c579-k2kzt
# curl 172.16.244.153:30000
hostnames-85bc9c579-bz98x
```

使用node port模式的service时，可以通过集群任意节点ip访问部署的hostnames，并且查看service的endpoints，可以看到其后端代理的pod的ip，当某个pod出现问题时，kubernetes会将其从service的endpoints中移除，确保应用能正常的被访问，以上就是node port模式的service。

