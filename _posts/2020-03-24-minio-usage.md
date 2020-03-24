---
layout: post
title: minio的使用
date: 2020-03-24 12:12:05
---

minio是一个对象存储服务。它兼容亚马逊s3云存储服务接口，非常适合于存储大容量非结构化的数据，例如图片、视频、日志文件、备份数据和容器/虚拟机镜像等，而一个对象文件可以是任意大小，从几kb到最大5t不等。

### 启动minio

```
$ docker run -d -p 9000:9000 --rm \
  -v /Users/ssli/mnt/data:/data \
  -v /Users/ssli/mnt/config:/root/.minio \
  minio/minio server /data
```

### 登录minio的dashboard

浏览器打开http://localhost:9000/minio/login，默认access key和secret key如下：

```
minioadmin
minioadmin
```

access key和secret key也可以在启动minio时通过环境变量指定。成功登录后，先创建bucket，然后就可以正常上传文件bucket，上传的文件可以分享给其他人下载。

### 使用客户端mc

安装minio客户端命令行工具mc，配置对象存储的url、access key和secret key后，可以查看不同对象存储的bucket，例如：

- 查看本地bucket

```
$ mc config host add local http://localhost:9000 minioadmin minioadmin S3v4
Added `local` successfully.
$ mc ls local
[2020-03-24 13:32:30 CST]      0B test/
```

- 查看s3的bucket

```
$ mc config host add s3 https://s3.amazonaws.com aws-access-key aws-secret-key S3v4
Added `s3` successfully.
$ mc ls s3
[2020-03-24 13:33:30 CST]      0B s3-test/
```

mc配置对象存储服务的方式如下：

```
mc config host add <alias> <your-s3-endpoint> <your-access-key> <your-secret-key> <api-signature>
```

- alias：对象存储的别名，如s3、gcs和local
- your-s3-endpoint：对象存储的访问url，如果是aws s3输入：https://s3.amazonaws.com， 如果是本地搭建的输入：http://localhost:9000 ，如果是gcs输入：https://storage.googleapis.com
- your-access-key：访问s3的key
- your-secret-key：访问s3的secret key
- api-signature：api签名，比如s3的s3v4，gcs的S3v2

### ref

- https://docs.min.io/cn/minio-client-quickstart-guide.html
- https://docs.min.io/cn/minio-docker-quickstart-guide.html
