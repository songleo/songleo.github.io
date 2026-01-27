---
layout: post
title: 使用external-secrets访问azure keyvault
date: 2026-01-20 00:12:05
---

## 查看aks是否启用oidc

```
az aks show \
  -g rg-aap-mgmt \
  -n aks-aap-mgmt \
```

记录oidc issuer url。

## 创建 user assigned managed identity

```
az identity create \
  -g rg-aap-mgmt \
  -n id-obs-aap-mgmt-dev
```

记录输出中的clientId和principalId。

## 给 managed identity 授权 key vault

```
az role assignment create \
  --assignee-object-id <principalId> \
  --assignee-principal-type ServicePrincipal \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/<SUB_ID>/resourceGroups/<KV_RG>/providers/Microsoft.KeyVault/vaults/<KV_NAME>

or

az keyvault set-policy \
  --name kv-aap-vault-dev \
  --object-id xxx \
  --secret-permissions get list
```

## 创建 federated identity credential

```
az identity federated-credential create \
  --name eso-federation \
  --identity-name eso-identity \
  --resource-group <AKS_RG> \
  --issuer <OIDC_ISSUER_URL> \
  --subject system:serviceaccount:external-secrets:external-secrets \
  --audience api://AzureADTokenExchange

```

## 给external-secrets的sa添加一下annotation

```
azure.workload.identity/client-id: xxx
azure.workload.identity/tenant-id: xxx
```

## 创建 clustersecretstore


```
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: cluster-cross-account-secret-store
  namespace: external-secrets
spec:
  provider:
    azurekv:
      authType: WorkloadIdentity
      vaultUrl: https://kv-aap-vault-dev.vault.azure.net
      serviceAccountRef:
        name: cluster-external-secrets
        namespace: external-secrets
```

## 创建clusterexternalsecret


```
apiVersion: external-secrets.io/v1beta1
kind: ClusterExternalSecret
metadata:
  name: grafana-admin-credentials
  namespace: external-secrets
spec:
  externalSecretName: "grafana-admin-credentials"
  namespaceSelector:
    matchLabels:
      kubernetes.io/metadata.name: xxx
  refreshTime: 1m
  externalSecretSpec:
    refreshInterval: 1m
    secretStoreRef:
      name: cluster-secret-store
      kind: ClusterSecretStore
    target:
      name: grafana-admin-credentials
      template:
        type: Opaque
        data:
          xxx: "{{ .admin_password }}"
          xxx: admin
    data:
    - secretKey: admin_password
      remoteRef:
        key: "xxx"

```

## 查看生成的secret

```
$ k get secret
NAME                                   TYPE     DATA   AGE
grafana-admin-credentials              Opaque   2      25s
```
