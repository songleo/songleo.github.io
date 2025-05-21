---
layout: post
title: 使用fluent-bit将k8s日志转发到splunk
date: 2025-05-21 00:12:05
---

## 安装fluent-bit

```
helm repo add fluent https://fluent.github.io/helm-charts
helm install my-fluent-bit fluent/fluent-bit --version 0.49.0
```

## 配置values

```
config:
  inputs: |
    [INPUT]
        Name tail
        Path /var/log/containers/*.log
        multiline.parser docker, cri
        Tag kube.*
        Mem_Buf_Limit 5MB
        Skip_Long_Lines On

  filters: |
    [FILTER]
        Name kubernetes
        Match kube.*
        Merge_Log On
        Keep_Log Off
        K8S-Logging.Parser On
        K8S-Logging.Exclude On

    [FILTER]
        Name grep
        Match kube.*
        Regex kubernetes['namespace_name'] ^(kube-system|operators|ansible-automation-platform)$

  outputs: |
    [OUTPUT]
        name splunk
        match kube.*
        host {{ splunk_host }}
        port 443
        splunk_token {{ splunk_token }}
        TLS On
        TLS.Debug Off
        TLS.Verify On
        event_key $log
        event_source $log_path
        event_index ssli_test
        event_host ssli_test
```
