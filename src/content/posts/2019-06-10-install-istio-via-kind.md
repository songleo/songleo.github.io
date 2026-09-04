---
title: "通过kind部署istio"
description: "需要提前部署好kind和helm。"
pubDatetime: 2019-06-10T00:12:05+08:00
tags: ["kubernetes", "部署"]
---
需要提前部署好kind和helm。

## kind的安装

```
$ apt install golang-go
$ apt install docker.io
$ curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
$ chmod +x kubectl
$ mv kubectl /usr/local/bin/
$ echo "source <(kubectl completion bash)" >> ~/.bashrc
$ wget -O /usr/local/bin/kind https://github.com/kubernetes-sigs/kind/releases/download/v0.3.0/kind-linux-amd64 && chmod +x /usr/local/bin/kind
```

使用kind创建kubernetes集群：

```
$ kind create cluster
Creating cluster "kind" ...
 ✓ Ensuring node image (kindest/node:v1.14.2) 🖼
 ✓ Preparing nodes 📦
 ✓ Creating kubeadm config 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Cluster creation complete. You can now use the cluster with:

export KUBECONFIG="$(kind get kubeconfig-path --name="kind")"
kubectl cluster-info

$ export KUBECONFIG="$(kind get kubeconfig-path --name="kind")"
$ kubectl cluster-info
Kubernetes master is running at https://localhost:56734
KubeDNS is running at https://localhost:56734/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```

验证集群：

```
$ k run --image=nginx nginx-app --port=80
deployment.apps "nginx-app" created
$ k get po
NAME                         READY     STATUS    RESTARTS   AGE
nginx-app-5dd4f9fd4d-55hp8   1/1       Running   0          34s
```

## helm的安装

参考：http://reborncodinglife.com/2019/05/16/helm-learning-1/


## istio安装

```
$ curl -L https://git.io/getLatestIstio | ISTIO_VERSION=1.1.7 sh -
$ cd istio-1.1.7
$ export PATH=$PWD/bin:$PATH
$ kubectl apply -f install/kubernetes/helm/helm-service-account.yaml # 创建 Service account
$ helm init --service-account tiller # 使用 Service account 在集群上安装 Tiller
$ helm install install/kubernetes/helm/istio-init --name istio-init --namespace istio-system # 安装 istio-init chart，来启动 Istio CRD 的安装过程
$ kubectl get crds | grep 'istio.io\|certmanager.k8s.io' | wc -l # 确保全部 53 个 Istio CRD 被提交到 Kubernetes api-server
$ helm install install/kubernetes/helm/istio --name istio --namespace istio-system # 使用默认配置安装istio
```

验证istio安装：

```
$ kubectl get svc -n istio-system
$ kubectl get pods -n istio-system
```

istio卸载：

```
$ helm delete --purge istio
$ helm delete --purge istio-init
$ kubectl delete -f install/kubernetes/helm/istio-init/files # 删除所有的crd
```

bookinfo应用部署：

```
$ kubectl label namespace default istio-injection=enabled # 启用自动 Sidecar 注入
$ kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml # 部署应用
```

确认服务和Pod正常运行：

```
$ kubectl get services
$ kubectl get pods
```

> 如果是mac，请把docker的内存限制设置到8g，否则会因为内存不足导致pod启动失败

验证bookinfo是否正常工作：

```
$ kubectl exec -it $(kubectl get pod -l app=ratings -o jsonpath='{.items[0].metadata.name}') -c ratings -- curl productpage:9080/productpage | grep -o "<title>.*</title>"
```
