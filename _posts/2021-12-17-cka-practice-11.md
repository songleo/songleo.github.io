---
layout: post
title: cka练习（十一）
date: 2021-12-17 12:12:05
---

```shell
$ cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: ds-test1
  labels:
    k8s-app: ds-test1
spec:
  selector:
    matchLabels:
      name: ds-test1
  template:
    metadata:
      labels:
        name: ds-test1
    spec:
      tolerations:
      # this toleration is to have the daemonset runnable on master nodes
      # remove it if your masters can't run pods
      # - key: node-role.kubernetes.io/master
      #   operator: Exists
      #   effect: NoSchedule
      containers:
      - name: ds-test1
        image: quay.io/songleo/nginx
EOF
$ k get ds
NAME       DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
ds-test1   1         1         0       1            0           <none>          3s
$ k get po
NAME             READY   STATUS    RESTARTS   AGE
ds-test1-ht44f   1/1     Running   0          7s

$ cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: ds-test2
  labels:
    k8s-app: ds-test2
spec:
  selector:
    matchLabels:
      name: ds-test2
  template:
    metadata:
      labels:
        name: ds-test2
    spec:
      tolerations:
      # this toleration is to have the daemonset runnable on master nodes
      # remove it if your masters can't run pods
      # - key: node-role.kubernetes.io/master
      #   operator: Exists
      #   effect: NoSchedule
      containers:
      - name: ds-test2
        image: quay.io/songleo/nginx
      nodeSelector:
        disktype: ssd
EOF
$ k label node kind-control-plane disktype=ssd
node/kind-control-plane labeled
$ k get po
NAME             READY   STATUS    RESTARTS   AGE
ds-test2-dkv2x   1/1     Running   0          29s
```

## 参考

- cka/ckad应试指南：从docker到kubernetes完全攻略 ch-9
