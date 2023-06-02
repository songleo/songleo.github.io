---
layout: post
title: azure application gateway
date: 2023-06-02 00:12:05
---

azure application gateway是一个专用的应用程序负载均衡器服务。它在应用程序层即第七层提供各种关键功能，帮助用户在创建、配置、管理和监控他们的应用程序流量路由时有着极大的便利。主要有以下的功能：

### 负载均衡

application gateway提供了应用程序级别的负载均衡功能。这意味着你可以根据流量的需求，进行应用程序的横向扩展。借助于自定义路由规则，你可以基于url路径将流量分发到特定的后端服务器。

### web 应用防火墙（waf）

application gateway还内置了一个web应用防火墙，可以防止各种web攻击，例如sql注入、跨站脚本等。可以为应用程序提供一个额外的保护层，从而大大提升其安全性。

### ssl/tls 终止

application gateway提供了ssl/tls终止功能，这样就可以将未加密的流量发送到后端，从而减轻后端服务器的计算负担。

### 自动缩放

application gateway可以根据流量需求进行自动缩放，这对于处理大规模突发流量非常有用，为应用提供高可用。

但是azure application gateway也有一些缺点，比如：

### 配置复杂性

相比于基础的负载均衡器，application gateway的配置和管理要复杂得多。

### 成本问题

application gateway提供的高级功能可能会带来更高的成本。

### 性能问题

在处理高流量的情况下，application gateway可能会对应用程序的性能产生影响。
