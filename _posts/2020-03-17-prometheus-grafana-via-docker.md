---
layout: post
title: docker运行grafana和prometheus
date: 2020-03-17 18:23:05
---

### 启动prometheus

使用docker方式启动prometheus：

```
$ docker run -d -p 9090:9090 prom/prometheus
b51319de4457761459730b8967958cba5c02bdcb350270029e80856191e732f4
```

打开浏览器，访问http://localhost:9090/可以看到prometheus的dashboard就证明启动成功。

### 启动grafna

使用docker方式启动grafana：

```
$ docker run -d -p 3000:3000 grafana/grafana
ee3499a3f2e75deffac2c3b6ebde126f1e2369dbf9a9664b55ba222f18cb8852
```

打开浏览器，访问http://localhost:3000/可以看到grafana的dashboard就证明启动成功。


### 配置data source

进入http://localhost:3000/，使用用户名admin，密码admin登录grafana的dashboard，初次登录会提示需要修改密码，按要求设置即可。成功登录后，依次进入configuration -> data sources -> add data source。添加data source时选择prometheus。进入data source的配置界面后，url填入本机ip和相应的端口号，例如我设置的是：

```
http://192.168.1.104:9090/
```

其他设置使用默认值，点击save & test，正常情况会提示一下信息：

```
Data source is working
```

然后在页面顶部的dashboards导入prometheus 2.0 stats，然后打开prometheus 2.0 stats的dashboard就能看到相应的prometheus监控数据界面。
