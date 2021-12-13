---
layout: post
title: cka练习（七）
date: 2021-12-13 12:12:05
---

```shell
$ cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: ssli
  name: role1
rules:
- apiGroups: [""] # "" indicates the core API group
  resources: ["pods"]
  verbs: ["get", "create"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get"]
EOF
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: LimitRange
metadata:
  name: mylimit
spec:
  limits:
  - max:
      memory: 800Mi
    type: Container
EOF
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ResourceQuota
metadata:
  name: myquota
spec:
  hard:
    pods: "6"
    services: "6"
EOF
root@~$ k create sa mysa
serviceaccount/mysa created
$ cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mydep
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: quay.io/bitnami/nginx:latest
        imagePullPolicy: IfNotPresent
EOF
$ k set sa deploy mydep mysa
root@~$ k get po
NAME                     READY   STATUS    RESTARTS   AGE
mydep-6554f87fff-jm9pw   1/1     Running   0          30s
mydep-6554f87fff-mn45n   1/1     Running   0          24s
mydep-6554f87fff-tl4wr   1/1     Running   0          21s
```

## 参考

- cka/ckad应试指南：从docker到kubernetes完全攻略 ch-15
