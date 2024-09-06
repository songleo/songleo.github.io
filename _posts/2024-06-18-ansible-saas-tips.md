---
layout: post
title: ansible saas tips
date: 2024-06-16 00:12:05
---

### 创建集群

```
ansible-saas customer create -b new-br
```

### rosa删除集群

```
rosa delete cluster -c cus-wub898 --best-effort
```

### 登录集群

```
ansible-saas cluster login cluster_name
```

### 获取集群

```
ansible-saas customer list
```

### 删除集群

```
ansible-saas customer delete SUBSCRIPTION_ID

or

ansible-saas cluster list --tracer-id TRACER_ID
ansible-saas cluster delete INVENTORY_ID
ansible-saas customer delete -f SUBSCRIPTION_ID
```

### 获取权限

```
aws sts assume-role --role-arn "arn:aws:iam::123456789012:role/example-role" --role-session-name AWSCLI-Session

export AWS_ACCESS_KEY_ID=RoleAccessKeyID
export AWS_SECRET_ACCESS_KEY=RoleSecretKey
export AWS_SESSION_TOKEN=RoleSessionToken
```

### 获取waf logging的policy

```
aws logs describe-resource-policies
aws logs delete-resource-policy --policy-name NAME
```

### waf启用和禁用日志

```
aws wafv2 put-logging-configuration --logging-configuration ResourceArn={{ waf_acl_arn }},LogDestinationConfigs={{ log_group_arn }}
aws wafv2 delete-logging-configuration --resource-arn {{ waf_acl_arn }}
```
