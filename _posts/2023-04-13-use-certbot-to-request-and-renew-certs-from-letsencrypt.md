---
layout: post
title: 使用certbot申请和更新letsencrypt证书
date: 2023-04-13 00:12:05
---

### 使用pip安装certbot和azure dns插件

```
pip install certbot certbot-dns-azure
```

### 创建[azure配置文件](https://docs.certbot-dns-azure.co.uk/en/latest/#configuration)

在home目录创建`.azure.ini`文件，替换成你的azure service principal：

```
dns_azure_sp_client_id = 912ce44a-0156-4669-ae22-c16a17d34ca5
dns_azure_sp_client_secret = E-xqXU83Y-jzTI6xe9fs2YC~mck3ZzUih9
dns_azure_tenant_id = ed1090f3-ab18-4b12-816c-599af8a88cf7

dns_azure_environment = "AzurePublicCloud"

dns_azure_zone1 = example.com:/subscriptions/c135abce-d87d-48df-936c-15596c6968a5/resourceGroups/dns1
```

### 申请证书

```
certbot certonly \
        --authenticator dns-azure \
        --preferred-challenges dns \
        --noninteractive \
        --agree-tos \
        --email example@example.com \
        --domains example.com \
        --dns-azure-config ~/.azure.ini
```

### 更新证书

```
certbot renew \
        --post-hook 'systemctl restart nginx' \
        --max-log-backups 60"
```

可以将更新证书的命令创建成cronjob，每天运行一次。只有证书过期，certbot才会执行你指定的hook命令。例如：

```
# crontab -l
0 0 * * * /usr/local/bin/certbot renew --post-hook 'systemctl restart nginx' --max-log-backups 60
```
