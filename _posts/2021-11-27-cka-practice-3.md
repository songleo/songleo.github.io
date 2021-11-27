---
layout: post
title: cka练习（三）
date: 2021-11-27 12:12:05
---

## 1 排查故障节点

```shell
$ k get no
NAME                                       STATUS   ROLES    AGE     VERSION
gke-ssli-demo-default-pool-0cba9a7c-rbff   Ready    <none>   6d12h   v1.21.5-gke.1302
gke-ssli-demo-default-pool-0cba9a7c-skr2   Ready    <none>   6d12h   v1.21.5-gke.1302
gke-ssli-demo-default-pool-0cba9a7c-z04c   Ready    <none>   6d12h   v1.21.5-gke.1302
$ systemctl status kubelet
$ systemctl enable kubelet
$ systemctl restart kubelet
$ systemctl status kubelet
$ k get no
NAME                                       STATUS   ROLES    AGE     VERSION
gke-ssli-demo-default-pool-0cba9a7c-rbff   Ready    <none>   6d12h   v1.21.5-gke.1302
gke-ssli-demo-default-pool-0cba9a7c-skr2   Ready    <none>   6d12h   v1.21.5-gke.1302
gke-ssli-demo-default-pool-0cba9a7c-z04c   Ready    <none>   6d12h   v1.21.5-gke.1302
```

## 2 cpu或者mem使用率最高的pod

```shell

$ k top pod --sort-by=cpu -l app=rbac-query-proxy
NAME                                              CPU(cores)   MEMORY(bytes)
observability-rbac-query-proxy-5f7b55cd66-2qh8d   1m           46Mi
observability-rbac-query-proxy-5f7b55cd66-fpl7b   1m           52Mi
observability-rbac-query-proxy-5f7b55cd66-mf8r5   0m           46Mi
$ k top pod --sort-by=cpu
NAME                                                       CPU(cores)   MEMORY(bytes)
observability-thanos-receive-default-0                     9m           198Mi
observability-thanos-receive-default-1                     5m           186Mi
observability-thanos-rule-0                                2m           65Mi
observability-alertmanager-1                               2m           70Mi
observability-thanos-query-687578fbb-88wd6                 1m           45Mi
observability-thanos-store-memcached-0                     1m           44Mi
observability-thanos-store-memcached-1                     1m           39Mi
observability-thanos-store-shard-0-0                       1m           54Mi
observability-alertmanager-0                               1m           71Mi
observability-thanos-query-687578fbb-wprgt                 1m           39Mi
observability-rbac-query-proxy-5f7b55cd66-2qh8d            1m           46Mi
observability-rbac-query-proxy-5f7b55cd66-fpl7b            1m           52Mi
$ k top pod --sort-by=memory
NAME                                                       CPU(cores)   MEMORY(bytes)
observability-thanos-receive-default-1                     3m           189Mi
observability-thanos-receive-default-0                     6m           183Mi
minio-fcbfcbb8f-cs8j6                                      3m           162Mi
observability-grafana-5f67845cc-2cg4w                      0m           87Mi
observability-grafana-5f67845cc-b5l8f                      0m           84Mi
observability-grafana-5f67845cc-gb9q2                      0m           83Mi
observability-alertmanager-0                               1m           73Mi
observability-alertmanager-1                               2m           70Mi
observability-thanos-rule-0                                0m           66Mi
observability-thanos-compact-0                             1m           62Mi
observability-thanos-store-shard-2-0                       0m           59Mi
observability-observatorium-operator-6c948547bd-mkqnd      0m           53Mi
observability-rbac-query-proxy-5f7b55cd66-fpl7b            0m           52Mi
observability-thanos-store-shard-0-0                       1m           51Mi
observability-thanos-store-shard-1-0                       1m           47Mi
observability-rbac-query-proxy-5f7b55cd66-2qh8d            1m           46Mi
```

## 3 添加sidecar容器

```
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: null
  labels:
    run: 11-factor-app
  name: 11-factor-app
spec:
  containers:
  - name: 11-factor-app
    args: [/bin/sh, -c, 'cd /tmp && touch log && echo "log info" > log && sleep 1000']
    image: busybox
    volumeMounts:
    - name: varlog
      mountPath: /tmp
  - name: sidecar
    args: [/bin/sh, -c, 'cd /tmp && cat log && sleep 1000']
    image: busybox
    name: sidecar
    volumeMounts:
    - name: varlog
      mountPath: /tmp
  volumes:
  - name: varlog
    emptyDir: {}
EOF
$ k get po
NAME            READY   STATUS    RESTARTS   AGE
11-factor-app   2/2     Running   0          9s
ssli            1/1     Running   1          13m
$ k logs 11-factor-app -c sidecar
log info
```
