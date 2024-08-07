---
layout: post
title: 常用命令tips
date: 2023-12-27 00:12:05
---

- curl命令只需返回状态码

```
curl -o /dev/null -s -w "%{http_code}\n" www.baidu.com
```

- git修改上次提交信息

```
git commit --amend -m "new msg"
```

- pip安装时指定国内源

```
pip install -r requirements.txt --index-url https://pypi.tuna.tsinghua.edu.cn/simple

pip install -r requirements.txt --force-reinstall --index-url http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com
```

- 验证集群网络

```
kubectl run curl-test --image=curlimages/curl:latest -- sleep 3600
kubectl exec -it curl-test -- /bin/sh
curl -I https://www.google.com

kubectl run -i --tty --rm debug --image=busybox --restart=Never -- sh
nslookup google.com
```

- 查找当前目录下特别文件名

```
find . -type f -name "*ingress*"
```

- docker image国内镜像

```
docker pull ghcr.m.daocloud.io/fluxcd/source-controller:v1.2.4
```

- 登录aks节点

```
kubectl debug node/aks-nodepool1-37663765-vmss000000 -it --image=mcr.microsoft.com/cbl-mariner/busybox:2.0

chroot /host
```

- nc链接db

```
nc -vz psql.database.azure.com 5432
```

- psql链接数据库

```
psql -h xxx.rds.amazonaws.com -U username awx
```

- 查看数据库的当前活动连接数

```
select count(*) from pg_stat_activity where datname ='subsection'
```
