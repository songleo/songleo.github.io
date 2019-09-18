---
layout: post
title: pod通过vol方式使用secret
date: 2019-09-18 00:12:05
---

在pod中需要使用一些敏感信息，如passwd、token等，一般通过secret将这些敏感信息传递给pod，本文主要介绍如何通过vol方式传递secret给pod使用，传递的secret主要有2个值，id和key，下面是详细步骤：

### 1 以base64编码格式生成secret信息

```
$ echo -n id-for-test | base64
aWQtZm9yLXRlc3Q=
$ echo -n key-for-test | base64
a2V5LWZvci10ZXN0
```

### 2 将上一步生成的字符串替换到secret-vol-demo.yaml文件，内容如下：

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
$ k apply -f secret-vol-demo.yaml
secret "secret-test" created
$ k get secret secret-test -o yaml
apiVersion: v1
data:
  id: aWQtZm9yLXRlc3Q=
  key: a2V5LWZvci10ZXN0
kind: Secret
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","data":{"id":"aWQtZm9yLXRlc3Q=","key":"a2V5LWZvci10ZXN0"},"kind":"Secret","metadata":{"annotations":{},"name":"secret-test","namespace":"default"},"type":"Opaque"}
  creationTimestamp: 2019-07-05T06:17:13Z
  name: secret-test
  namespace: default
  resourceVersion: "22599"
  selfLink: /api/v1/namespaces/default/secrets/secret-test
  uid: 879dad69-9eec-11e9-9e62-0242918e8d3d
type: Opaque
```

### 4 创建pod，并通过环境变量方式使用该secret:

```
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
spec:
  containers:
    - name: test-container
      image: busybox
      command: [ "/bin/sh", "-c", "sleep 1000" ]
      volumeMounts:
      - name: config-volume
        mountPath: /test/dir
        readOnly: true
  volumes:
    - name: config-volume
      secret:
        secretName: secret-test
  restartPolicy: Never
```

### 5 在pod中通过vol获取secret：

```
$ k apply -f pod-use-secret-via-vol.yaml
pod "test-pod" created
$ kubectl exec -it test-pod -- /bin/sh
/ # cd /test/dir
/test/dir # ls
id   key
/test/dir # cat id && echo
id-for-test
/test/dir # cat key && echo
key-for-test
```

可以看到，在pod中正确获取到secret。当然，也可以挂载secret中某个key到指定目录，修改后的pod-use-secret-via-vol.yaml：

```
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
spec:
  containers:
    - name: test-container
      image: busybox
      command: [ "/bin/sh", "-c", "sleep 1000" ]
      volumeMounts:
      - name: config-volume
        mountPath: /test
        readOnly: true
  volumes:
    - name: config-volume
      secret:
        secretName: secret-test
        items:
        - key: id
          path: id
        - key: key
          path: key
  restartPolicy: Never
```

进入pod查看secret：

```
$ k apply -f pod-use-secret-via-vol.yaml
pod "test-pod" created
$ kubectl exec -it test-pod -- /bin/sh
/ # cd /test
/test # ls
id   key
/test # cat id && echo
id-for-test
/test # cat key && echo
key-for-test
```
