---
layout: post
title: 添加configmap数据到卷
date: 2019-07-01 00:12:05
---

config.yaml如下：

```
environments:
    dev:
        url: http://dev.bar.com
        name: Developer Setup
    prod:
        url: http://foo.bar.com
        name: My Cool App
my:
    servers:
        - dev.bar.com
        - foo.bar.com
```


从config.yaml文件创建configmap:

```
$ kubectl create configmap demo-from-file --from-file=./config.yaml
configmap "demo-from-file" created
$ kubectl get configmaps demo-from-file
NAME             DATA      AGE
demo-from-file   1         9s
$ kubectl describe configmaps demo-from-file
Name:         demo-from-file
Namespace:    default
Labels:       <none>
Annotations:  <none>

Data
====
config.yaml:
----
environments:
    dev:
        url: http://dev.bar.com
        name: Developer Setup
    prod:
        url: http://foo.bar.com
        name: My Cool App
my:
    servers:
        - dev.bar.com
        - foo.bar.com

Events:  <none>
```


创建pod使用创建的configmap：

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
        # Provide the name of the ConfigMap containing the files you want
        # to add to the container
        name: demo-from-file
  restartPolicy: Never
```

查看pod的日志，确实输出了文件的相关内容：

```
$ k apply -f pod-use-configmap-via-vol.yaml
pod "test-pod" created
$ k get po
NAME            READY     STATUS      RESTARTS   AGE
test-pod   0/1       Completed   0          8s
$ k logs test-pod
environments:
    dev:
        url: http://dev.bar.com
        name: Developer Setup
    prod:
        url: http://foo.bar.com
        name: My Cool App
my:
    servers:
        - dev.bar.com
        - foo.bar.com
```

