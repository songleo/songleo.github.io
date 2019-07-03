---
layout: post
title: pod通过环境变量方式使用secret
date: 2019-07-03 00:12:05
---

在pod中需要使用一些敏感信息，如passwd、apitoken等，一般通过secret将这些敏感信息传递给pod，本文主要介绍如何通过环境变量方式传递secret给pod使用，传递的secret主要有2个值，id和key，下面是详细步骤：

### 1 以base64编码格式生成secret信息

```
$ echo -n id-for-test | base64
aWQtZm9yLXRlc3Q=
$ echo -n key-for-test | base64
a2V5LWZvci10ZXN0
```

### 2 将上一步生成的字符串替换到secret-env-demo.yaml文件，内容如下：

```
apiVersion: v1
kind: Secret
metadata:
  name: secret-test
type: Opaque
data:
  id: aWQtZm9yLXRlc3Q=
  key: a2V5LWZvci10ZXN0
```

### 3 创建secret：

```
$ k apply -f secret-env-demo.yaml
secret "secret-test" created
$ k get secret secret-test
NAME          TYPE      DATA      AGE
secret-test   Opaque    2         7s
$ k describe secret secret-test
Name:         secret-test
Namespace:    default
Labels:       <none>
Annotations:
Type:         Opaque

Data
====
id:   11 bytes
key:  12 bytes
```

### 4 创建pod，并通过环境变量方式使用该secret:

```
apiVersion: v1
kind: Pod
metadata:
  name: test-projected-volume 
spec:
  containers:
  - name: test-secret-volume
    image: busybox
    args:
    - sleep
    - "86400"
    env:
      - name: ID
        valueFrom:
          secretKeyRef:
            name: secret-test
            key: id
      - name: KEY
        valueFrom:
          secretKeyRef:
            name: secret-test
            key: key
  restartPolicy: Never
```

### 5 在pod中通过环境变量获取secret：

```
$ k apply -f pod-use-secret-via-env.yaml
pod "test-projected-volume" created
$ kubectl exec -it test-projected-volume -- /bin/sh
/ # echo $ID
id-for-test
/ # echo $KEY
key-for-test
```

可以看到，在pod中正确获取到传递的secret信息。
