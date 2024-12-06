---
layout: post
title: cert-manager管理和签发证书
date: 2024-12-06 00:12:05
---

### 创建 ClusterIssuer 或 Issuer 资源

ClusterIssuer 是 cert-manager 中用于定义如何签发证书的全局资源。它可以定义多个颁发证书的方式，如通过 ACME (Let's Encrypt)、自签名证书或内部 CA。

首先，我们需要创建一个 ClusterIssuer，它将使用 ACME 协议从 Let's Encrypt 颁发证书。

```
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: example-cluster-issuer
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: youremail@example.com
    privateKeySecretRef:
      name: example-cluster-issuer-key
    solvers:
      - http01:
          ingress:
            class: nginx
```

在这个例子中，ClusterIssuer 使用 ACME 协议与 Let's Encrypt 进行交互，通过 http01 挑战进行域名验证。我们指定了一个邮箱地址，以及私钥存储在名为 example-cluster-issuer-key 的 Secret 中。

### 创建 Certificate 资源

当 ClusterIssuer 配置完成后，我们就可以创建 Certificate 资源，指定需要签发证书的域名、Issuer 等信息。

```
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: example-certificate
  namespace: default
spec:
  secretName: example-tls
  issuerRef:
    name: example-cluster-issuer
    kind: ClusterIssuer
  dnsNames:
    - example.ssli.example.com
    - api.ssli.example.com
  privateKey:
    algorithm: RSA
    size: 4096
```

在这个例子中，Certificate 请求了一个包含 example.ssli.example.com 和 api.ssli.example.com 的证书。证书将存储在名为 example-tls 的 Secret 中，并使用之前创建的 ClusterIssuer 来签发证书。

### ACME 挑战 (Challenge)

证书的签发需要通过验证域名所有权来进行。在 ACME 协议中，通常有三种类型的挑战：

- http-01：通过 HTTP 请求验证
- dns-01：通过 DNS 记录验证
- tls-alpn-01：通过 TLS 握手验证

cert-manager 会自动创建这些挑战资源，并请求证书颁发机构进行验证。

在我们的例子中，cert-manager 会为 example.ssli.example.com 和 api.ssli.example.com 创建 ACME http-01 类型的挑战。

### Domain Validation (域名验证)

每当证书请求被创建时，cert-manager 会在 Challenges 部分发起域名验证请求，通常通过 HTTP 或 DNS 挑战来验证域名所有权。

以 http-01 挑战为例，cert-manager 会自动创建一个 Ingress，用于响应 HTTP 请求。例如，挑战资源会要求你访问：

```
http://example.ssli.example.com/.well-known/acme-challenge/<token>
```

这个请求需要返回一个特定的 token。cert-manager 会将其放置在 Ingress 中并处理验证过程。如果验证成功，挑战状态会变为 valid，证书的签发就可以继续进行。

### Order 资源

在 cert-manager 中，ACME 证书请求会创建一个 Order 资源。这个资源代表一个证书请求的状态，它追踪着证书的验证过程。

Order 资源包括以下信息：

- Authorization：授权信息，指示是否已经成功验证域名所有权。
- Finalization：一旦验证通过，cert-manager 会通过 Finalization 阶段完成证书的签发。
你可以查看 Order 资源来监控证书请求的状态。

```
apiVersion: cert-manager.io/v1
kind: Order
metadata:
  name: example-order
  namespace: default
spec:
  commonName: example.ssli.example.com
  dnsNames:
    - example.ssli.example.com
    - api.ssli.example.com
status:
  state: pending
```

Order 资源的状态可能为 pending、processing 或 valid，指示证书请求的当前状态。

### 证书签发和更新

一旦挑战验证通过，cert-manager 会向 ACME 服务器请求最终的证书。一旦证书生成，它将被存储在 Certificate 资源中指定的 Secret 中。Secret 包含了证书的私钥和公钥。如果你为证书配置了自动更新，当证书接近过期时，cert-manager 会自动重新发起证书请求，完成续期。

### 排查问题

在实际操作中，可能会遇到一些常见问题，例如：

- DNS 配置错误：如果域名的 DNS 记录没有正确配置，ACME 验证将失败，导致证书无法签发。例如，如果 example.ssli.example.com 的 DNS 记录没有正确解析，ACME 挑战验证将无法通过。
- 权限问题：确保 cert-manager 具备足够的权限来创建 Ingress 资源或更新 DNS 记录。
你可以通过 kubectl describe 命令来检查 Certificate 和 Challenge 的状态，查看详细的错误信息。

