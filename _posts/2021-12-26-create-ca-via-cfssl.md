---
layout: post
title: 使用cfssl创建自签名证书
date: 2021-12-26 00:12:05
---

## 创建ca配置文件

可以通过执行`cfssl print-defaults config`创建默认的配置文件，然后再修改。

```
# cat ca-config.json
{
  "signing": {
    "default": {
      "expiry": "1680h"
    },
    "profiles": {
      "www": {
        "expiry": "8760h",
        "usages": [
          "signing",
          "key encipherment",
          "server auth"
        ]
      }
    }
  }
}
```

## 创建ca csr配置文件

可以通过执行`cfssl print-defaults csr`创建默认的csr配置文件，然后再修改。

```
# cat ca-csr.json
{
  "CN": "ssli.com",
  "key": {
    "algo": "ecdsa",
    "size": 256
  },
  "names": [
    {
      "C": "CN",
      "ST": "SX",
      "L": "XA",
      "O": "SSLI",
      "OU": "CKS"
    }
  ]
}
```

## 创建ca

```
cfssl gencert -initca ca-csr.json | cfssljson -bare ca
```
## 创建自签名证书的csr

```
# cat ssli-csr.json
{
  "CN": "ssli.com",
  "key": {
    "algo": "ecdsa",
    "size": 256
  },
  "hosts": [
    "www.ssli.com"
  ],
  "names": [
    {
      "C": "CN",
      "ST": "SX",
      "L": "XA",
      "O": "SSLI",
      "OU": "CKS"
    }
  ]
}
```

## 创建自签名证书

```
# cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=www ssli-csr.json | cfssljson -bare ssli
```

## ca和证书

```
# ls *.pem
ca-key.pem  ca.pem  ssli-key.pem  ssli.pem
```

下篇文章中会介绍如何在ingress中使用这个证书。
