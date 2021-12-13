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

## 2 配置网络策略

```shell
$ k create deploy front-end  --image=nginx
```

## 3 etcd备份和还原

```shell
$ ETCDCTL_API=3 etcdctl --endpoints 127.0.0.1:2379 --cert /etc/kubernetes/pki/etcd/server.crt --key /etc/kubernetes/pki/etcd/server.key --cacert /etc/kubernetes/pki/etcd/ca.crt snapshot save /tmp/etcd_snampshot.db
$ ETCDCTL_API=3 etcdctl --endpoints 127.0.0.1:2379 --cert /etc/kubernetes/pki/etcd/server.crt --key /etc/kubernetes/pki/etcd/server.key --cacert /etc/kubernetes/pki/etcd/ca.crt snapshot restore /tmp/etcd_snampshot.db
```
