---
layout: post
title: 检查aap的指标数据
date: 2022-04-21 00:12:05
---

- 获取aap controller管理员密码:

```
$ AAP_NS="ansible-automation-platform"
$ AAP_CTRL_ADMIN_PASSWD=$(kubectl get secret automation-controller-admin-password -n $AAP_NS -ojson | jq -r '.data.password' | base64 -d)
```

- 获取aap指标数据的endpoint:

```
$ AAP_METRIC_ENDPOINT=$(kubectl get ep automation-controller-service -n $AAP_NS --no-headers | awk '{print $2}')
```

- 检查aap指标：

```
$ AAP_CTRL_POD=$(kubectl get po -n $AAP_NS -l app.kubernetes.io/component=automationcontroller --no-headers | awk '{print $1}')
$ kubectl exec "$AAP_CTRL_POD" -n $AAP_NS -- curl -u admin:"$AAP_CTRL_ADMIN_PASSWD" http://"$AAP_METRIC_ENDPOINT"/api/v2/metrics/
```
