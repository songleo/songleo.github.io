---
layout: post
title: 在rhels7安装mongodb
date: 2020-03-13 12:12:05
---


### 添加yum源

```
$ cat <<EOF >/etc/yum.repos.d/mongodb.repo
[MongoDB]
name=MongoDB Repository
baseurl=http://repo.mongodb.org/yum/redhat/7/mongodb-org/4.2/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-4.2.asc
EOF
```

### 安装mongodb

```
$ yum install mongodb-org -y
```

这里会分别安装以下包：

- mongodb-org-4.2.3-1.el7.x86_64.rpm
- mongodb-org-mongos-4.2.3-1.el7.x86_64.rpm
- mongodb-org-server-4.2.3-1.el7.x86_64.rpm
- mongodb-org-shell-4.2.3-1.el7.x86_64.rpm
- mongodb-org-tools-4.2.3-1.el7.x86_64.rpm

也可以直接下载这些[rpm包](http://repo.mongodb.org/yum/redhat/7/mongodb-org/4.2/x86_64/RPMS/)安装mongodb，例如：

```
$ rpm -i mongodb-org-4.2.3-1.el7.x86_64.rpm \
>     mongodb-org-mongos-4.2.3-1.el7.x86_64.rpm \
>     mongodb-org-server-4.2.3-1.el7.x86_64.rpm \
>     mongodb-org-shell-4.2.3-1.el7.x86_64.rpm \
>     mongodb-org-tools-4.2.3-1.el7.x86_64.rpm
Created symlink from /etc/systemd/system/multi-user.target.wants/mongod.service to /usr/lib/systemd/system/mongod.service.
```


### 启动并测试mongodb

```
$ systemctl start mongod.service
$ systemctl enable mongod.service
$ mongod --version
db version v4.2.3
git version: 6874650b362138df74be53d366bbefc321ea32d4
OpenSSL version: OpenSSL 1.0.1e-fips 11 Feb 2013
allocator: tcmalloc
modules: none
build environment:
    distmod: rhel70
    distarch: x86_64
    target_arch: x86_64
$ mongo

...

> use db0
switched to db db0
> db.test.save( { key: 1 } )
WriteResult({ "nInserted" : 1 })
> db.test.find()
{ "_id" : ObjectId("5e6b2c936e19b9936486e6c5"), "key" : 1 }
```

### 卸载mongodb

```
yum remove mongodb-org \
	mongodb-org-mongos \
	mongodb-org-server \
	mongodb-org-shell \
	mongodb-org-tools -y
```
