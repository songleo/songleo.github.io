# https 教学示例

本目录是 [go 实现 https 认证](https://reborncodinglife.com/posts/2021-12-25-https-with-golang/) 的配套代码，不参与 astro 站点构建。

旧的 ca、服务端和客户端证书有效期均为 2021—2022 年，配套私钥曾公开提交。现在只保留代码和生成说明，不提供可复用证书、私钥或伪装为证书的占位文件。删除当前文件不会清除 git 历史，也无法证明历史材料从未被其他环境信任。

## 本地实验

需要 go、openssl 和 bash（例如 wsl）。在此目录按文章的“创建 ca”和两个用户证书章节运行命令，每次实验自行生成新的材料。命令中的进程替换 `<(...)` 需要 bash，不能直接粘贴到 powershell。生成的 `.key`、`.crt`、`.csr`、`.srl` 和 `.pem` 文件已被此目录的 `.gitignore` 排除。

在隔离的实验环境中，将 `user1.com` 和 `www.user1.com` 解析到运行示例服务的地址。证书的 san 必须与客户端访问的域名一致；不要通过跳过 tls 校验处理域名错误。示例将新生成的 `ca.crt` 显式加载到客户端，无需安装进系统信任库。

单向认证，分别在两个终端执行：

```bash
go run user1-server.go
go run user2-client.go
```

停止前一服务后，再分别执行双向认证示例：

```bash
go run user1-dual-server.go
go run user2-dual-client.go
```

这些文件是独立程序，不要执行 `go run .`，因为目录中存在多个 `main`。实验结束后清理自己生成的材料。不要复用 git 历史中的密钥，也不要把实验 ca 导入生产信任库。
