---
layout: post
title: cert-manager签发证书
date: 2021-12-27 00:12:05
---

## 创建自签名ca

ca的创建参考：<[使用cfssl创建自签名证书](http://reborncodinglife.com/2021/12/26/create-ca-via-cfssl/)>

```
kubectl create secret tls ca-key --cert=ca.pem --key=ca-key.pem --namespace=cert-manager
```

## 创建clusterissuer

```
# cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: ssli-cluster-issuer
spec:
  ca:
    secretName: ca-key
EOF
# k get clusterissuers.cert-manager.io
NAME                  READY   AGE
ssli-cluster-issuer   True    6s
```

## 创建certificate

这里需要指定clusterissuer和生成证书的secret名字，创建certificate：

```
# cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: ssli-com
spec:
  dnsNames:
  - www.ssli.com
  issuerRef:
    kind: ClusterIssuer
    name: ssli-cluster-issuer
  secretName: ssli-cert
EOF
# k get certificate
NAME       READY   SECRET      AGE
ssli-com   True    ssli-cert   9s
```

创建成功后，证书会保存到指定的secret，如下：

```
# k get secret ssli-cert
NAME        TYPE                DATA   AGE
ssli-cert   kubernetes.io/tls   3      26s
```

## 在ingress中使用该证书

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
  tls:
  - hosts:
      - www.ssli.com
    secretName: ssli-cert
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
```

或者在ingress中指定相应的clusterissuer，ingress会自动签发证书并使用，如下：

```
$ cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "ssli-cluster-issuer"
spec:
  tls:
  - hosts:
      - www.ssli.com
    secretName: auto-ssli-cert
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
# k get secret auto-ssli-cert
NAME             TYPE                DATA   AGE
auto-ssli-cert   kubernetes.io/tls   3      38s
# curl -k https://www.ssli.com
hello nginx
```

可以看到自动生成了证书secret，并且服务也正常。
