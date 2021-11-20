---
layout: post
title: cka练习（二）
date: 2021-11-20 12:12:05
---

## 1 clusterrole/serviceaccount/rolebinding的创建

```shell
$ k create clusterrole deployment-clusterrole --verb=create --resource=deployment,statefulset,daemonset
clusterrole.rbac.authorization.k8s.io/deployment-clusterrole created
$ k get clusterrole deployment-clusterrole -o yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  creationTimestamp: "2021-11-20T12:59:33Z"
  name: deployment-clusterrole
  resourceVersion: "5507372"
  uid: 7d692d99-956c-467a-9414-4097e81226fc
rules:
- apiGroups:
  - apps
  resources:
  - deployments
  - statefulsets
  - daemonsets
  verbs:
  - create
$ k create ns app-team1
namespace/app-team1 created
$ k get ns app-team1 -o yaml
apiVersion: v1
kind: Namespace
metadata:
  annotations:
    openshift.io/sa.scc.mcs: s0:c27,c4
    openshift.io/sa.scc.supplemental-groups: 1000710000/10000
    openshift.io/sa.scc.uid-range: 1000710000/10000
  creationTimestamp: "2021-11-20T13:01:12Z"
  labels:
    kubernetes.io/metadata.name: app-team1
  name: app-team1
  resourceVersion: "5509996"
  uid: 34fe6b0a-77c0-4ac3-a24d-76c412aedd94
spec:
  finalizers:
  - kubernetes
status:
  phase: Active
$ k -n app-team1 create serviceaccount cicd-token
serviceaccount/cicd-token created
$ k get sa -n app-team1 cicd-token -o yaml
apiVersion: v1
imagePullSecrets:
- name: cicd-token-dockercfg-h8qj9
kind: ServiceAccount
metadata:
  creationTimestamp: "2021-11-20T13:02:32Z"
  name: cicd-token
  namespace: app-team1
  resourceVersion: "5512089"
  uid: fb197c56-6a47-4117-b43f-4ca0519720ec
secrets:
- name: cicd-token-dockercfg-h8qj9
- name: cicd-token-token-wjxd7
$ k create rolebinding deploymentclusterrolebinding --clusterrole=deployment-clusterrole --serviceaccount=app-team1:cicd-token -n app-team1
rolebinding.rbac.authorization.k8s.io/deploymentclusterrolebinding created
$ k get rolebinding deploymentclusterrolebinding -o yaml -n app-team1
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  creationTimestamp: "2021-11-20T13:06:31Z"
  name: deploymentclusterrolebinding
  namespace: app-team1
  resourceVersion: "5518468"
  uid: cafa1957-8615-4819-bac4-a77f65c83b2b
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: deployment-clusterrole
subjects:
- kind: ServiceAccount
  name: cicd-token
  namespace: app-team1
```

## 2 维护节点

```shell

$ k get no
NAME                                       STATUS   ROLES    AGE   VERSION
gke-ssli-demo-default-pool-0cba9a7c-rbff   Ready    <none>   32m   v1.21.5-gke.1302
gke-ssli-demo-default-pool-0cba9a7c-skr2   Ready    <none>   32m   v1.21.5-gke.1302
gke-ssli-demo-default-pool-0cba9a7c-z04c   Ready    <none>   32m   v1.21.5-gke.1302
$ k cordon gke-ssli-demo-default-pool-0cba9a7c-rbff
node/gke-ssli-demo-default-pool-0cba9a7c-rbff cordoned
$ k get no
NAME                                       STATUS                     ROLES    AGE   VERSION
gke-ssli-demo-default-pool-0cba9a7c-rbff   Ready,SchedulingDisabled   <none>   32m   v1.21.5-gke.1302
gke-ssli-demo-default-pool-0cba9a7c-skr2   Ready                      <none>   33m   v1.21.5-gke.1302
gke-ssli-demo-default-pool-0cba9a7c-z04c   Ready                      <none>   33m   v1.21.5-gke.1302
$ k drain gke-ssli-demo-default-pool-0cba9a7c-rbff --ignore-daemonsets --delete-local-data --force
Flag --delete-local-data has been deprecated, This option is deprecated and will be deleted. Use --delete-emptydir-data.
node/gke-ssli-demo-default-pool-0cba9a7c-rbff already cordoned
WARNING: ignoring DaemonSet-managed Pods: kube-system/fluentbit-gke-nr2qm, kube-system/gke-metrics-agent-fkz97, kube-system/pdcsi-node-n785g
evicting pod kube-system/kube-dns-697dc8fc8b-n5vh8
evicting pod kube-system/konnectivity-agent-7cbdb6d67d-jdjmp
pod/konnectivity-agent-7cbdb6d67d-jdjmp evicted
pod/kube-dns-697dc8fc8b-n5vh8 evicted
node/gke-ssli-demo-default-pool-0cba9a7c-rbff evicted
```

## 3 升级集群

```shell
$ kubeadm upgrade plan
$ k drain master --ignore-daemonsets
$ kubeadm upgrade apply v1.21.1 --etcd-upgrade=false
$ k uncordon master
```
