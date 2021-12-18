---
layout: post
title: cka练习（十三）
date: 2021-12-18 00:12:05
---

```shell
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: s1
type: Opaque
stringData:
  name1: tom1
---
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: mycontainer
    image: quay.io/songleo/nginx
    env:
      - name: MYENV
        valueFrom:
          secretKeyRef:
            name: s1
            key: name1
  restartPolicy: Never
EOF
$ k get secret s1
NAME   TYPE     DATA   AGE
s1     Opaque   1      8s
$ k get po
NAME    READY   STATUS    RESTARTS   AGE
nginx   1/1     Running   0          107s
$ k exec nginx -- env | grep MYENV
MYENV=tom1
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: cm1
data:
  name2: tom2
---
apiVersion: v1
kind: Pod
metadata:
  name: nginx2
spec:
  containers:
  - name: mypod
    image: quay.io/songleo/nginx
    volumeMounts:
    - name: foo
      mountPath: "/also/data"
      readOnly: true
  volumes:
  - name: foo
    configMap:
      name: cm1
EOF
$ k get cm
NAME               DATA   AGE
cm1                1      26s
kube-root-ca.crt   1      7m22s
$ k get cm cm1
NAME   DATA   AGE
cm1    1      31s
$ k get po
NAME     READY   STATUS    RESTARTS   AGE
nginx2   1/1     Running   0          34s
$ k exec nginx2 -- ls /also/data
name2
$ k exec nginx2 -- cat /also/data/name2
tom2
```

## 参考

- cka/ckad应试指南：从docker到kubernetes完全攻略 ch-7
