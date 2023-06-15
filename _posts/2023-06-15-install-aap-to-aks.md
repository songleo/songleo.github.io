---
layout: post
title: install aap on aks
date: 2023-06-15 00:12:05
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
## install catalog source

```
kubectl create secret docker-registry redhat-operators-pull-secret --namespace=olm --from-file=.dockerconfigjson

kubectl create secret docker-registry certified-operators-pull-secret --namespace=olm --from-file=.dockerconfigjson

kubectl apply -f catalog_source.yaml

$ k get catalogsource
NAME                    DISPLAY               TYPE   PUBLISHER        AGE
certified-operators     Certified Operators   grpc   aap-build-team   46s
operatorhubio-catalog   Community Operators   grpc   OperatorHub.io   15h
redhat-operators        Red Hat Operators     grpc   aap-build-team   46s

$ k get po
NAME                                READY   STATUS    RESTARTS   AGE
catalog-operator-655fb46cd4-28sgx   1/1     Running   0          15h
certified-operators-lwck4           1/1     Running   0          3m28s
olm-operator-67fdb4b99d-4dvq8       1/1     Running   0          15h
operatorhubio-catalog-zjjjn         1/1     Running   0          9h
packageserver-5fd97cb877-96s77      1/1     Running   0          15h
packageserver-5fd97cb877-9dfhk      1/1     Running   0          15h
redhat-operators-bf8p4              1/1     Running   0          3m28s
```


## install operator

- aap

```
---
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: ansible-automation-platform-operator
  namespace: operators
spec:
  channel:
  installPlanApproval: Automatic
  name: ansible-automation-platform-operator
  source: redhat-operators
  sourceNamespace: olm
```
- keycloak

```
---
apiVersion: v1
kind: Namespace
metadata:
  name: keycloak
---
apiVersion: operators.coreos.com/v1
kind: OperatorGroup
metadata:
  name: keycloak-operator-group
  namespace: keycloak
spec:
  targetNamespaces:
    - ansible-automation-platform
---
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: keycloak-operator
  namespace: keycloak
spec:
  channel: alpha
  name: keycloak-operator
  installPlanApproval: Automatic
  source: operatorhubio-catalog
  sourceNamespace: olm
```

- cert-manager

```
---
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: cert-manager
  namespace: operators
spec:
  channel: stable
  installPlanApproval: Automatic
  name: cert-manager
  source: operatorhubio-catalog
  sourceNamespace: olm
```

- aca

```
---
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: ansible-cloud-addons-operator
  namespace: operators
spec:
  channel:
  installPlanApproval: Automatic
  name: ansible-cloud-addons-operator
  source: redhat-operators
  sourceNamespace: olm
```

check all installed operator:

```
root@~$ k get po -n keycloak
NAME                                READY   STATUS    RESTARTS   AGE
keycloak-operator-548dd798f-lhpcm   1/1     Running   0          3m40s
root@~$ k get po -n operators
NAME                                                              READY   STATUS    RESTARTS   AGE
aap-billing-operator-controller-manager-75649cc456-t85lc          2/2     Running   0          2m23s
aap-ui-operator-controller-manager-9bfd86686-jpx9v                2/2     Running   0          2m23s
automation-controller-operator-controller-manager-7d75886b7f4gl   2/2     Running   0          3m4s
automation-hub-operator-controller-manager-568557674d-knpkm       2/2     Running   0          3m4s
cert-manager-65bdd959b4-fhbv7                                     1/1     Running   0          4m7s
cert-manager-cainjector-65b88668bc-rc9l4                          1/1     Running   0          4m7s
cert-manager-webhook-b84d54d8c-kbvh5                              1/1     Running   0          4m7s
resource-operator-controller-manager-67c8958c8d-k2zd7             2/2     Running   0          3m4s
```


### ref

- https://learn.microsoft.com/en-us/azure/aks/private-clusters#options-for-connecting-to-the-private-cluster
- https://github.com/operator-framework/operator-lifecycle-manager/blob/master/doc/install/install.md
- https://access.redhat.com/documentation/en-us/red_hat_ansible_automation_platform/2.3/html/deploying_the_red_hat_ansible_automation_platform_operator_on_openshift_container_platform/installing-aap-operator-cli
