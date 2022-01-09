---
layout: post
title: 准入控制器admission controller
date: 2022-01-04 00:12:05
---

准入控制器会在请求通过认证和授权之后、对象被持久化之前拦截到达api服务器的请求。准入控制过程分为两个阶段。第一阶段，运行变更准入控制器。第二阶段，运行验证准入控制器。 再次提醒，某些控制器既是变更准入控制器又是验证准入控制器。如果任何一个阶段的任何控制器拒绝了该请求，则整个请求将立即被拒绝，并向终端用户返回一个错误。默认情况下集群已经启用了很多准入控制器，可以通过修改api-server的启动参数配置启动和关闭其他的准入控制器：

```
# pwd
/etc/kubernetes/manifests
# grep enable-admission-plugins kube-apiserver.yaml
    - --enable-admission-plugins=NodeRestriction
```

这里创建ResourceQuota准入控制器，限制只能创建1个pod，演示其工作过程：

```
# cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ResourceQuota
metadata:
  name: pod-limit
spec:
  hard:
    pods: "1"
EOF
# k get quota
NAME        AGE   REQUEST     LIMIT
pod-limit   24s   pods: 0/1
# k run pod1 --image=nginx
pod/pod1 created
# k get quota
NAME        AGE   REQUEST     LIMIT
pod-limit   69s   pods: 1/1
# k run pod2 --image=nginx
Error from server (Forbidden): pods "pod2" is forbidden: exceeded quota: pod-limit, requested: pods=1, used: pods=1, limited: pods=1
```

可以看到，创建1个pod后，如果再创建pod，会因为超过限制导致创建失败。

配置api-server的启动参数，关闭ResourceQuota准入控制器，再次运行之前的命令：

```
root@master:/etc/kubernetes/manifests# pwd
/etc/kubernetes/manifests
root@master:/etc/kubernetes/manifests# grep admission-plugins kube-apiserver.yaml
    - --enable-admission-plugins=NodeRestriction
    - --disable-admission-plugins=ResourceQuota
root@master:/etc/kubernetes/manifests# systemctl daemon-reload ; systemctl restart kubelet
root@master:/etc/kubernetes/manifests# k get quota
NAME        AGE   REQUEST     LIMIT
pod-limit   14m   pods: 1/1
root@master:/etc/kubernetes/manifests# k get po
NAME   READY   STATUS    RESTARTS   AGE
pod1   1/1     Running   0          13m
root@master:/etc/kubernetes/manifests# k run pod2 --image=nginx
pod/pod2 created
root@master:/etc/kubernetes/manifests# k run pod3 --image=nginx
pod/pod3 created
root@master:/etc/kubernetes/manifests# k get po
NAME   READY   STATUS              RESTARTS   AGE
pod1   1/1     Running             0          14m
pod2   1/1     Running             0          14s
pod3   1/1     Running             0          14s
```

可以看到ResourceQuota已经不生效了，可以创建多个pod。

## ref

- https://kubernetes.io/zh/docs/reference/access-authn-authz/admission-controllers/
