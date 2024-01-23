---
layout: post
title: github repo添加lint工具
date: 2024-01-23 00:12:05
---

lint工具在软件开发中发挥着重要作用。它们能自动检查源代码中的错误、可疑的构造、风格问题以及可能的bug。这对于保持代码质量、提高代码可读性和维护性至关重要。特别是在团队协作的项目中，lint工具可以帮助维持一致的编码标准，减少代码审查中的常规错误检查工作。本文将介绍如何通过github action添加lint工具自动扫描代码。

### 创建工作流文件

在github仓库中的.github/workflows/目录下创建一个新的yaml文件，例如yaml-lint.yml。

### 定义触发事件

在工作流文件中指定触发lint工具的事件，例如push和pull_request。

### 设置工作流任务

定义执行lint工具的任务，包括设置运行环境、安装所需依赖和执行lint命令。

### 自定义规则（可选）

根据需要自定义lint规则，以符合项目的特定编码标准。

### 提交并测试工作流

提交工作流文件到仓库，并通过推送或创建拉取请求来测试工作流是否正常运行。

### 例子

```
name: yaml lint

on:  # yamllint disable-line rule:truthy
  push:
    branches:
      - main
      - 'release-*'
  pull_request:
    branches:
      - 'release-*'

jobs:
  yaml-lint:
    runs-on: ubuntu-latest

    steps:
    - name: checkout repository
      uses: actions/checkout@v2

    - name: lint yaml files
      uses: ibiqlik/action-yamllint@v3
      with:
        config_file: '.yamllint.yml'
```

主要功能是自动检查yaml文件的格式和语法。它在代码被推送到主分支或特定的release-前缀分支，以及向这些分支提交的拉取请求时触发。工作流运行在最新版的 ubuntu 系统上，首先签出代码仓库，然后使用特定的lint工具（ibiqlik/action-yamllint@v3）按照定义的规则（在.yamllint.yml文件中）检查yaml文件。

具体action配置参考：

- https://github.com/songleo/private-cloud/blob/main/.github/workflows/shell-lint.yml
- https://github.com/songleo/private-cloud/blob/main/.github/workflows/yaml-lint.yml

### 参考

- https://github.com/songleo/private-cloud
