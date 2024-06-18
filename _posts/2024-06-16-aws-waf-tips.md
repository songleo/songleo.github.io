---
layout: post
title: aws waf tips
date: 2024-06-16 00:12:05
---

### 创建acl

```
aws wafv2 create-web-acl \
  --name ${CLUSTER_NAME}-waf \
  --region ${REGION} \
  --default-action Allow={} \
  --scope REGIONAL \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=${CLUSTER_NAME}-waf-metrics \
  --rules file://${SCRATCH}/waf-rules.json \
  --query 'Summary.ARN' \
  --output text
```

### 删除acl

```
aws wafv2 delete-web-acl --name ${CLUSTER_NAME}-waf --scope REGIONAL --lock-token TOKEN --id ID
```

### 获取acl

```
aws wafv2 get-web-acl --name ${CLUSTER_NAME}-waf --scope REGIONAL --id ID
```

### 获取权限

```
aws sts assume-role --role-arn "arn:aws:iam::123456789012:role/example-role" --role-session-name AWSCLI-Session

export AWS_ACCESS_KEY_ID=RoleAccessKeyID
export AWS_SECRET_ACCESS_KEY=RoleSecretKey
export AWS_SESSION_TOKEN=RoleSessionToken
```
