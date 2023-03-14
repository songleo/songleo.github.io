---
layout: post
title: let’s encrypt使用tips
date: 2023-03-13 00:12:05
---

- 在域名提供商处添加a记录指向public ip，才能通过域名访问web

- azure上的vm自定义域名通过http-01方式验证可以证书

- 在azure vm上使用自定义域名，需要创建相应的azure dns zone，并和域名提供商[做出对应配置](https://www.youtube.com/watch?v=dAsC1XHmNC4)，并在dns zone中配置相应a记录和cname，a记录执行public ip，cname指向vm的域名

- 在azure vm上使用自定义域名且使用dns-01方式验证，需要在域名提供商处配置azure dns zone的name server

- certbot使用

```
certbot certonly \
    --rsa-key-size 4096 \
    --key-type rsa \
    --authenticator dns-azure \
    --preferred-challenges dns \
    --noninteractive \
    --agree-tos \
    --email ssli@redhat.com \
    --cert-path /root/certbot/new \
    --key-path /root/certbot/new \
    --fullchain-path /root/certbot/new \
    --domains reborncodinglife.com \
    --dns-azure-config /root/azure.ini

certbot certonly \
  --authenticator dns-azure \
  --preferred-challenges dns \
  --noninteractive \
  --agree-tos \
  --dns-azure-config ~/.secrets/certbot/azure.ini \
  -d example.com

certbot renew \
    --force-renewal \
    --rsa-key-size 4096 \
    --key-type rsa \
    --preferred-challenges dns \
    --cert-path /root/certbot/certs \
    --key-path /root/certbot/keys \
    --fullchain-path /root/certbot/certs \
    --dry-run

certbot certificates \
    --cert-path /root/certbot/certs \
    --key-path /root/certbot/keys \
    --fullchain-path /root/certbot/certs
```
