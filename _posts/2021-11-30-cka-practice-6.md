---
layout: post
title: cka练习（六）
date: 2021-11-30 12:12:05
---

## 1 deployment扩容

```shell
root@~$ k create deployment my-dep --image=busybox -- /bin/sh -c "sleep 1000"
deployment.apps/my-dep created
[soli.hosts.dev.upshift.rdu2.redhat.com] [12:24:32 AM]
root@~$ k get po
NAME                      READY   STATUS    RESTARTS   AGE
my-dep-69479b8955-jj2pk   1/1     Running   0          9s
[soli.hosts.dev.upshift.rdu2.redhat.com] [12:24:41 AM]
root@~$ k scale deploy my-dep --replicas=3 --record
deployment.apps/my-dep scaled
[soli.hosts.dev.upshift.rdu2.redhat.com] [12:25:01 AM]
root@~$k get po
NAME                      READY   STATUS    RESTARTS   AGE
my-dep-69479b8955-jj2pk   1/1     Running   0          38s
my-dep-69479b8955-mwl9v   1/1     Running   0          9s
my-dep-69479b8955-r48hr   1/1     Running   0          9s
```

## 2 创建svc

```shell
$ k create deploy front-end  --image=nginx
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
