---
layout: post
title: 在kind中使用nodeport
date: 2021-12-16 12:12:05
---

## 1 使用配置文件创建kind：

```shell
$ cat kind-config.yaml
apiVersion: kind.x-k8s.io/v1alpha4
kind: Cluster
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30000
    hostPort: 30000
    listenAddress: "0.0.0.0" # Optional, defaults to "0.0.0.0"
    protocol: tcp # Optional, defaults to tcp
$ kind create cluster --kubeconfig $HOME/.kube/kind-config-kind --config $SHARE_PATH/git/k8s_practice/kind/kind-config.yaml
$ export KUBECONFIG=$HOME/.kube/kind-config-kind
$ k get no
NAME                 STATUS   ROLES                  AGE   VERSION
kind-control-plane   Ready    control-plane,master   34s   v1.20.2
$ docker ps
CONTAINER ID        IMAGE                  COMMAND                  CREATED              STATUS              PORTS                                                 NAMES
b4b2ac861a5c        kindest/node:v1.20.2   "/usr/local/bin/entr…"   About a minute ago   Up About a minute   0.0.0.0:30000->30000/tcp, 127.0.0.1:36442->6443/tcp   kind-control-plane
```

## 2 在kind中创建deployment和service使用nodeport

```shell
$ cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hostname-deployment
  labels:
    app: hostname
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hostname
  template:
    metadata:
      labels:
        app: hostname
    spec:
      containers:
      - name: hostname
        image: quay.io/songleo/hostname
        ports:
        - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: hostname-service
spec:
  type: NodePort
  selector:
    app: hostname
  ports:
    - protocol: TCP
      port: 3000
      targetPort: 3000
      nodePort: 30000
EOF
$ k get po
NAME                                   READY   STATUS    RESTARTS   AGE
hostname-deployment-7457d9b7c6-hvmwl   1/1     Running   0          11s
hostname-deployment-7457d9b7c6-w9mzd   1/1     Running   0          11s
$ k get svc hostname-service
NAME               TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
hostname-service   NodePort   10.96.109.242   <none>        3000:30000/TCP   19s
$ curl localhost:30000
Hostname: hostname-deployment-7457d9b7c6-hvmwl
$ curl 127.0.0.1:30000
Hostname: hostname-deployment-7457d9b7c6-hvmwl
```
