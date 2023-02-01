---
layout: post
title: operator lifecycle manager tips
date: 2023-02-01 00:12:05
---

operator lifecycle manager (olm)可帮助用户安装、更新和管理所有operator以及在用户集群中运行的关联服务的生命周期。operator lifecycle manager是operator framework的一部分，后者是一个开源工具包，用于以有效、自动化且可扩展的方式管理kubernetes operator。

### olm和catalog管理的crd

- clusterserviceversion (csv)：用于描述operator的元数据，可以理解成一个安装包，olm通过csv获取运行operator需要的一切元数据，比如image、rbac、crd等等，csv版本和operator一致，升级operator时会创建一个新的csv，然后olm会自动升级新的csv，替换老的csv，属于olm

```
$ k get csv cert-manager.v1.10.2
NAME                   DISPLAY        VERSION   REPLACES               PHASE
cert-manager.v1.10.2   cert-manager   1.10.2    cert-manager.v1.10.1   Succeeded
```

- catalogsource (cs)：是用于存放csv中各种元数据如crd等，olm通过cs来查询是否有可用的operator及已安装 operator是否有升级版本，在cs中，operator被组织成安装包和channel，可以通过订阅指定安装包和channel，属于catalog

```
$ k get catalogsources -n olm
NAME                    DISPLAY               TYPE   PUBLISHER        AGE
certified-operators     Certified Operators   grpc   aap-build-team   127m
operatorhubio-catalog   Community Operators   grpc   OperatorHub.io   130m
redhat-operators        Red Hat Operators     grpc   aap-build-team   127m

$ k get Subscription
NAME                PACKAGE             SOURCE                  CHANNEL
keycloak-operator   keycloak-operator   operatorhubio-catalog   alpha
```

- subscription：olm通过subscription订阅cs和channel，并定义更新策略，属于catalog

```
$ k get subscription keycloak-operator -o yaml
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  generation: 2
  labels:
    operators.coreos.com/keycloak-operator.keycloak: ""
  name: keycloak-operator
  namespace: keycloak
  resourceVersion: "8739"
  uid: efa1e036-ba83-496c-bdc4-17832334ecda
spec:
  channel: alpha
  installPlanApproval: Manual
  name: keycloak-operator
  source: operatorhubio-catalog
  sourceNamespace: olm
```

- installplan：为自动安装或升级csv而需创建的资源的计算列表，当subscription发现一个新版本的operator，它会创建一个installplan，用户也可以自动手动创建，属于catalog

```
$ k get ip -A
NAMESPACE   NAME            CSV                                APPROVAL    APPROVED
keycloak    install-lm4z5   keycloak-operator.v19.0.3          Automatic   true
operators   install-gc4sm   aap-operator.v2.3.0-0.1674778407   Automatic   true
operators   install-hgb4n   cert-manager.v1.10.2               Automatic   true
operators   install-x6kgs   aap-operator.v2.3.0-0.1674778407   Automatic   true
```

- operatorgroup：指定operator的工作命名空间，用户控制operator多租户，如果一个cr不在operatorgroup定义的namespace，operator不会做出相应的响应，属于olm

```
$ k get operatorgroup keycloak-operator-group -o yaml
apiVersion: operators.coreos.com/v1
kind: OperatorGroup
metadata:
  generation: 1
  name: keycloak-operator-group
  namespace: keycloak
  resourceVersion: "7413"
  uid: f1f61839-134a-473f-a39b-a5ff62fb9cc6
spec:
  targetNamespaces:
  - ansible-automation-platform
status:
  lastUpdated: "2023-02-01T08:03:52Z"
  namespaces:
  - ansible-automation-platform
```

### 安装operator

查找operator：

```
$ k get packagemanifests | grep keycloak-operator
edp-keycloak-operator                          Community Operators   5h7m
keycloak-operator                              Community Operators   5h7m
```

查看operator的installmode和channel：

```
$ k describe packagemanifests keycloak-operator
```

创建订阅subscription：

```
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: keycloak-operator
  namespace: keycloak
spec:
  channel: alpha
  installPlanApproval: Manual
  name: keycloak-operator
  source: operatorhubio-catalog
  sourceNamespace: olm
```

## ref

- https://access.redhat.com/documentation/zh-cn/openshift_container_platform/4.2/html/operators/understanding-the-operator-lifecycle-manager-olm
- https://marukhno.com/what-are-operators-in-kubernetes-openshift/
- https://medium.com/@imsrv01/how-olm-helps-to-install-and-upgrade-operators-e81704c093fd
