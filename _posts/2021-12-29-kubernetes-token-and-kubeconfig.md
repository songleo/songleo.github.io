---
layout: post
title: kubernetes静态token认证和kubeconfig认证
date: 2021-12-29 00:12:05
---

## 启用静态token的功能

这里仅创建了一个用户token-user1。

```
# openssl rand -hex 10
d6a1ce8e27e69f093293
# echo d6a1ce8e27e69f093293,token-user1,1 > token-user1.csv
# ls ../pki/token-user1.csv
../pki/token-user1.csv
# cat kube-apiserver.yaml | grep token-user1
    - --token-auth-file=/etc/kubernetes/pki/token-user1.csv
# systemctl restart kubelet
```

## 给用户授权

这里仅给用户list节点的权限。

```
# kubectl create clusterrole token-user1 --verb=list --resource=nodes
clusterrole.rbac.authorization.k8s.io/token-user1 created
# kubectl create clusterrolebinding token-user1 --clusterrole=token-user1 --user=token-user1
clusterrolebinding.rbac.authorization.k8s.io/token-user1 created

# 在其他节点执行以下命令访问集群
root@node1:~# kubectl -s="https://192.168.0.140:6443" --insecure-skip-tls-verify=true --token="d6a1ce8e27e69f093293" get nodes
NAME     STATUS   ROLES                  AGE     VERSION
master   Ready    control-plane,master   4d13h   v1.22.2
node1    Ready    <none>                 4d13h   v1.22.2
node2    Ready    <none>                 4d13h   v1.22.2
root@node1:~# kubectl -s="https://192.168.0.140:6443" --insecure-skip-tls-verify=true --token="d6a1ce8e27e69f093293" get po
Error from server (Forbidden): pods is forbidden: User "token-user1" cannot list resource "pods" in API group "" in the namespace "default"
```

可以看到，用户能正常访问集群，并设置了正确的权限，下面例子创建kubeconfig访问集群。

## 创建csr申请证书

```
# openssl genrsa -out csr-user1.key 2048
# openssl req -new -key csr-user1.key -out csr-user1.csr -subj "/CN=csr-user1/O=ssli"
# cat <<EOF | kubectl apply -f -
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: csr-user1
spec:
  groups:
  - system:authenticated
  signerName: kubernetes.io/kube-apiserver-client
  request: $(cat csr-user1.csr | base64 | tr -d "\n")
  usages:
  - client auth
EOF
```

## approve csr并创建证书

```
# k get certificatesigningrequests.certificates.k8s.io
NAME        AGE   SIGNERNAME                            REQUESTOR          REQUESTEDDURATION   CONDITION
csr-user1   50s   kubernetes.io/kube-apiserver-client   kubernetes-admin   <none>              Pending
# k certificate approve csr-user1
certificatesigningrequest.certificates.k8s.io/csr-user1 approved
# kubectl get csr/csr-user1 -o jsonpath='{.status.certificate}' | base64 -d > csr-user1.crt
```

## 给用户授权

这里仅给用户list节点的权限。

```
# kubectl create clusterrole csr-user1 --verb=list --resource=nodes
# kubectl create clusterrolebinding csr-user1 --clusterrole=csr-user1 --user=csr-user1
```

## 创建kubeconfig

```
# cat << EOF > csr-user1.yaml
apiVersion: v1
kind: Config
preferences: {}
clusters:
  - cluster: null
    name: cluster1
users:
  - name: csr-user1
contexts:
  - context: null
    name: csr-user1
    namespace: default
current-context: csr-user1
EOF

# kubectl config --kubeconfig=csr-user1.yaml set-cluster cluster1 --server=https://192.168.0.140:6443 --certificate-authority=/etc/kubernetes/pki/ca.crt --embed-certs=true
# kubectl config --kubeconfig=csr-user1.yaml set-credentials csr-user1 --client-certificate=csr-user1.crt --client-key=csr-user1.key --embed-certs=true
# kubectl config --kubeconfig=csr-user1.yaml set-context csr-user1 --cluster=cluster1 --namespace=default --user=csr-user1

# k get no --kubeconfig=csr-user1.yaml
NAME     STATUS   ROLES                  AGE     VERSION
master   Ready    control-plane,master   4d13h   v1.22.2
node1    Ready    <none>                 4d13h   v1.22.2
node2    Ready    <none>                 4d13h   v1.22.2
# k get po --kubeconfig=csr-user1.yaml
Error from server (Forbidden): pods is forbidden: User "csr-user1" cannot list resource "pods" in API group "" in the namespace "default"
```

可以看到，使用创建的kubeconfig文件成功访问集群，并设置了正确的权限。
