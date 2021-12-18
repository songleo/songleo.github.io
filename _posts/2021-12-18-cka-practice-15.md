---
layout: post
title: cka练习（十五）
date: 2021-12-18 00:12:05
---

```shell
$ k get po -n kube-system
NAME                             READY   STATUS    RESTARTS   AGE
coredns-6d8c4cb4d-7jcd6          1/1     Running   0          22h
coredns-6d8c4cb4d-gfxtd          1/1     Running   0          22h
etcd-master                      1/1     Running   0          22h
kube-apiserver-master            1/1     Running   0          22h
kube-controller-manager-master   1/1     Running   0          22h
kube-flannel-ds-99vdv            1/1     Running   0          21h
kube-flannel-ds-rzhkg            1/1     Running   0          21h
kube-flannel-ds-xmpsj            1/1     Running   0          21h
kube-proxy-k8spt                 1/1     Running   0          22h
kube-proxy-kdbvh                 1/1     Running   0          21h
kube-proxy-wfngx                 1/1     Running   0          21h
kube-scheduler-master            1/1     Running   0          22h
$ k get po -n kube-system -l k8s-app=kube-dns
NAME                      READY   STATUS    RESTARTS   AGE
coredns-6d8c4cb4d-7jcd6   1/1     Running   0          22h
coredns-6d8c4cb4d-gfxtd   1/1     Running   0          22h
$ k get po --all-namespaces
NAMESPACE     NAME                             READY   STATUS    RESTARTS   AGE
kube-system   coredns-6d8c4cb4d-7jcd6          1/1     Running   0          22h
kube-system   coredns-6d8c4cb4d-gfxtd          1/1     Running   0          22h
kube-system   etcd-master                      1/1     Running   0          22h
kube-system   kube-apiserver-master            1/1     Running   0          22h
kube-system   kube-controller-manager-master   1/1     Running   0          22h
kube-system   kube-flannel-ds-99vdv            1/1     Running   0          21h
kube-system   kube-flannel-ds-rzhkg            1/1     Running   0          21h
kube-system   kube-flannel-ds-xmpsj            1/1     Running   0          21h
kube-system   kube-proxy-k8spt                 1/1     Running   0          22h
kube-system   kube-proxy-kdbvh                 1/1     Running   0          21h
kube-system   kube-proxy-wfngx                 1/1     Running   0          21h
kube-system   kube-scheduler-master            1/1     Running   0          22h
$ k top no --sort-by=cpu
NAME                           CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
node2   961m         6%     19551Mi         65%
$ k label no node2 disktype=ssd
node/node2 labeled
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: pod1
  labels:
    app-name: pod1
spec:
  containers:
  - name: mycontainer
    image: quay.io/songleo/nginx
    imagePullPolicy: IfNotPresent
---
apiVersion: v1
kind: Pod
metadata:
  name: pod2
  labels:
    app-name: pod2
spec:
  containers:
  - name: c2
    image: quay.io/songleo/busybox
    imagePullPolicy: IfNotPresent
    command: ["/bin/sh", "-c", "echo hello pod && sleep 10000"]
  - name: c1
    image: quay.io/songleo/nginx
    imagePullPolicy: IfNotPresent
  nodeSelector:
    disktype: ssd
EOF
$ k get po
NAME   READY   STATUS    RESTARTS   AGE
pod1   1/1     Running   0          21s
pod2   2/2     Running   0          21s
$ k get po -l app-name=pod1
NAME   READY   STATUS    RESTARTS   AGE
pod1   1/1     Running   0          51s
$ k logs pod2 -c c2
hello pod
$ cat /usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf
# Note: This dropin only works with kubeadm and kubelet v1.11+
[Service]
Environment="KUBELET_KUBECONFIG_ARGS=--bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf --kubeconfig=/etc/kubernetes/kubelet.conf --pod-manifest-path=/etc/kubernetes/manifests"
Environment="KUBELET_CONFIG_ARGS=--config=/var/lib/kubelet/config.yaml"
# This is a file that "kubeadm init" and "kubeadm join" generates at runtime, populating the KUBELET_KUBEADM_ARGS variable dynamically
EnvironmentFile=-/var/lib/kubelet/kubeadm-flags.env
# This is a file that the user can use for overrides of the kubelet args as a last resort. Preferably, the user should use
# the .NodeRegistration.KubeletExtraArgs object in the configuration files instead. KUBELET_EXTRA_ARGS should be sourced from this file.
EnvironmentFile=-/etc/sysconfig/kubelet
ExecStart=
ExecStart=/usr/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS
$ cd /etc/kubernetes/manifests
$ ls
tmp.yaml
$ systemctl status kubelet
$ cat /var/lib/kubelet/config.yaml | grep static
staticPodPath: /etc/kubernetes/manifests
$ cat tmp.yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod3
  namespace: ns1
  labels:
    app-name: pod3
spec:
  containers:
  - name: mycontainer
    image: quay.io/songleo/nginx
    imagePullPolicy: IfNotPresent
$ systemctl daemon-reload
$ systemctl restart kubelet
$ k get po -n ns1
NAME         READY   STATUS    RESTARTS   AGE
pod3-node2   1/1     Running   0          2m15s
$ k logs pod2 -c c2
hello pod
$ k cp /etc/hosts pod2:/opt -c c1
$ k exec pod2 -c c1 -- ls /opt
hosts
$ k exec pod2 -c c1 -- cat /opt/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6

192.168.0.150 master.ssli.com master
192.168.0.151 node1.ssli.com node1
192.168.0.152 node2.ssli.com node2
$ kgy no | grep -i taint -C 10
```

## 参考

- cka/ckad应试指南：从docker到kubernetes完全攻略 ch-5
