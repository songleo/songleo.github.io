---
layout: post
title: 可观察性平台检查表
date: 2023-02-08 00:12:05
---

最近因为工作需要，调研和使用几个可观察性工具和平台，分别如下：

- prometheus + grafana
- splunk
- azure managed grafana
- dynatrace
- datadog

在使用过程中，这些平台各有利弊，于是想着写一个checklist，权当总结学习。

- [ ] 能提供免费的试用账户，方便用户快速搭建poc
- [ ] 提供内置的alert，能快速和现有的服务和应用集成，比如提供一些常见数据库的alert，当收集到metrics后，可以一键启用这些内置的alert，快速搭建一个可用的监控系统
- [ ] 提供一些推荐的alert，方便用户参考定义alert
- [ ] 提供内置的dashboard，能及时展示收集到的数据如metrics、log和events
- [ ] 支持config as code，方便维护配置、alert和dashboard等
- [ ] 提供丰富的api和文档支持，最好在页面端自动生成调用api所需的数据，方便用户做自动化集成
- [ ] 一键部署agent，能快速和先用的服务和应用集成，快速收集监控数据如metrics、log和events
- [ ] 支持数据存储或者可以存储数据到第三方如s3
- [ ] 能提供相应的分析报告
- [ ] 支持屏蔽日志中的敏感数据，如配置相应的rule去替换铭感数据
- [ ] 支持常见的公有云平台如azure、aws和gcp，能一键集成并收集到相应的监控数据
- [ ] 支持集成常见的通知系统如slack、pagerduty和email
- [ ] 提供webhook方便收到alert或event后做二次开发，如收到alert后自动创建issue
- [ ] 支持常见的metric endpoint，如prometheus和opentelemetry collector
- [ ] 根据用户的配置和使用给出相应的建议，例如推荐启用相应功能、安装某些扩展
- [ ] 对于saas类可观察性平台，用户能方便快速知道所有开支

> :) 未完待续......
