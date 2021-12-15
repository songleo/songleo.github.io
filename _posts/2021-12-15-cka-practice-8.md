---
layout: post
title: cka练习（八）
date: 2021-12-15 12:12:05
---

```shell
$ k get svc kube-dns -n kube-system -o yaml
apiVersion: v1
kind: Service
metadata:
  annotations:
    prometheus.io/port: "9153"
    prometheus.io/scrape: "true"
  creationTimestamp: "2021-12-13T13:51:48Z"
  labels:
    k8s-app: kube-dns
    kubernetes.io/cluster-service: "true"
    kubernetes.io/name: KubeDNS
  name: kube-dns
  namespace: kube-system
  resourceVersion: "237"
  uid: 3dd1a169-1bb9-4500-b065-12a605b2ec54
spec:
  clusterIP: 10.96.0.10
  clusterIPs:
  - 10.96.0.10
  ports:
  - name: dns
    port: 53
    protocol: UDP
    targetPort: 53
  - name: dns-tcp
    port: 53
    protocol: TCP
    targetPort: 53
  - name: metrics
    port: 9153
    protocol: TCP
    targetPort: 9153
  selector:
    k8s-app: kube-dns
  sessionAffinity: None
  type: ClusterIP
status:
  loadBalancer: {}
$ k get po -n kube-system -lk8s-app=kube-dns
NAME                      READY   STATUS    RESTARTS   AGE
coredns-74ff55c5b-dgk6m   1/1     Running   0          46h
coredns-74ff55c5b-hg46l   1/1     Running   0          46h
$ cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web2
  labels:
    app-name1: web1
    app-name2: web2
spec:
  replicas: 1
  selector:
    matchLabels:
      app-name1: web1
      app-name2: web2
  template:
    metadata:
      labels:
        app-name1: web1
        app-name2: web2
    spec:
      containers:
      - name: nginx
        image: quay.io/bitnami/nginx:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: svc-web
spec:
  type: NodePort
  selector:
    app-name1: web1
    app-name2: web2
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30000
EOF
$ k get svc svc-web
NAME      TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
svc-web   NodePort   10.96.151.118   <none>        80:30000/TCP   14m
$ curl http://node-ip:30000
```

## 参考

- cka/ckad应试指南：从docker到kubernetes完全攻略 ch-12
