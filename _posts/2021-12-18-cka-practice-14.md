---
layout: post
title: cka练习（十四）
date: 2021-12-18 00:12:05
---

```shell
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: pod1
  labels:
    app: myapp
spec:
  containers:
  - name: c1
    image: quay.io/songleo/nginx
    volumeMounts:
    - mountPath: /data
      name: v1
  volumes:
  - name: v1
    emptyDir: {}
  initContainers:
  - name: initc1
    image: quay.io/songleo/busybox
    command: ['sh', '-c', "touch /data/aa.txt"]
    volumeMounts:
    - mountPath: /data
      name: v1
EOF
$ k get po
NAME   READY   STATUS    RESTARTS   AGE
pod1   1/1     Running   0          5s
$ k exec pod1 -c c1 -- ls /data/
aa.txt
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv10
  labels:
    type: local
spec:
  storageClassName: cka
  capacity:
    storage: 2Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: "/pv10"
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc10
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: cka
  resources:
    requests:
      storage: 2Gi
---
apiVersion: v1
kind: Pod
metadata:
  name: pod-pvc
spec:
  containers:
  - image: quay.io/songleo/nginx
    name: test-container
    volumeMounts:
    - mountPath: /data
      name: v1
  volumes:
    - name: v1
      persistentVolumeClaim:
        claimName: pvc10
EOF
$ k get po
NAME      READY   STATUS    RESTARTS   AGE
pod-pvc   1/1     Running   0          31s
$ k get pv
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM       STORAGECLASS   REASON   AGE
pv10   2Gi        RWO            Retain           Bound    ch6/pvc10   cka                     33s
$ k get pvc
NAME    STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
pvc10   Bound    pv10     2Gi        RWO            cka            36s
```

## 参考

- cka/ckad应试指南：从docker到kubernetes完全攻略 ch-6
