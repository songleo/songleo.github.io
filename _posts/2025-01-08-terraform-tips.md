---
layout: post
title: terraform tips
date: 2025-01-08 00:12:05
---

### terraform plan

这个命令会生成并显示一个执行计划，帮助你预览terraform将对你的基础设施做出的变更，而不会真正执行这些变更。它的主要作用是安全地审查更改内容，确保变更符合预期

### terraform apply

这个命令会真正执行terraform的变更，将你的基础设施状态调整为与代码定义的状态一致。它会创建、更新或销毁资源，使实际环境符合配置文件的描述。

### variables.tf

可以清晰地定义变量的类型、描述和默认值。

```
variable "cluster_name" {
  description = "The name of the Kubernetes cluster"
  type        = string
  default     = "default-cluster"
}
```

### providers.tf

用于配置和定义所需的提供者。

```
terraform {
  required_providers {

    dynatrace = {
      source  = "dynatrace-oss/dynatrace"
      version = ">= 1.57.3"
    }
  }
}
```
