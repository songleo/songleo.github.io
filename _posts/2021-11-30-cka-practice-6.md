---
layout: post
title: cka练习（六）
date: 2021-11-30 12:12:05
---

```shell
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: c1
  labels:
    app: c1
spec:
  containers:
  - name: c1
    image: quay.io/prometheus/busybox:latest
    command: ['sh', '-c', 'echo The c1 is running! && sleep 3600']
    securityContext:
      allowPrivilegeEscalation: false
      runAsUser: 0
---
apiVersion: v1
kind: Pod
metadata:
  name: c2
  labels:
    app: c2
spec:
  containers:
  - name: c2
    image: quay.io/prometheus/busybox:latest
    command: ['sh', '-c', 'echo The c2 is running! && sleep 3600']
    securityContext:
      allowPrivilegeEscalation: false
      runAsUser: 0
---
apiVersion: v1
kind: Pod
metadata:
  name: c3
  labels:
    app: c3
spec:
  containers:
  - name: c3
    image: quay.io/bitnami/nginx:latest
---
apiVersion: v1
kind: Pod
metadata:
  name: c4
  labels:
    app: c4
spec:
  containers:
  - name: c4
    image: quay.io/bitnami/nginx:latest
EOF
$ cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: myp1
spec:
  podSelector:
    matchLabels:
      app: c3
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: c1
    ports:
    - protocol: TCP
      port: 80
EOF
$ cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: myp2
spec:
  podSelector:
    matchLabels:
      app: c4
  policyTypes:
  - Ingress
  ingress:
  - from:
    - ipBlock:
        cidr: 192.168.26.0/24
    ports:
    - protocol: TCP
      port: 80
EOF
```

## 参考

- cka/ckad应试指南：从docker到kubernetes完全攻略 ch-13
