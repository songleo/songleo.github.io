---
layout: post
title: cka练习（四）
date: 2021-11-27 12:12:05
---

## 1 pod日志监控

```shell
$ k logs metrics-collector-deployment-7dd675f96f-zzhbc | grep failed >> /tmp/failed-log
$ cat /tmp/failed-log
level=warn caller=logger.go:50 ts=2021-11-26T01:28:43.529613851Z component=forwarder component=metricsclient msg="failed to forward request" err="Post \"https://observatorium-api-open-cluster-management-observability.apps.obs-china-aws-480-z86md.dev05.red-chesterfield.com/api/metrics/v1/default/api/v1/receive\": context deadline exceeded"
level=warn caller=logger.go:50 ts=2021-11-26T01:28:43.529670993Z component=forwarder component=metricsclient msg="error: failed to forward request happened at time: 446.904363ms"
```

## 2 创建和使用pvc

```shell
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: task-pv-claim
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp2
  resources:
    requests:
      storage: 10Mi
EOF

$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: task-pv-pod
spec:
  volumes:
    - name: task-pv-storage
      persistentVolumeClaim:
        claimName: task-pv-claim
  containers:
    - name: task-pv-container
      image: nginx
      ports:
        - containerPort: 80
          name: "http-server"
      volumeMounts:
        - mountPath: "/usr/share/nginx/html"
          name: task-pv-storage
EOF
$ k get po
NAME          READY   STATUS    RESTARTS   AGE
task-pv-pod   1/1     Running   0          60s
$ k get pvc
NAME            STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
task-pv-claim   Bound    pvc-99109863-c682-488c-84f8-ca93c16f481f   1Gi        RWO            gp2            78s
$k edit pvc task-pv-claim --record
persistentvolumeclaim/task-pv-claim edited
```

## 3 创建pv

```shell
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolume
metadata:
  name: task-pv-volume
  labels:
    type: local
spec:
  storageClassName: manual
  capacity:
    storage: 2Gi
  accessModes:
    - ReadWriteMany
  hostPath:
    path: "/mnt/data"
EOF
$ k get pv task-pv-volume -o yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"PersistentVolume","metadata":{"annotations":{},"labels":{"type":"local"},"name":"task-pv-volume"},"spec":{"accessModes":["ReadWriteMany"],"capacity":{"storage":"2Gi"},"hostPath":{"path":"/mnt/data"},"storageClassName":"manual"}}
  creationTimestamp: "2021-11-27T02:49:18Z"
  finalizers:
  - kubernetes.io/pv-protection
  labels:
    type: local
  name: task-pv-volume
  resourceVersion: "3148081"
  uid: 56c235ba-7535-4605-a3ef-ac69e8dfe17b
spec:
  accessModes:
  - ReadWriteMany
  capacity:
    storage: 2Gi
  hostPath:
    path: /mnt/data
    type: ""
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  volumeMode: Filesystem
status:
  phase: Available
```
