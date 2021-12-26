---
layout: post
title: kuben-bench使用
date: 2021-12-26 00:12:05
---

## 安装kuben-bench

```
curl -L https://github.com/aquasecurity/kube-bench/releases/download/v0.6.2/kube-bench_0.6.2_linux_amd64.deb -o kube-bench_0.6.2_linux_amd64.deb
sudo apt install ./kube-bench_0.6.2_linux_amd64.deb -f

wget https://github.com/aquasecurity/kube-bench/releases/download/v0.6.5/kube-bench_0.6.5_linux_amd64.tar.gz
wget https://github.com/aquasecurity/kube-bench/releases/download/v0.3.0/kube-bench_0.3.0_linux_amd64.tar.gz
```

## 使用kube-bench扫描kubernetes

扫描master组件，发现存在以下问题：

```
$ kube-bench --config-dir=./cfg --config=./cfg/config.yaml run --targets=master
...
== Summary master ==
42 checks PASS
11 checks FAIL
11 checks WARN
0 checks INFO

== Summary total ==
42 checks PASS
11 checks FAIL
11 checks WARN
0 checks INFO
```

可以根据提示修改相关配置，解决安全隐患。这里的targets仅支持以下组件：

- master
- node
- controlplane
- etcd
- policies

比如扫描etcd:

```
kube-bench --config-dir=./cfg --config=./cfg/config.yaml run --targets=etcd
```

如果使用老版本的kube-bench，选项和新版本不一样，比如老版本就不支持etcd，如下：

```
kube-bench master --config-dir=./cfg
kube-bench node --config-dir=./cfg
```

## 解决安全隐患

这里以master节点作为例子，手动修改`/etc/kubernetes/manifests/kube-apiserver.yaml`中`--authorization-mode`参数：

```
# cat kube-apiserver.yaml | grep authorization-mode
    #- --authorization-mode=Node,RBAC
    - --authorization-mode=AlwaysAllow
```
将授权模式从`Node,RBAC`修改成`AlwaysAllow`，这是不推荐的，使用kube-bench会扫描出该安全隐患：

```
# kube-bench --config-dir=./cfg --config=./cfg/config.yaml run --targets=master | grep authorization-mode
[FAIL] 1.2.6 Ensure that the --authorization-mode argument is not set to AlwaysAllow (Automated)
[FAIL] 1.2.7 Ensure that the --authorization-mode argument includes Node (Automated)
[FAIL] 1.2.8 Ensure that the --authorization-mode argument includes RBAC (Automated)
on the master node and set the --authorization-mode parameter to values other than AlwaysAllow.
--authorization-mode=RBAC
on the master node and set the --authorization-mode parameter to a value that includes Node.
--authorization-mode=Node,RBAC
on the master node and set the --authorization-mode parameter to a value that includes RBAC,
--authorization-mode=Node,RBAC
```

按照提示将`--authorization-mode`参数修改成`Node,RBAC`即可。
