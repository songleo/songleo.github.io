---
layout: post
title: ansible saas tips
date: 2024-06-16 00:12:05
---

### 创建集群

```
ansible-saas customer create -b new-br
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
```
