---
layout: post
title: install aap on aks
date: 2023-06-08 00:12:05
---

## create the aks

- aks version: 1.25.5
- network type (plugin): kubenet
- private cluster: enabled
- application gateway ingress controller: enabled

```
az_aks_command() { CMD=$1; CMDOPTS=$2; az aks command invoke --resource-group ${RESOURCE_GROUP} --name ${AKS_NAME} --command "${CMD}" ${CMDOPTS}; }
export RESOURCE_GROUP=ssli-test-rg
export AKS_NAME=ssli-aks

$ az_aks_command "kubectl get no -o wide"
```

## prepare the jump vm to access the aks

Create the vm with the same venet whick is aks using.

Create a VM in the same VNet as the AKS cluster, then we can login this vm and access the aks.

```
# kubectl get no
NAME                                STATUS   ROLES   AGE   VERSION
aks-agentpool-34673761-vmss000000   Ready    agent   14h   v1.25.5
```

## install olm to aks

```
kubectl create -f https://github.com/operator-framework/operator-lifecycle-manager/releases/download/v0.24.0/crds.yaml
kubectl create -f https://github.com/operator-framework/operator-lifecycle-manager/releases/download/v0.24.0/olm.yaml

kubectl get po -n olm && kubectl get po -n operators
```

## install aap operator

```

```

### ref

- https://learn.microsoft.com/en-us/azure/aks/private-clusters#options-for-connecting-to-the-private-cluster
- https://github.com/operator-framework/operator-lifecycle-manager/blob/master/doc/install/install.md
- https://access.redhat.com/documentation/en-us/red_hat_ansible_automation_platform/2.3/html/deploying_the_red_hat_ansible_automation_platform_operator_on_openshift_container_platform/installing-aap-operator-cli
