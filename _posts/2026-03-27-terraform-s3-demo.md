---
layout: post
title: terraform s3 demo
date: 2026-03-27 00:12:05
---


## demo代码

terraform 代码如下：

```
provider "aws" {
  region  = "us-east-2"
  profile = "saml"
}

resource "aws_s3_bucket" "sslitest" {
  bucket = "sslitest"
}
```

提前配置好aws cli的认证。


## 运行步骤

```
$ terraform init
Initializing the backend...
Initializing provider plugins...
...

$ terraform plan

Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create
...

$ terraform apply

$ terraform destroy
```

## 验证

```
$ aws s3 ls / --profile saml
2026-03-27 00:12:17 sslitest
```

## faq

### mac用户切记安装对应cpu的terraform cli

```
$ uname -m
arm64
$ terraform -v
Terraform v1.14.8
on darwin_arm64
```
