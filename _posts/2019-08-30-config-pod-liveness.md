---
layout: post
title: 配置pod的存活探针
date: 2019-08-30 20:04:01
---

存活探针（livenessProbe）主要功能是确定何时重启容器。例如，当应用程序处于运行状态但无法做进一步操作，存活探针将捕获到deadlock，重启处于该状态下的容器，使应用程序在存在bug的情况下依然能够继续运行下去。yaml文件如下：

```
ssli@sslis-mbp-4:demo$ cat exec-liveness.yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: liveness
  name: liveness-exec
spec:
  containers:
  - name: liveness
    image: k8s.gcr.io/busybox
    args:
    - /bin/sh
    - -c
    - touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 600
    livenessProbe:
      exec:
        command:
        - cat
        - /tmp/healthy
      initialDelaySeconds: 5
      periodSeconds: 5

ssli@sslis-mbp-4:demo$ k apply -f exec-liveness.yaml
pod/liveness-exec created
```

定义了相应的存活探针，该探针在pod启动5s后，每隔5秒执行一次cat /tmp/healthy命令，如果该命令返回非0，则表示存活性检测失败，kubelet就会杀掉该容器并重启它。

容器运行后，会自动创建/tmp/healthy文件，然后30秒后，会删除该文件。所以会导致cat /tmp/healthy命令执行失败。通过查看pod的状态可以看到：

```
ssli@sslis-mbp-4:demo$ k get po
NAME            READY   STATUS    RESTARTS   AGE
liveness-exec   1/1     Running   1          98s
```

pod重启次数变成1。查看pod的events可以看到，由于存活性检测失败，所以导致pod重启：

```
ssli@sslis-mbp-4:demo$ k describe po liveness-exec

···

Events:
  Type     Reason     Age                    From                         Message
  ----     ------     ----                   ----                         -------
  Normal   Scheduled  4m49s                  default-scheduler            Successfully assigned default/liveness-exec to kind-control-plane
  Normal   Pulled     2m18s (x3 over 4m46s)  kubelet, kind-control-plane  Successfully pulled image "k8s.gcr.io/busybox"
  Normal   Created    2m18s (x3 over 4m45s)  kubelet, kind-control-plane  Created container
  Normal   Started    2m18s (x3 over 4m45s)  kubelet, kind-control-plane  Started container
  Warning  Unhealthy  95s (x9 over 4m15s)    kubelet, kind-control-plane  Liveness probe failed: cat: can't open '/tmp/healthy': No such file or directory
  Normal   Pulling    65s (x4 over 4m47s)    kubelet, kind-control-plane  pulling image "k8s.gcr.io/busybox"
  Normal   Killing    65s (x3 over 3m35s)    kubelet, kind-control-plane  Killing container with id docker://liveness:Container failed liveness probe.. Container will be killed and recreated.
```
