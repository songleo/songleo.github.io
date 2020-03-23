---
layout: post
title: 通过nfs方式创建pv/pvc
date: 2020-03-23 12:12:05
---

### 搭建nfs server

在/etc/exports中添加一下内容：

```
/root/share 10.0.0.0/8(rw,sync,no_wdelay,no_root_squash,insecure,fsid=0)
```

参数具体解释如下：

- 10.0.0.0/8：可以访问的主机ip段
- rw：可读写
- sync：将数据同步写入内存和磁盘
- no_wdelay：若执行写操作，立即执行，须和sync一起使用
- no_root_squash：如果进入该目录的用户时root，就具备root权限
- insecure：允许客户端从大于1024的tcp/ip端口连接nfs server
- fsid=0：nfs文件系统的uuid，为0时只能共享一个目录

重启nfs相关服务：

```
$ systemctl restart rpcbind.service
$ systemctl restart nfs.service
```

确认设置生效：

```
$ exportfs
/root/share     10.0.0.0/8
$ showmount -e
Export list for ssli-ocp1-inf.fyre.ibm.com:
/root/share    10.0.0.0/8
```

## 创建相应的pv和pvc

pv.yaml如下：

```
apiVersion: v1
kind: PersistentVolume
metadata:
  name: share
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Recycle
  volumeMode: Filesystem
  nfs:
    server: 10.16.60.168
    path: "/root/share"
```

pvc.yaml如下：

```
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: share
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 1Gi
```

创建pv和pvc：

```
$ oc apply -f pv.yaml
persistentvolume/share created
$ oc apply -f pvc.yaml
persistentvolumeclaim/share created
$ oc get pv share
NAME    CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM           STORAGECLASS   REASON   AGE
share   1Gi        RWX            Recycle          Bound    default/share                           9s
$ oc get pvc share
NAME    STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
share   Bound    share    1Gi        RWX                           11s
```

### 创建pod使用该pvc

pod.yaml如下：

```
apiVersion: v1
kind: Pod
metadata:
  name: busybox
spec:
  containers:
  - name: busybox
    image: busybox
    command:
      - sleep
      - "3600"
    volumeMounts:
        - name: share
          mountPath: "/share"
  volumes:
  - name: share
    persistentVolumeClaim:
      claimName: share
```

创建pod并进入pvc的share目录创建test文件：

```
$ oc apply -f pod.yaml
pod/busybox created
$ oc exec -it busybox /bin/sh
/ # cd share/
/share # touch test
/share # exit
```

删除pod后，再次使用该pvc，可以看到test文件依然存在：

```
$ oc delete -f pod.yaml
pod "busybox" deleted
$ oc apply -f pod.yaml
pod/busybox created
$ oc exec -it busybox /bin/sh
/ # ls /share/
test
/ # exit
```
