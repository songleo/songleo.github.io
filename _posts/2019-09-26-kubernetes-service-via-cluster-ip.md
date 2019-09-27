---
layout: post
title: kubernetes service之cluster ip
date: 2019-09-26 00:12:05
---

deployment和service定义如下：

```
# cat service-via-cluster-ip.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hostnames
spec:
  selector:
    matchLabels:
      app: hostnames
  replicas: 3
  template:
    metadata:
      labels:
        app: hostnames
    spec:
      containers:
      - name: hostnames
        image: k8s.gcr.io/serve_hostname
        ports:
        - containerPort: 9376
          protocol: TCP

---
apiVersion: v1
kind: Service
metadata:
  name: hostnames
spec:
  selector:
    app: hostnames
  ports:
  - name: default
    protocol: TCP
    port: 80
    targetPort: 9376
```

这里部署的hostnames应用主要功能是当访问它的9376端口时，会返回它自己的主机名，创建相应的deployment和service：

```
# k apply -f service-via-cluster-ip.yaml
deployment.apps/hostnames created
service/hostnames created
# k get deploy hostnames
NAME        READY   UP-TO-DATE   AVAILABLE   AGE
hostnames   3/3     3            3           20s
# k get po
NAME                        READY   STATUS    RESTARTS   AGE
hostnames-85bc9c579-dsmh9   1/1     Running   0          25s
hostnames-85bc9c579-tx87g   1/1     Running   0          25s
hostnames-85bc9c579-zndz2   1/1     Running   0          25s
```

查询service和相应的endpoints，并通过cluster ip访问pod:

```
# k get svc hostnames
NAME        TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
hostnames   ClusterIP   10.0.91.192   <none>        80/TCP    57s
# k get endpoints hostnames
NAME        ENDPOINTS                                              AGE
hostnames   10.1.161.47:9376,10.1.166.146:9376,10.1.166.166:9376   71s
# curl 10.0.91.192
hostnames-85bc9c579-dsmh9
# curl 10.0.91.192
hostnames-85bc9c579-tx87g
# curl 10.0.91.192
hostnames-85bc9c579-dsmh9
# curl 10.0.91.192
hostnames-85bc9c579-zndz2
```

这里的cluster ip是10.0.91.192，所以可以通过该ip访问部署的hostnames应用，可以看到每次返回的主机名不同，这是service默认就提供的轮询（round robin）负载均衡方式，并且查看service的endpoints，可以看到其后端代理的pod的ip，当某个pod出现问题时，kubernetes会将其从service的endpoints中移除，确保应用能正常的被访问，以上就是cluster ip模式的service。

service其实是由kube-proxy和iptables共同实现，查看iptables规则可以看到：

```
# iptables-save | grep hostnames
-A KUBE-SERVICES ! -s 10.1.0.0/16 -d 10.0.91.192/32 -p tcp -m comment --comment "default/hostnames:default cluster IP" -m tcp --dport 80 -j KUBE-MARK-MASQ
-A KUBE-SERVICES -d 10.0.91.192/32 -p tcp -m comment --comment "default/hostnames:default cluster IP" -m tcp --dport 80 -j KUBE-SVC-ODX2UBAZM7RQWOIU
# iptables-save | grep KUBE-SVC-ODX2UBAZM7RQWOIU
:KUBE-SVC-ODX2UBAZM7RQWOIU - [0:0]
-A KUBE-SERVICES -d 10.0.91.192/32 -p tcp -m comment --comment "default/hostnames:default cluster IP" -m tcp --dport 80 -j KUBE-SVC-ODX2UBAZM7RQWOIU
-A KUBE-SVC-ODX2UBAZM7RQWOIU -m statistic --mode random --probability 0.33332999982 -j KUBE-SEP-I2HJPDDJL5BQFM6K
-A KUBE-SVC-ODX2UBAZM7RQWOIU -m statistic --mode random --probability 0.50000000000 -j KUBE-SEP-ZGC4PHJJE7XNKWAH
-A KUBE-SVC-ODX2UBAZM7RQWOIU -j KUBE-SEP-KGA3ZAVJ5MEPXEK5
# iptables-save | grep KUBE-SVC-ODX2UBAZM7RQWOIU
:KUBE-SVC-ODX2UBAZM7RQWOIU - [0:0]
-A KUBE-SERVICES -d 10.0.91.192/32 -p tcp -m comment --comment "default/hostnames:default cluster IP" -m tcp --dport 80 -j KUBE-SVC-ODX2UBAZM7RQWOIU
-A KUBE-SVC-ODX2UBAZM7RQWOIU -m statistic --mode random --probability 0.33332999982 -j KUBE-SEP-I2HJPDDJL5BQFM6K
-A KUBE-SVC-ODX2UBAZM7RQWOIU -m statistic --mode random --probability 0.50000000000 -j KUBE-SEP-ZGC4PHJJE7XNKWAH
-A KUBE-SVC-ODX2UBAZM7RQWOIU -j KUBE-SEP-KGA3ZAVJ5MEPXEK5
# iptables-save | grep KUBE-SEP-I2HJPDDJL5BQFM6K
:KUBE-SEP-I2HJPDDJL5BQFM6K - [0:0]
-A KUBE-SEP-I2HJPDDJL5BQFM6K -s 10.1.161.47/32 -j KUBE-MARK-MASQ
-A KUBE-SEP-I2HJPDDJL5BQFM6K -p tcp -m tcp -j DNAT --to-destination 10.1.161.47:9376
-A KUBE-SVC-ODX2UBAZM7RQWOIU -m statistic --mode random --probability 0.33332999982 -j KUBE-SEP-I2HJPDDJL5BQFM6K
```

