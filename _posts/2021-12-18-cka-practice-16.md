---
layout: post
title: cka练习（十六）
date: 2021-12-18 00:12:05
---


## 升级master节点

```shell
$ yum list --showduplicates kubeadm --disableexcludes=kubernetes
$ yum install -y kubeadm-1.23.x-0 --disableexcludes=kubernetes
$ kubeadm version
$ kubeadm upgrade plan
$ k drain master --ignore-daemonsets
$ kubeadm upgrade apply v1.23.1
$ kubeadm upgrade node
$ yum install -y kubelet-1.23.1-0 kubectl-1.23.1-0 --disableexcludes=kubernetes
$ kubectl uncordon master
$ systemctl daemon-reload && systemctl restart kubelet
```

## 升级node节点

```
$ yum install -y kubeadm-1.23.x-0 --disableexcludes=kubernetes
$ k drain node1 --ignore-daemonsets
$ ubeadm upgrade node
$ yum install -y kubelet-1.23.x-0 kubectl-1.23.x-0 --disableexcludes=kubernetes
$ systemctl daemon-reload && systemctl restart kubelet
$ kubectl uncordon node1
```

## ch-3

```
$ k get ns
NAME              STATUS   AGE
default           Active   28h
kube-node-lease   Active   28h
kube-public       Active   28h
kube-system       Active   28h
$ k create ns ns1
namespace/ns1 created
$ k get no
NAME     STATUS   ROLES                  AGE   VERSION
master   Ready    control-plane,master   28h   v1.23.1
node1    Ready    node                   27h   v1.23.1
node2    Ready    node                   26h   v1.23.1
$ k top po -n openshift-monitoring --sort-by=memory
W1218 17:57:22.848581 4110112 top_pod.go:140] Using json format to get metrics. Next release will switch to protocol-buffers, switch early by passing --use-protocol-buffers flag
NAME                                           CPU(cores)   MEMORY(bytes)
prometheus-k8s-0                               100m         1373Mi
prometheus-operator-68bdd94c57-rncgr           2m           179Mi
thanos-querier-84bdcc4564-tcq9s                5m           157Mi
alertmanager-main-0                            0m           146Mi
cluster-monitoring-operator-86945c49f9-wtz5h   2m           130Mi
kube-state-metrics-5d478494d6-8vvb7            0m           123Mi
openshift-state-metrics-7ffdbffc5b-9v9vv       0m           91Mi
telemeter-client-5cd58dfdcd-56pmv              0m           86Mi
grafana-7c49b8fbcc-kxgmj                       2m           84Mi
node-exporter-vd2fz                            12m          62Mi
prometheus-adapter-57b46fb59c-mjwj5            2m           50Mi
$ k top no --sort-by=cpu
W1218 17:57:41.939145 4110291 top_node.go:119] Using json format to get metrics. Next release will switch to protocol-buffers, switch early by passing --use-protocol-buffers flag
NAME                           CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
ip-10-0-128-142.ec2.internal   1344m        8%     19652Mi         65%
$ kubeadm token create --print-join-command
kubeadm join 192.168.0.150:6443 --token nm5gf3.tg0mtx78i9d3sp54 --discovery-token-ca-cert-hash sha256:a848db8b509cbaa0c75d8fd5ab806bc09dd0293e3ed739a6cbad8b78dd863cc4
$ source <(kubectl completion bash) # setup autocomplete in bash into the current shell, bash-completion package should be installed first.
$ echo "source <(kubectl completion bash)" >> ~/.bashrc # add autocomplete permanently to your bash shell.
```

## 参考

- cka/ckad应试指南：从docker到kubernetes完全攻略 ch-4 & ch-3
