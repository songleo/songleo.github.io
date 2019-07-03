---
layout: post
title: 添加configmap数据到卷
date: 2019-07-01 00:12:05
---

### 1 config.yaml如下：

```
$ cat config.yaml
config:
  foo: bar
```

### 2 从config.yaml文件创建configmap:

```
$ kubectl create configmap demo-from-file --from-file=./config.yaml
configmap "demo-from-file" created
$ kubectl get configmaps demo-from-file
NAME             DATA      AGE
demo-from-file   1         8s
$ kubectl describe configmaps demo-from-file
Name:         demo-from-file
Namespace:    default
Labels:       <none>
Annotations:  <none>

Data
====
config.yaml:
----
config:
  foo: bar

Events:  <none>
```

### 3 创建pod使用创建的configmap：

```
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
spec:
  containers:
    - name: test-container
      image: gcr.io/google_containers/busybox
      command: [ "/bin/sh", "-c", "cat /etc/config/config.yaml" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
  volumes:
    - name: config-volume
      configMap:
        name: demo-from-file
  restartPolicy: Never
```

这里将configmap挂载到/etc/config目录，然后在容器中运行命令查看该文件内容，最后查看pod的日志，确实输出了文件的内容：

```
$ k apply -f pod-use-configmap-via-vol.yaml
pod "test-pod" created
$ k get po
NAME       READY     STATUS      RESTARTS   AGE
test-pod   0/1       Completed   0          6s
$ k logs test-pod
config:
  foo: bar
```
