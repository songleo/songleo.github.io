---
layout: post
title: let’s encrypt使用tips
date: 2023-03-13 00:12:05
---

- 在域名提供商处添加a记录指向public ip，才能通过域名访问web

- azure上的vm自定义域名通过http-01方式验证可以证书

- 在azure vm上使用自定义域名，需要创建相应的azure dns zone，并和域名提供商[做出对应配置](https://www.youtube.com/watch?v=dAsC1XHmNC4)，并在dns zone中配置相应a记录和cname，a记录执行public ip，cname指向vm的域名

- 在azure vm上使用自定义域名且使用dns-01方式验证，只需要在域名提供商处配置azure dns zone的name server

- certbot通过azure-dns插件申请证书

```
certbot certonly \
    --authenticator dns-azure \
    --preferred-challenges dns \
    --noninteractive \
    --agree-tos \
    --email ssli@redhat.com \
    --domains reborncodinglife.com \
    --dns-azure-config /root/azure.ini
```

- certbot查看证书

```
certbot certificates
```

- 查看证书

```
openssl x509 -noout -text -in tower.cert
```

- 查看csr

```
openssl req -noout -text -in tower.csr
```

- 验证证书

```
# openssl verify tower.cert
tower.cert: OK
```

- 查看key

```
openssl rsa -noout -text -in tower.key
```

- 确保证书和秘钥一致

```
# openssl x509 -noout -modulus -in tower.cert | openssl md5
(stdin)= 3da996241erv07b0ebe1a99123aa0544
# openssl rsa -noout -modulus -in tower.key | openssl md5
(stdin)= 3da996241erv07b0ebe1a99123aa0544
```

## ref

- https://certbot-dns-azure.readthedocs.io/en/latest/
- https://eff-certbot.readthedocs.io/en/stable/using.html#certbot-commands
