---
layout: post
title: cka练习（一）
date: 2021-11-19 12:12:05
---

## 1 查看当前系统有多少镜像

```shell
$ docker images | grep nginx
nginx                                                       latest              ea335eea17ab        42 hours ago        141MB
```

## 2 给镜像打标签并导出镜像为nginx.tar

```shell
$ docker images | grep nginx
nginx                                                       latest              ea335eea17ab        42 hours ago        141MB
$ docker tag nginx:latest nginx:v1
$ dockerimages | grep nginx
nginx                                                       latest              ea335eea17ab        42 hours ago        141MB
nginx                                                       v1                  ea335eea17ab        42 hours ago        141MB
$ docker save nginx:v1 > nginx.tar
$ ls nginx.tar
nginx.tar
```

## 3 创建容器nginx，并满足以下要求：

- 名字为web
- 重启策略为always
- 容器端口80映射到物理机8080
- 物理机/web目录挂载到容器/usr/share/nginx/html
- 在容器/usr/share/nginx/html目录中创建index.html，内容为hello docker
- 打开浏览器查看是否看到hello docker
- 删除容器web和镜像

```shell
$ docker run -d -it --name web --restart=always -p 8080:80 -v /web:/usr/share/nginx/html nginx:v1
129b64eb82ccdd3c574a307de50eb49ef35292cc7f301ac8e3cdefb380cba904
$ docker exec -it web /bin/bash
root@129b64eb82cc:/# echo "hello docker" > /usr/share/nginx/html/index.html
root@129b64eb82cc:/# exit
exit
$ curl localhost:8080
hello docker
$ docker rm -f web
web
$ docker rmi nginx:v1
Untagged: nginx:v1
$ docker rmi nginx:latest
Untagged: nginx:latest
Untagged: nginx@sha256:097c3a0913d7e3a5b01b6c685a60c03632fc7a2b50bc8e35bcaa3691d788226e
Deleted: sha256:ea335eea17ab984571cd4a3bcf90a0413773b559c75ef4cda07d0ce952b00291
Deleted: sha256:cc284e9b1cbed75793782165a07a0c2139d8ec0116d1d562c0e2e504ed586238
Deleted: sha256:6207e091bef7f1c94a109cb455ba163d53d7c2c641de65e71d3a0f33c0ebd8ae
Deleted: sha256:97a18ff8c6973f64d763f004cad932319a1428e0502c0ec3e671e78b2f14256b
Deleted: sha256:319130834f01416a2e8f9a4f2b2fa082c702ac21f16e0e2a206e23d53a0a3bae
Deleted: sha256:1bc375f72973dc110c9629a694bc7476bf878d244287c0214e6436afd6a9d1b0
Deleted: sha256:e1bbcf243d0e7387fbfe5116a485426f90d3ddeb0b1738dca4e3502b6743b325
$ docker images | grep ngnix
```

## 参考

- cka/ckad应试指南：从docker到kubernetes完全攻略