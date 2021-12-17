---
layout: post
title: centos7安装kubernetes
date: 2021-12-17 00:12:05
---


### 所有节点执行以下操作

- 修改节点名字和/etc/hosts文件：

```
$ hostname
master
$ cat /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6

192.168.0.150 master.ssli.com master
192.168.0.151 node1.ssli.com node1
192.168.0.152 node2.ssli.com node2
```

- 关闭防火墙、selinux和swap

```
$ systemctl stop firewalld && systemctl disable firewalld && setenforce 0
$ cat /etc/selinux/config | grep -v \#
SELINUX=disabled
SELINUXTYPE=targeted
$ cat /etc/fstab | grep swap
# /dev/mapper/centos-swap swap                    swap    defaults        0 0
$ swapoff -a
```

- 使用阿里云的镜像源安装docker

```
$ yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
$ yum install docker-ce docker-ce-cli containerd.io -y
$ cat /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com"
  ]
}
$ systemctl enable docker && systemctl start docker
```

- 修改内核参数

```
$ cat <<EOF > /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
$ sysctl --system
```

- 使用阿里云的yum源安装kubelet、kubeadm和kubectl

```
$ cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
$ yum install -y kubelet kubeadm kubectl
$ systemctl enable kubelet
```

### master节点执行以下操作

- 使用阿里云源安装kubernetes：

```
$ kubeadm init --image-repository registry.aliyuncs.com/google_containers --kubernetes-version v1.23.1 --apiserver-advertise-address 192.168.0.150 --pod-network-cidr=10.244.0.0/16 --token-ttl 0
$ mkdir -p $HOME/.kube
$ cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
$ chown $(id -u):$(id -g) $HOME/.kube/config
```
- 安装网络插件

```
$ k apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
```

### node节点执行以下操作

将节点加入集群，若忘记了该命令，在master节点执行`kubeadm token create --print-join-command`获取。

```
$ kubeadm join 192.168.0.150:6443 --token cdqcsf.4ukbz8iyia89i1rw --discovery-token-ca-cert-hash sha256:a848db8b509cbaa0c75d8fd5ab806bc09dd0293e3ed739a6cbad8b78dd863cc4
```

### 集群搭建成功

```
$ k get no
NAME     STATUS   ROLES                  AGE   VERSION
master   Ready    control-plane,master   92m   v1.23.1
node1    Ready    node                   50m   v1.23.1
node2    Ready    node                   14m   v1.23.1
$k get ns
NAME              STATUS   AGE
default           Active   92m
kube-node-lease   Active   92m
kube-public       Active   92m
kube-system       Active   92m
$ k get po --all-namespaces
NAMESPACE     NAME                             READY   STATUS    RESTARTS   AGE
kube-system   coredns-6d8c4cb4d-7jcd6          1/1     Running   0          92m
kube-system   coredns-6d8c4cb4d-gfxtd          1/1     Running   0          92m
kube-system   etcd-master                      1/1     Running   0          92m
kube-system   kube-apiserver-master            1/1     Running   0          92m
kube-system   kube-controller-manager-master   1/1     Running   0          92m
kube-system   kube-flannel-ds-99vdv            1/1     Running   0          3m55s
kube-system   kube-flannel-ds-rzhkg            1/1     Running   0          3m55s
kube-system   kube-flannel-ds-xmpsj            1/1     Running   0          3m54s
kube-system   kube-proxy-k8spt                 1/1     Running   0          92m
kube-system   kube-proxy-kdbvh                 1/1     Running   0          14m
kube-system   kube-proxy-wfngx                 1/1     Running   0          50m
kube-system   kube-scheduler-master            1/1     Running   0          92m
$ k cluster-info
Kubernetes control plane is running at https://192.168.0.150:6443
CoreDNS is running at https://192.168.0.150:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```

### 问题汇总

- 如果第一次执行kubeadm init或者kubeadm join失败，再次init或者join时，请先把已经存在的文件删除，否则无法再次init或者join
- kubelet可能启动失败，所以需要配置/etc/docker/daemon.json
- 镜像使用的image可以由于网络原因无法下载，请使用阿里云镜像源或者自行下载导入

### 参考资料

- https://phoenixnap.com/kb/how-to-install-kubernetes-on-centos
- https://blog.51cto.com/u_15127627/4037011
- https://segmentfault.com/a/1190000037682150
