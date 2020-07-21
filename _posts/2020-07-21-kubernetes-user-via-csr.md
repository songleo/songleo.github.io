---
layout: post
title: 通过csr创建kubernetes用户
date: 2020-07-21 12:12:05
---

## 创建私钥和csr

```
$ openssl genrsa -out ssli.key 2048
$ openssl req -new -key ssli.key -out ssli.csr
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [XX]:cn
State or Province Name (full name) []:sx
Locality Name (eg, city) [Default City]:xa
Organization Name (eg, company) [Default Company Ltd]:rh
Organizational Unit Name (eg, section) []:rhxa
Common Name (eg, your name or your server's hostname) []:ssli
Email Address []:ssli@redhat.com

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:123456
An optional company name []:rh

$ cat ssli.csr | base64 | tr -d "\n"
$ cat <<EOF | kubectl apply -f -
apiVersion: certificates.k8s.io/v1beta1
kind: CertificateSigningRequest
metadata:
  name: ssli
spec:
  groups:
  - system:authenticated
  request: __REPLACE_IT__ # cat ssli.csr | base64 | tr -d "\n"
  usages:
  - client auth
EOF

$ k get csr
NAME   AGE   REQUESTOR    CONDITION
ssli   6s    kube:admin   Pending
$ k certificate approve ssli
certificatesigningrequest.certificates.k8s.io/ssli approved
```

## 从csr中获取签发的证书

```
$ kubectl get csr/ssli -o yaml

$ kubectl get csr ssli -o jsonpath='{.status.certificate}' | base64 -d > ssli.crt
```

## 给用户相应的权限

```
$ kubectl create role developer --verb=create --verb=get --verb=list --verb=update --verb=delete --resource=pods
$ kubectl create rolebinding developer-binding-ssli --role=developer --user=ssli
```

## 使用新用户访问集群

```
$ kubectl config set-credentials ssli --client-key=/share/git/k8s_practice/authn-authz/ssli.key --client-certificate=/share/git/k8s_practice/authn-authz/ssli.crt --embed-certs=true

$ kubectl config set-context ssli --cluster=soli-acm-hub --user=ssli

$ kubectl config use-context ssli
```
