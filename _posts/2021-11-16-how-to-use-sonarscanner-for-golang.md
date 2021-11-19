---
layout: post
title: sonarscanner扫描go项目
date: 2021-11-16 12:12:05
---

## 在本地启动server

```
docker run -d --name sonarqube -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true -p 9000:9000 sonarqube:latest
```

## 登录到ui

打开浏览器，进入 http://localhost:9000 ， 默认用户名和密码是：admin:admin ，初次登录需要修改用户名和密码。

## 下载sonarscanner

进入 https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/ 下载相应的sonarscanner，解压后将bin目录添加到系统PATH。

## 创建go项目并扫描code

在sonarqube的ui中创建新的project，并选择locally，然后生成相应的token，选择golang和相应的os，然后就可以得到扫描命令，进入go项目的根目录，执行扫描命令即可：

```
cd /your/golang/dir
sonar-scanner \
  -Dsonar.projectKey=key \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=$TOKEN
```

运行该命令后，ui会自动打开扫描结果，分析扫描结果即可。

### ref

- https://docs.sonarqube.org/latest/setup/get-started-2-minutes/
- https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/
