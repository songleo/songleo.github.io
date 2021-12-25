---
layout: post
title: go实现https认证
date: 2021-12-25 00:12:05
---

## 创建ca

```
$ openssl genrsa -out ca.key 2048
$ openssl req -new -x509 -days 365 -key ca.key -subj "/C=CN/ST=SX/L=XA/O=RedHat, Inc./CN=RedHat Root CA" -out ca.crt
```

## 创建user1的证书

```
$ openssl req -newkey rsa:2048 -nodes -keyout user1.key -subj "/C=CN/ST=GD/L=SZ/O=RedHat, Inc./CN=*.user1.com" -out user1.csr
$ openssl x509 -req -extfile <(printf "subjectAltName=DNS:user1.com,DNS:www.user1.com") -days 365 -in user1.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out user1.crt
```

## 同样方式创建user2的证书

```
$ openssl req -newkey rsa:2048 -nodes -keyout user2.key -subj "/C=CN/ST=GD/L=SZ/O=RedHat, Inc./CN=*.user2.com" -out user2.csr
$ openssl x509 -req -extfile <(printf "subjectAltName=DNS:user2.com,DNS:www.user2.com") -days 365 -in user2.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out user2.crt
$ ls ca*
ca.crt ca.key ca.srl
$ ls user1*
user1-server.go user1.crt       user1.csr       user1.key
$ ls user2*
user2-client.go user2.crt       user2.csr       user2.key
```

## 使用创建的证书实现https单向认证

user1作为server端，user2作为client端，即client端需要验证server端证书。

```
$ go run user1-server.go
# 在另外一个终端访问user1-server
$ go run user2-client.go
I am user1
```

## 使用创建的证书实现https双向认证

client和server端双向认证。

```
$ go run user1-dual-server.go
# 在另外一个终端访问user1-server
$ go run user2-dual-client.go
I am user1
```

所有相关代码和证书：https://github.com/songleo/songleo.github.io/tree/main/src/https

## ref

- https://zhaohuabing.com/post/2020-03-19-pki/
- https://tonybai.com/2015/04/30/go-and-https/
