---
layout: post
title: 降级olm管理的operator版本
date: 2023-04-17 00:12:05
---

工作中遇到一个需求，需要讲已经安装的operator版本从2.3降级到2.2，然后运行升级脚本测试，验证脚本可以将operator从2.2升级到2.3。所以花了点时间研究如何降级olm管理的operator。

### 查看operator的csv版本

```
$ k get packagemanifest ansible-automation-platform-operator -n olm -o jsonpath='{.status.channels[?(@.name=="stable-2.2-cluster-scoped")].currentCSV}'
aap-operator.v2.2.2-0.1677634835

$ k get packagemanifest ansible-cloud-addons-operator -n olm -o jsonpath='{.status.channels[?(@.name=="stable-2.2-cluster-scoped")].currentCSV}'
aca-operator.v2.2.1-0.1669768483
```

### 修改subscription中的channel和csv

将channel修改成要降级的版本，并指定上一步获取的csv版本：

```
spec:
  channel: stable-2.2-cluster-scoped
  installPlanApproval: Manual
  name: ansible-automation-platform-operator
  source: redhat-operators
  sourceNamespace: olm
  startingCSV: aap-operator.v2.2.2-0.1677634835


spec:
  channel: stable-2.2-cluster-scoped
  installPlanApproval: Manual
  name: ansible-cloud-addons-operator
  source: redhat-operators
  sourceNamespace: olm
  startingCSV: aca-operator.v2.2.1-0.1669768483
```

### 删除高版本的csv和installplan

```
$ k delete csv aap-operator.v2.3.0-0.1680015684 aca-operator.v2.3.0-0.1680014818

$ k delete ip install-jg9dh install-9vkts
```

### 修改installplan

将approved修改成true，这里需要修改generation值最大的installplan，也就是最新的installplan。

```
spec:
  approval: Manual
  approved: true
  clusterServiceVersionNames:
  - aap-operator.v2.2.2-0.1677634835
  - aca-operator.v2.2.1-0.1669768483
```

### 查看csv验证降级成功

```
$ k get csv
NAME                               DISPLAY                       VERSION              REPLACES               PHASE
aap-operator.v2.2.2-0.1677634835   Ansible Automation Platform   2.2.2+0.1677634835                          Succeeded
aca-operator.v2.2.1-0.1669768483   Ansible Cloud Addons          2.2.1+0.1669768483                          Succeeded
cert-manager.v1.11.0               cert-manager                  1.11.0               cert-manager.v1.10.2   Succeeded
```

可以看到csv正在安装，成功后状态会显示succeeded

### 升级operator

将之前对subscription的修改revert回去，然后修改最新的installplan，operator就会升级到高版本。
