---
layout: post
title: 在ingress中启用https
date: 2021-12-26 00:12:05
---
## 创建web应用

创建一个nginx deployment并修改了默认页面 `/usr/share/nginx/html/index.html`为`hello nginx`，这里先通过http方式创建ingress：

```
# k create deployment nginx --image=nginx
# k -it  exec nginx-6799fc88d8-nbs4h -- bash
# echo "hello nginx" > /usr/share/nginx/html/index.html
# cat /usr/share/nginx/html/index.html
hello nginx
# kubectl expose deployment nginx --port=80 --name=nginx
service/nginx exposed
# k get svc
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1        <none>        443/TCP   41h
nginx        ClusterIP   10.102.140.200   <none>        80/TCP    16s
# curl 10.102.140.200
hello nginx
# cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx
  annotations:
    kubernetes.io/ingress.class: "nginx"
spec:
  rules:
  - host: www.ssli.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx
            port:
              number: 80
EOF
```

这里需要将ingress controller运行的节点ip写入/etc/hosts文件，比如：

```
# cat /etc/hosts | grep www.ssli.com
192.168.0.141 www.ssli.com
```

访问服务：

```
# curl www.ssli.com
hello nginx
```
## 启用https

参考我之前的文章：<[使用cfssl创建自签名证书](http://reborncodinglife.com/2021/12/26/create-ca-via-cfssl/)> 创建好自己的证书，在ingress添加证书信息：

```
# k create secret tls ssli-tls --key=./ssli-key.pem --cert=ssli.pem
# cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx
  annotations:
    kubernetes.io/ingress.class: "nginx"
spec:
  tls:
  - hosts:
      - www.ssli.com
    secretName: ssli-tls
  rules:
  - host: www.ssli.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx
            port:
              number: 80
EOF
# curl -k https://www.ssli.com
hello nginx
# curl -kv https://www.ssli.com

...

* Server certificate:
*  subject: C=CN; ST=SX; L=XA; O=SSLI; OU=CKS; CN=ssli.com
*  start date: Dec 26 09:28:00 2021 GMT
*  expire date: Dec 26 09:28:00 2022 GMT
*  issuer: C=CN; ST=SX; L=XA; O=SSLI; OU=CKS; CN=ssli.com

...

```

可以看到ingress使用了我们创建的自签名证书。后面会介绍如何通过cert-manager在ingress中自动签发证书。
