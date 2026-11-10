---
title: "racknerd + wireguard + dns 域名审计实战教程"
description: "从购买低配 vps 开始，在 ubuntu 上部署 wireguard 与 dnsmasq，配置 windows 11 和 iphone，管理临时设备，并将 dns 查询日志导出为 csv。"
pubDatetime: 2026-11-08T00:00:00+08:00
tags: ["linux", "网络", "安全", "部署"]
draft: true
---

这篇教程面向第一次购买 vps 的个人用户：自己长期使用 windows 11 和 iphone，另外两个人偶尔连接，每台设备独立授权，需要时可以立即撤销，并留下可导出的 dns 查询域名记录。

采用的方案是 **1 核、1gb 的 racknerd vps + ubuntu 24.04 lts + wireguard + dnsmasq**。不安装 docker、管理后台或数据库，不做域名封禁。

**本文是待执行教程，不是部署成功记录。没有购买服务器，也没有在真实 vps 上执行这些命令。** 配置依据官方资料整理，命令仅适用于新建、专用于本教程的 ubuntu vps；已有业务服务器不能直接照抄。

## 一、先理解这套方案

可以把 vps 理解成租来的远程 linux 电脑，把 wireguard 理解成连接自己设备与服务器的加密隧道。dnsmasq 负责把域名转换成 ip，并记录经过它的查询。

```text
windows / iphone（每台设备独立密钥）
                 │
                 │ wireguard，公网 udp 51820
                 ▼
         ubuntu vps：10.8.0.1
           ├── wireguard：加密隧道
           ├── dnsmasq：dns 解析与查询日志
           └── ipv4 转发与 nat → 互联网

管理员 windows → vpn 内 ssh → 管理设备、导出 csv
```

| 项目 | 本文选择 |
| --- | --- |
| 服务器 | 1 vcpu、1gb 内存、20gb ssd、1 个公网 ipv4 |
| 参考价格 | $21.99/年，不含可能的税费及可选服务 |
| 套餐流量 | 3tb/月，所有设备共享；计费口径和超额处理以订单为准 |
| 系统 | ubuntu 24.04 lts |
| 常驻应用 | wireguard、dnsmasq，以及系统原有的 ssh 等服务 |
| 设备管理 | 每台设备独立公私钥，管理员维护服务器 peer 列表 |
| 日志 | 按天轮转，当前日志加 13 份归档，目标约 14 天 |
| 最终公网入站端口 | 51820/udp；首次安装临时保留受限的 22/tcp |

截至 2026-11-08，[racknerd 官方套餐页](https://www.racknerd.com/specials/)仍列出上述资源和价格。这是本文选用的低成本套餐，不表示它永远是市场最低价，也不保证你所在网络的速度。购买前核对当期活动、机房库存、续费价格及退款条款。

1gb 是这套轻量方案的起点，实际能承受多少连接和吞吐仍要实测。无需额外购买商业 vpn 订阅，但系统维护、安全更新和流量管理需要自己负责。

### 域名日志能说明什么

日志能说明“某个 vpn 地址向这台 dnsmasq 查询过某个域名”，**不能证明这个人打开过网页**，也不能看到完整网址、网页内容或聊天内容。

浏览器缓存、后台预取、应用内加密 dns、直接访问 ip、关闭隧道等都会影响记录。dns 查询日志只是轻量参考审计，不是完整、不可绕过的访问审计。向访客发放配置前，告知记录内容、用途和保留时间。

## 二、购买与首次登录

### 1. 购买前确认

1. 打开官方套餐页，选定 1gb kvm vps。
2. 在当前可选机房中考虑洛杉矶；使用官方提供的测试地址，分别测试家庭宽带和手机热点，白天与晚高峰都测试。
3. 核对订单中的 cpu、内存、流量、公网 ipv4、年付金额、续费条件和退款条款，不只看宣传页。
4. 选择 ubuntu 24.04 lts。不要选择带 docker 或网页管理面板的一键应用镜像。
5. 付款后记录服务入口和服务器公网 ip，将初始凭据保存在密码管理器中。
6. 打开供应商的控制台或 vnc，确认能登录。这是以后 vpn 故障、ssh 被防火墙挡住时的恢复入口。

本教程的地址都是教学示例。`203.0.113.10` 是文档示例公网地址，不能直接连接；`10.8.0.0/24` 和 `fd42:8:8::/64` 是示例隧道网段，使用前确认不与自己的局域网及其他 vpn 冲突。

| 设备 | ipv4 | 隧道内 ipv6 | 权限 |
| --- | --- | --- | --- |
| vps | 10.8.0.1 | fd42:8:8::1 | 服务端 |
| me-windows | 10.8.0.2 | fd42:8:8::2 | 上网、dns、管理员 ssh |
| me-iphone | 10.8.0.3 | fd42:8:8::3 | 上网、dns |
| guest-b | 10.8.0.4 | fd42:8:8::4 | 按需授权，上网、dns |
| guest-c | 10.8.0.5 | fd42:8:8::5 | 按需授权，上网、dns |

### 2. 在 windows 生成 ssh 密钥

在 windows powershell 中执行。本文后续标有 `powershell` 的代码块都在本机执行，标有 `bash` 的都在 vps 的终端执行。

```powershell
$VpsIp = "203.0.113.10" # 改成购买后获得的公网 ipv4
ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\racknerd_admin"
Get-Content "$env:USERPROFILE\.ssh\racknerd_admin.pub"
ssh root@$VpsIp
```

为私钥设置口令。若目标密钥文件已经存在，不要覆盖。第一次连接出现主机指纹时，通过供应商控制台运行下面的命令核对，而不是盲目接受：

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

### 3. 创建管理员并验证密钥登录

在首次登录的 root 会话执行：

```bash
adduser vpnadmin
usermod -aG sudo vpnadmin
install -d -m 700 -o vpnadmin -g vpnadmin /home/vpnadmin/.ssh
nano /home/vpnadmin/.ssh/authorized_keys
```

把刚才 `.pub` 文件的完整一行粘贴进去并保存。不要粘贴私钥。然后执行：

```bash
chown vpnadmin:vpnadmin /home/vpnadmin/.ssh/authorized_keys
chmod 600 /home/vpnadmin/.ssh/authorized_keys
```

**保留 root 会话，新开一个 powershell 窗口验证：**

```powershell
ssh -i "$env:USERPROFILE\.ssh\racknerd_admin" vpnadmin@$VpsIp
```

登录后执行 `sudo -v`，确认管理员密码和 sudo 正常。后文在这个 `vpnadmin` 会话操作。

### 4. 初始化系统与 ssh

```bash
sudo apt update
sudo apt upgrade
sudo apt install wireguard ufw iptables logrotate python3 dnsutils
sudo timedatectl set-timezone UTC
timedatectl status
```

使用系统中已配置且可用的可信软件源，不运行陌生的一键安装脚本。这里统一使用 utc，便于日志跨设备比对；北京时间为 utc 加 8 小时。若系统提示需要重启，趁公网管理入口还在时完成重启，再重新登录。

确认密钥登录成功后，写入 ssh 配置：

```bash
sudo tee /etc/ssh/sshd_config.d/00-vpn-admin.conf >/dev/null <<'EOF'
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
AllowUsers vpnadmin
EOF
sudo sshd -t
sudo sshd -T | grep -E '^(pubkeyauthentication|passwordauthentication|kbdinteractiveauthentication|permitrootlogin|allowusers) '
```

输出应对应上面的值。检查失败先修复，不要重载；检查成功后执行 `sudo systemctl reload ssh`，再新开窗口验证密钥登录。ubuntu 的 ssh 配置通常采用先读到的值，[官方说明](https://ubuntu.com/server/docs/how-to/security/openssh-server/)建议检查生效配置，不能只相信文件已经写入。

## 三、先建立防火墙，再安装 dns 服务

先从当前 ssh 会话确认来源地址：

```bash
printf '%s\n' "$SSH_CONNECTION"
ip -4 route show default
sudo ufw status verbose
grep '^IPV6=' /etc/default/ufw
```

`SSH_CONNECTION` 第一项是本次连接的来源 ip。下面假设它是 ipv4。将 `198.51.100.25` 换成这个值；将 `ens3` 换成默认路由 `dev` 后面的网卡名。

本教程假设新机没有自定义防火墙规则。若 `ufw status` 已显示无关的允许规则，不要直接继续。`IPV6` 应为 `yes`，这样 ufw 也会管理公网 ipv6 入站；没有公网 ipv6 不影响这个设置。

为阻止隧道设备之间的转发，先用 `sudo nano /etc/ufw/before.rules` 打开配置，在 `*filter` 部分所有 `:ufw-...` 链声明之后、第一条 `-A` 规则之前插入这一行，保留其他内容：

```text
-A ufw-before-forward -i wg0 -o wg0 -j DROP
```

放在前面是为了先于 ufw 默认的已建立连接和 icmp 放行规则生效。本文不转发 ipv6，无需另外添加 ipv6 客户端互访放行。保存后设置其余规则：

```bash
ADMIN_IP='198.51.100.25'
WAN_IF='ens3'

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw default deny routed
sudo ufw allow from "$ADMIN_IP" to any port 22 proto tcp comment 'temporary-admin'
sudo ufw allow 51820/udp
sudo ufw allow in on wg0 from 10.8.0.2 to 10.8.0.1 port 22 proto tcp
sudo ufw allow in on wg0 from 10.8.0.0/24 to 10.8.0.1 port 53 proto udp
sudo ufw allow in on wg0 from 10.8.0.0/24 to 10.8.0.1 port 53 proto tcp
sudo ufw route allow in on wg0 out on "$WAN_IF" from 10.8.0.0/24
sudo ufw enable
sudo ufw status numbered
```

保留当前连接，用新窗口确认公网 ssh 仍然可用。若供应商还有网络防火墙，也应允许你的当前来源访问 22/tcp，以及客户端访问 51820/udp；不要开放公网 53、80、443 入站。出站连接及其响应仍需允许。

这里仅允许 `10.8.0.2` 使用管理 ssh。访客没有服务器账号，转发规则只允许从 `wg0` 去公网网卡，不额外放行客户端之间的转发。[ufw 的原理与规则说明](https://ubuntu.com/server/docs/how-to/security/firewalls/)可用于核对现场差异。

## 四、部署 wireguard 服务端

### 1. 开启 ipv4 转发

```bash
sudo tee /etc/sysctl.d/70-wireguard-routing.conf >/dev/null <<'EOF'
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 0
EOF
sudo sysctl -p /etc/sysctl.d/70-wireguard-routing.conf
```

本文只提供 ipv4 互联网出口。客户端会把 ipv6 默认路由也送入隧道，但服务器不转发 ipv6，因此连接期间 ipv6 网站应无法通过 ipv6 直连。这样无需给低配 vps 额外设计 ipv6 出口；仍须在两种客户端上实测是否存在绕行。

### 2. 生成服务端密钥与配置

下面的生成命令只在首次安装时执行。先把脚本中的 `ens3` 改为真实出口网卡；脚本遇到已有密钥或配置会停止，避免覆盖。

```bash
sudo install -d -m 700 /etc/wireguard
sudo bash <<'SCRIPT'
set -eu
test ! -e /etc/wireguard/server.key
test ! -e /etc/wireguard/wg0.conf
umask 077
wg genkey > /etc/wireguard/server.key
wg pubkey < /etc/wireguard/server.key > /etc/wireguard/server.pub
cat > /etc/wireguard/wg0.conf <<CONF
[Interface]
PrivateKey = $(cat /etc/wireguard/server.key)
Address = 10.8.0.1/24, fd42:8:8::1/64
ListenPort = 51820
PostUp = iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o ens3 -j MASQUERADE
PostDown = iptables -t nat -D POSTROUTING -s 10.8.0.0/24 -o ens3 -j MASQUERADE
CONF
SCRIPT
sudo cat /etc/wireguard/server.pub
```

脚本直接把私钥写入权限为 `600` 的配置文件，最后只显示公钥。`server.key` 和 `wg0.conf` 都含秘密，不要复制进公开文章或聊天。

```bash
sudo chmod 600 /etc/wireguard/wg0.conf
sudo systemctl enable --now wg-quick@wg0
sudo wg show wg0
ip address show wg0
```

`wg show` 应能看到接口、公钥和监听端口。现在没有客户端握手是正常的。服务端密钥生成方式见 [wireguard 快速开始](https://www.wireguard.com/quickstart/)，转发和 nat 的关系见 [ubuntu 默认网关教程](https://ubuntu.com/server/docs/how-to/wireguard-vpn/vpn-as-the-default-gateway/)。

不要设置 `SaveConfig = true`：本文以磁盘配置为准，避免停服务时把运行状态写回并覆盖手工编辑。

## 五、部署 dnsmasq 与域名日志

### 1. 仅在 vpn 地址提供 dns

```bash
sudo apt install dnsmasq
sudo systemctl stop dnsmasq
sudo tee /etc/dnsmasq.d/wireguard.conf >/dev/null <<'EOF'
listen-address=10.8.0.1
bind-dynamic
no-resolv
server=1.1.1.1
server=9.9.9.9
cache-size=1000
log-queries=extra
log-facility=/var/log/dnsmasq.log
log-async=25
user=dnsmasq
group=dnsmasq
EOF
sudo touch /var/log/dnsmasq.log
sudo chown dnsmasq:adm /var/log/dnsmasq.log
sudo chmod 640 /var/log/dnsmasq.log
sudo install -d /etc/systemd/system/dnsmasq.service.d
sudo tee /etc/systemd/system/dnsmasq.service.d/wireguard.conf >/dev/null <<'EOF'
[Unit]
Requires=wg-quick@wg0.service
After=wg-quick@wg0.service

[Service]
Environment=LC_ALL=C
Environment=TZ=UTC
EOF
sudo dnsmasq --test
```

这是新机专用配置，确认 `/etc/dnsmasq.conf` 与其他 `.d` 文件没有额外 `interface`、`listen-address`、dhcp 或日志配置。安装过程中若提示默认 dnsmasq 启动失败，先确认软件包已安装，再按上面的配置完成语法检查。不要通过关闭 `systemd-resolved` 解决端口问题：它可以继续监听自己的回环地址，dnsmasq 只监听 `10.8.0.1`。

上面两台公共 dns 是示例上游，也会接收转发的查询；可换成自己信任且从 vps 可达的递归解析器。这里没有启用 dnssec 验证，也没有宣称上游链路加密。

语法检查成功后：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now dnsmasq
sudo systemctl is-active wg-quick@wg0 dnsmasq
sudo ss -lntup | grep -E '(:53|:51820)\b'
dig @10.8.0.1 example.com
sudo tail -n 20 /var/log/dnsmasq.log
```

dnsmasq 的 tcp/udp 53 应绑定 `10.8.0.1`，不能是 `0.0.0.0:53` 或 `[::]:53`。日志含查询、转发、缓存命中和响应等多种行，后面的导出脚本只提取 `query[...]` 查询行。[dnsmasq 官方手册](https://thekelleys.org.uk/dnsmasq/docs/dnsmasq-man.html)说明了绑定和日志选项。

### 2. 按天轮转，目标保留约 14 天

先查看发行版已有的轮转文件：

```bash
sudo cat /etc/logrotate.d/dnsmasq
sudo grep -R '/var/log/dnsmasq.log' /etc/logrotate.d
```

在本教程的新机上，把 `/etc/logrotate.d/dnsmasq` 改为下面内容；不要再增加第二份匹配同一路径的规则。

```bash
sudo tee /etc/logrotate.d/dnsmasq >/dev/null <<'EOF'
/var/log/dnsmasq.log {
    daily
    rotate 13
    maxage 14
    missingok
    ifempty
    compress
    delaycompress
    create 0640 dnsmasq adm
    sharedscripts
    postrotate
        if /usr/bin/systemctl is-active --quiet dnsmasq.service; then
            /usr/bin/systemctl kill --kill-who=main --signal=SIGUSR2 dnsmasq.service
        fi
    endscript
}
EOF
sudo logrotate --debug /etc/logrotate.conf
sudo systemctl enable --now logrotate.timer
systemctl list-timers logrotate.timer
```

正常每天运行一次时，当前文件加 13 份归档覆盖约 14 天。**这是按日轮转的保留策略，不是逐条记录精确到 336 小时的删除保证**；停机、定时器延迟或手工强制轮转会改变实际时间跨度。`ifempty` 让没有新查询的日期也轮转，避免旧文件一直留在原位。导出脚本还会按时间过滤最近 14 天。

第一次配置后可执行一次 `sudo logrotate --force /etc/logrotate.d/dnsmasq`，再发起一次 dns 查询，确认新日志继续增长且旧日志存在。不要反复强制轮转来模拟天数。

使用 `SIGUSR2` 重新打开日志并延迟压缩，遵循 [dnsmasq 日志轮转说明](https://thekelleys.org.uk/dnsmasq/docs/dnsmasq-man.html)；轮转条件见 [ubuntu 的 logrotate 手册](https://manpages.ubuntu.com/manpages/noble/man8/logrotate.8.html)。日志留在磁盘，仍需检查 `df -h /` 和 `sudo du -ch /var/log/dnsmasq.log*`；每天轮转不等于单日文件有硬性容量上限。

## 六、配置 windows 11

### 1. 在设备上生成自己的密钥

从 [wireguard 官方安装页](https://www.wireguard.com/install/)下载 windows 客户端。打开后选择添加空隧道，命名为 `me-windows`。客户端会生成密钥，保留界面中的 `PrivateKey`，只把显示的公钥复制到服务器。

客户端配置如下。替换服务端公钥和公网 ip，私钥保留客户端已经生成的真实值：

```ini
[Interface]
PrivateKey = <保留本机自动生成的私钥>
Address = 10.8.0.2/32, fd42:8:8::2/128
DNS = 10.8.0.1

[Peer]
PublicKey = <server.pub 的内容>
Endpoint = 203.0.113.10:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
```

### 2. 把 windows 公钥加入服务器

在 vps 执行 `sudo nano /etc/wireguard/wg0.conf`，追加：

```ini
# me-windows
[Peer]
PublicKey = <windows 客户端公钥>
AllowedIPs = 10.8.0.2/32, fd42:8:8::2/128
```

保存后应用配置。使用同步命令更新 peer，避免重启整个隧道影响其他设备：

```bash
sudo bash -c 'wg syncconf wg0 <(wg-quick strip wg0)'
sudo wg show wg0
```

服务端给每台设备分配准确的 `/32` 和 `/128`，不要把整个网段授权给单台设备。同步方式来自 [wg-quick 手册](https://github.com/WireGuard/wireguard-tools/blob/master/src/man/wg-quick.8)。

### 3. 启动并验证

在 windows 激活隧道，然后执行：

```powershell
Resolve-DnsName example.com -Server 10.8.0.1
ssh -i "$env:USERPROFILE\.ssh\racknerd_admin" vpnadmin@10.8.0.1
curl.exe -4 https://icanhazip.com
curl.exe -6 --max-time 10 https://icanhazip.com
```

ipv4 查询应显示 vps 的公网地址；在本文 ipv4-only 出口方案下，ipv6 查询应失败，而不是显示家庭网络地址。查询公网地址会把连接来源暴露给该查询网站，也可以使用你自己信任的地址检测服务。

进入 `10.8.0.1` 的 ssh 会话后，运行 `sudo wg show wg0`，确认握手时间和收发量变化，并检查 dns 日志中的来源是 `10.8.0.2`。

官方 windows 客户端对单 peer 的 `/0` 默认路由有额外的防火墙和 dns 限制，见 [windows 网络行为说明](https://git.zx2c4.com/wireguard-windows/about/docs/netquirk.md)。不要为了访问局域网随意改成两条 `/1` 路由，那会改变该保护行为。使用 wsl、其他 vpn 或浏览器加密 dns 时，要分别检查它们实际走的路由。

## 七、配置 iphone

1. 通过 [wireguard 官方安装页](https://www.wireguard.com/install/)进入 app store 安装客户端。
2. 在应用中新建空隧道，命名为 `me-iphone`，生成独立密钥。
3. 填写接口地址 `10.8.0.3/32, fd42:8:8::3/128`，dns 为 `10.8.0.1`。
4. 添加 peer：服务端公钥、真实公网 ip 加 `:51820`、允许地址 `0.0.0.0/0, ::/0`、持久保活 25 秒。
5. 把 iphone 的公钥交给管理员，私钥留在手机上。

服务器追加：

```ini
# me-iphone
[Peer]
PublicKey = <iphone 客户端公钥>
AllowedIPs = 10.8.0.3/32, fd42:8:8::3/128
```

使用上一节的同步命令应用。随后在 iphone 启用隧道，分别在 wi-fi 和蜂窝网络下测试网页访问、出口地址、dns 日志中的 `10.8.0.3` 以及 ipv6 行为。

只复制公钥不涉及连接秘密；若选择导入完整配置或二维码，里面含私钥，应当按密码保管，不放进截图、公开文章或多人群聊。不要让 windows 与 iphone 共用同一份配置。

按需连接可以在客户端中设置，但不把它当作已验证的永久防断线机制。iphone 的加密 dns 描述文件、其他 vpn、隐私相关网络功能可能影响查询路径；以实际日志和出口测试为准。

## 八、确认 vpn 可管理后，再关闭公网 ssh

**先确保 windows 能通过 `10.8.0.1` 新建 ssh 连接，且供应商控制台可登录。** 在这个 vpn 内 ssh 会话中执行：

```bash
ADMIN_IP='198.51.100.25' # 与最初 temporary-admin 规则完全相同
sudo ufw delete allow from "$ADMIN_IP" to any port 22 proto tcp
sudo ufw status numbered
```

如果实际规则不同，根据 `ufw status numbered` 只删除对应的临时公网规则。供应商网络防火墙中也删除公网 ssh 入站许可，最终只留 51820/udp 入站。不要添加 `ufw allow 22` 或 `ufw allow 53` 这样的全网放行规则。

从断开 vpn 的设备新建公网 ssh 连接，应失败；重新启用 vpn，通过 `10.8.0.1` 登录应成功。已有公网 ssh 连接可能因连接跟踪暂时保留，不能拿旧会话仍在线判断关闭失败。

ssh 服务可能仍显示监听 `0.0.0.0:22`，这是进程监听范围；公网是否能建立新连接还取决于防火墙。这里由防火墙限制访问，避免 ssh 绑定 `wg0` 地址造成启动先后顺序问题。

如果以后 vpn 失效，通过供应商控制台检查 `wg-quick@wg0`、dnsmasq 和 ufw。确实需要临时恢复公网 ssh 时，仅放行自己当前来源地址，恢复 vpn 后删掉这条规则，不要整体关闭防火墙。

## 九、临时授权与永久撤销

### 1. 给访客添加独立设备

让访客在自己的客户端生成密钥并提供公钥。分配 `guest-b` 为 `10.8.0.4`，将对应配置加入服务端：

```ini
# guest-b
[Peer]
PublicKey = <guest-b 公钥>
AllowedIPs = 10.8.0.4/32, fd42:8:8::4/128
```

客户端仍用相同服务端公钥、endpoint、dns 和默认路由，但使用它自己的私钥及 `.4` 地址。执行同步命令后，测试访客能解析域名及上网，不能连接 `10.8.0.1:22`，也不能访问其他客户端。

`guest-c` 使用 `.5` 和独立公钥。不要创建访客 linux 登录账号，不把管理员 ssh 密钥交给别人。

原生 wireguard 没有用户名密码登录或内置到期字段。本文的“临时”表示管理员按需添加和手动撤销；它不会到期自动失效。记录计划撤销时间，按时执行下一步。

### 2. 同时删除运行态与持久化配置

若要立即撤销 `guest-b`，先执行：

```bash
sudo wg set wg0 peer '<guest-b 公钥>' remove
sudo nano /etc/wireguard/wg0.conf
```

删除 `guest-b` 的完整 `[Peer]` 段，保留管理员及其他设备的段。保存后再次同步并检查：

```bash
sudo bash -c 'wg syncconf wg0 <(wg-quick strip wg0)'
sudo wg show wg0 peers
sudo grep -F '<guest-b 公钥>' /etc/wireguard/wg0.conf
```

运行态 peer 列表不应有该公钥，最后的 `grep` 应无匹配。让访客保持原配置重试连接，确认无法继续通过隧道传输。**只执行 `wg set ... remove` 而不改文件，重启后会重新授权。**

设备丢失或配置泄漏时，撤销旧公钥，重新生成一对密钥，不要重新授权已经泄漏的私钥。不要把一个设备地址重新分配给另一个人而不更新审计映射；本文导出脚本假定保留周期内设备与地址对应关系不变。

## 十、导出最近 14 天的 dns 查询为 csv

### 1. 安装导出脚本

在 vps 上执行 `sudo nano /usr/local/sbin/export-dns-audit.py`，粘贴下面代码。脚本只使用 python 标准库，不安装数据库或额外 python 包。

它同时读取当前日志、未压缩归档和 `.gz` 归档；仅导出查询行，保留查询类型，避免把转发和响应误当成多次访问。文件按时间排序，但不会把原本多次查询去重。

```python
#!/usr/bin/env python3
import csv
import gzip
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

DEVICES = {
    "10.8.0.2": "me-windows",
    "10.8.0.3": "me-iphone",
    "10.8.0.4": "guest-b",
    "10.8.0.5": "guest-c",
}
MONTHS = {name: i for i, name in enumerate(
    "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(), 1
)}
QUERY = re.compile(
    r"^(?P<month>[A-Z][a-z]{2})\s+(?P<day>\d{1,2})\s+"
    r"(?P<clock>\d{2}:\d{2}:\d{2})\s+dnsmasq\[\d+\]:\s+"
    r".*?query\[(?P<kind>[^\]]+)\]\s+(?P<domain>\S+)\s+"
    r"from\s+(?P<ip>\S+)\s*$"
)


def parse_query(line, now):
    match = QUERY.match(line)
    if not match or match["ip"] not in DEVICES:
        return None
    hours, minutes, seconds = map(int, match["clock"].split(":"))
    # dnsmasq 文件日志没有年份。只处理近期日志，跨年时选最近的过去日期。
    candidates = []
    for year in (now.year, now.year - 1):
        try:
            stamp = datetime(
                year, MONTHS[match["month"]], int(match["day"]),
                hours, minutes, seconds, tzinfo=timezone.utc,
            )
        except (ValueError, KeyError):
            continue
        if stamp <= now:
            candidates.append(stamp)
    if not candidates:
        return None
    stamp = max(candidates)
    if stamp < now - timedelta(days=14):
        return None
    return (stamp.isoformat(), match["ip"], DEVICES[match["ip"]],
            match["kind"], match["domain"])


def spreadsheet_text(value):
    # dns 名称是外部输入，防止被电子表格解释成公式。
    return "'" + value if value.startswith(("=", "+", "-", "@", "\t", "\r", "\n")) else value


def main():
    now = datetime.now(timezone.utc)
    files = list(Path("/var/log").glob("dnsmasq.log*"))
    if not files:
        raise SystemExit("没有找到 dnsmasq 日志，请先检查服务和日志路径。")
    files.sort(key=lambda path: (path.stat().st_mtime, path.name))
    # utf-8 BOM 方便 windows 电子表格识别；逐行处理，避免占用大量内存。
    sys.stdout.reconfigure(encoding="utf-8-sig", newline="")
    writer = csv.writer(sys.stdout)
    writer.writerow(["time_utc", "vpn_ip", "device", "query_type", "domain"])
    count = 0
    for path in files:
        opener = gzip.open if path.suffix == ".gz" else open
        with opener(path, "rt", encoding="utf-8") as stream:
            for line in stream:
                row = parse_query(line.rstrip("\n"), now)
                if row:
                    writer.writerow(map(spreadsheet_text, row))
                    count += 1
    print(f"已导出 {count} 条查询。", file=sys.stderr)


if __name__ == "__main__":
    main()
```

设置权限并进行语法检查：

```bash
sudo chown root:root /usr/local/sbin/export-dns-audit.py
sudo chmod 750 /usr/local/sbin/export-dns-audit.py
sudo python3 -m py_compile /usr/local/sbin/export-dns-audit.py
```

年份推断依赖本教程的 utc 时间、正常校时和短期轮转。不要把多年旧备份放回日志目录后运行这个脚本，否则无年份日志无法可靠还原年代。未知设备地址不会导出；新增设备时同步修改 `DEVICES`，撤销设备后暂时保留它的映射用于历史查询。

### 2. 生成并下载

在通过 vpn 登录的 `vpnadmin` 会话中执行：

```bash
umask 077
sudo python3 /usr/local/sbin/export-dns-audit.py > "$HOME/dns-audit.csv"
head -n 5 "$HOME/dns-audit.csv"
```

确认命令成功后，再在 windows powershell 下载：

```powershell
scp -i "$env:USERPROFILE\.ssh\racknerd_admin" vpnadmin@10.8.0.1:dns-audit.csv .\dns-audit.csv
Import-Csv .\dns-audit.csv | Select-Object -First 5
```

在本地确认文件可读后，删除服务器上的导出副本：

```bash
rm -- "$HOME/dns-audit.csv"
```

本地 csv 也包含使用记录，需要自行限制访问并按约定删除；服务器上的 logrotate 不会替你清理下载副本。不要把 csv 放进博客仓库。

例如下面是一行合成日志，不是真实用户记录：

```text
Nov  8 06:00:00 dnsmasq[1234]: 7 10.8.0.4/53000 query[A] example.com from 10.8.0.4
```

在 2026-11-08 导出时，对应结果为：

```csv
time_utc,vpn_ip,device,query_type,domain
2026-11-08T06:00:00+00:00,10.8.0.4,guest-b,A,example.com
```

## 十一、使用前逐项验收

下面所有项目都需要在真正部署后执行，不能因为文档或脚本静态检查通过就直接打勾。

- [ ] windows 与 iphone 分别完成握手，家庭宽带和蜂窝网络都能使用。
- [ ] ipv4 出口为 vps 公网地址；ipv6 没有从本地网络绕行。
- [ ] 显式向 `10.8.0.1` 查询能找到对应设备日志；普通浏览器访问也有合理的查询记录。
- [ ] 理解加密 dns、缓存和预取的限制，已告知临时用户。
- [ ] vpn 内管理员 ssh 正常，访客无法访问管理端口或其他客户端。
- [ ] 从 vpn 外新建公网 ssh 和 dns 查询失败；供应商及主机防火墙只开放预期端口。
- [ ] 删除访客运行态和磁盘配置后，原客户端不能继续传输。
- [ ] logrotate 调试检查通过，强制轮转一次后新日志仍增长。
- [ ] csv 可导出和下载，设备映射正确，服务器导出副本已清理。
- [ ] 在控制台可用、没有重要连接时安排重启，确认服务自动恢复，已撤销设备没有回来。

服务端常用只读检查：

```bash
sudo wg show
sudo systemctl --no-pager --full status wg-quick@wg0 dnsmasq
sudo journalctl -u wg-quick@wg0 -u dnsmasq -n 50 --no-pager
sudo ufw status verbose
sudo ss -lntup
free -h
df -h /
```

`wg show` 的流量计数不是按月计费数据库，重启或重建接口会重置相关状态；套餐用量以供应商面板为准。udp 扫描的 `open|filtered` 不能单独证明 wireguard 可用，实际握手才是更直接的证据。

| 现象 | 优先检查 |
| --- | --- |
| 完全不握手 | endpoint、公钥是否贴错、供应商与 ufw 的 udp 51820、当地网络是否允许 udp |
| 握手成功但不能上网 | `net.ipv4.ip_forward`、真实出口网卡、nat 规则、ufw 转发规则 |
| 能访问 ip 但域名不通 | dnsmasq 服务、53 的监听地址、客户端 dns、上游可达性 |
| 有网络却看不到浏览器查询 | 缓存、浏览器加密 dns、查询是否经过本隧道；先做显式 dns 查询 |
| 大页面卡住、小请求正常 | 实测路径 mtu，必要时在客户端设 `MTU = 1380` 后重测，不先改一堆参数 |
| 关闭公网 ssh 后无法管理 | 使用供应商控制台恢复 wireguard 或仅临时允许自己的来源地址 |

## 十二、日常维护

定期检查 ubuntu 安全更新、磁盘剩余空间和供应商流量用量。升级或重启前确认控制台可用，升级后复查连接与日志。备份 `/etc/wireguard/` 和必要的服务配置时使用加密存储：其中包含服务器私钥，不能上传到公开仓库。

这套方案的目标是少量设备的低成本加密连接和有限的域名查询记录。给其他人使用前，核对实际用途、所在地要求及服务商条款；购买 vps 不会自动取得第三方服务的使用资格。
