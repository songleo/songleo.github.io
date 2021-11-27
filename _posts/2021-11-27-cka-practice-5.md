---
layout: post
title: cka练习（五）
date: 2021-11-27 12:12:05
---

## 1 pod包含多个container

```shell
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  labels:
    app: myapp
spec:
  containers:
  - name: c1
    image: quay.io/prometheus/busybox:latest
    command: ['sh', '-c', 'echo The c1 is running! && sleep 3600']
  - name: c2
    image: quay.io/prometheus/busybox:latest
    command: ['sh', '-c', 'echo The c2 is running! && sleep 3600']
EOF
$ kgp
NAME        READY   STATUS    RESTARTS   AGE
myapp-pod   2/2     Running   0          90s
$ k logs myapp-pod c1
The c1 is running!
$ k logs myapp-pod c2
The c2 is running!
```

## 2 统计ready节点数量

```shell
$ k get no | grep -w Ready | wc -l
6
$ k describe no | grep -i taints | grep -i nochedule | wc -l
0
$ echo 6 > /opt/nodenum
```

## 3 调度pod到指定节点

```shell
$ k get no
NAME                           STATUS                     ROLES    AGE   VERSION
ip-10-0-128-182.ec2.internal   Ready,SchedulingDisabled   master   47h   v1.21.1+f36aa36
ip-10-0-129-62.ec2.internal    Ready                      worker   47h   v1.21.1+f36aa36
ip-10-0-144-211.ec2.internal   Ready                      worker   47h   v1.21.1+f36aa36
ip-10-0-158-94.ec2.internal    Ready                      master   47h   v1.21.1+f36aa36
ip-10-0-167-32.ec2.internal    Ready                      worker   47h   v1.21.1+f36aa36
ip-10-0-171-215.ec2.internal   Ready                      master   47h   v1.21.1+f36aa36
$ k label no ip-10-0-167-32.ec2.internal disktype=ssd
node/ip-10-0-167-32.ec2.internal labeled
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    env: test
spec:
  containers:
  - name: nginx
    image: nginx
    imagePullPolicy: IfNotPresent
  nodeSelector:
    disktype: ssd
EOF
$ k get po
NAME        READY   STATUS    RESTARTS   AGE
myapp-pod   2/2     Running   0          13m
nginx       1/1     Running   0          10s
$ kd po nginx | grep ip-10-0-167-32.ec2.internal
Node:         ip-10-0-167-32.ec2.internal/10.0.167.32
  Normal  Scheduled       27s   default-scheduler  Successfully assigned ssli/nginx to ip-10-0-167-32.ec2.internal
```
