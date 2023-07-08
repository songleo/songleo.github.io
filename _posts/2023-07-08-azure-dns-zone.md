---
layout: post
title: azure dns zone
date: 2023-07-08 00:12:05
---

azure dns zone是azure提供的一项托管服务，用于托管dns域名。dns即“域名系统”，是用于将易于理解的域名转换为机器可理解的ip地址的互联网系统。如果把互联网看作一座巨大的城市，那么dns就像是城市中的路标，而azure dns zone就像是管理这些路标的服务机构。azure dns支持两种类型的dns zone：公有和私有。公有dns zone主要用于在internet上公开你的dns名称。这是dns最常见的用途。任何internet上的用户都可以解析公有dns zone中的dns名称。私有dns zone主要用于在azure虚拟网络内部解析dns名称。只有你的虚拟网络内的用户才能解析私有dns zone中的dns名称。这可以帮助你在虚拟网络内部创建自定义的dns名称，而无需担心这些名称会被internet上的其他用户解析。

主要有以下功能：

- 域名解析：azure dns zone能够将人类可读的网站地址解析为机器可读的ip地址，让你的用户可以通过输入你的网站地址来访问你的网站
- 高可用性：azure dns zone利用全球的任播网络，能够为你提供极高的可用性和性能
- 安全性：azure dns zone提供了dnssec，可以保护你的网站免受dns欺骗攻击

azure dns zone支持多种dns记录类型，包括但不限于：

- a记录：将域名解析为ipv4地址
- aaaa记录：将域名解析为ipv6地址
- cname记录：将一个域名解析为另一个域名，常常用于为服务创建别名
- mx记录：用于指定处理电子邮件的邮件服务器
- ns记录：指定负责特定域的dns服务器
- soa记录：含有关于dns区域的信息，比如区域的主要服务器和管理员的联系信息
- txt记录：包含任何文本的记录，常常用于各种目的，例如验证域名所有权或邮件发送策略

假如我想创建一个我的网站域名的dns zone。azure会为我分配一组ns记录，这些记录指向负责管理你dns区域的azure dns服务器。你需要将这组ns记录添加到你的域名注册商的设置中。另外，在azure dns区域中，你可以添加或修改各种类型的dns记录。以添加a记录和cname记录为例：

添加a记录：a记录将你的域名映射到一个ipv4地址。你可以点击“记录集”，然后在“新建记录集”窗口中填写：

- 名称：可以填写"www"，这将创建一个指向`www.reborncodinglife.com`的a记录
- 类型：选择"a"
- ttl：可以填写3600（单位为秒），这表示dns服务器在刷新此记录前将缓存此记录1小时
- ip地址：填写你的网站服务器的ipv4地址

添加cname记录：cname记录将一个域名映射到另一个域名。比如，你可能希望让用户访问`blog.reborncodinglife.com`时能够跳转到你的博客主页。

- 名称：可以填写"blog"
- 类型：选择"cname"
- ttl：可以填写3600
- 别名：填写你的博客主页的域名

azure dns区域配置完毕，会成功地将域名`reborncodinglife.com`托管在azure dns zone上，并且创建了a记录和cname记录。如果你的网站服务器和dns设置都配置正确的话，现在你的用户就应该能够通过输入`www.reborncodinglife.com`或者`blog.reborncodinglife.com`来访问你的网站了。
