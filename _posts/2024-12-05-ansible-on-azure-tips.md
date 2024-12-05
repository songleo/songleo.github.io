---
layout: post
title: ansible on azure tips
date: 2024-12-05 00:12:05
---

### custom domain

如果需要创建自己的custom domain测试，比如ssli.ansiblecloud.com，先在自己的rg中创建ssli dns zone，然后添加相应的A记录，例如：

```
platform.ssli.ansiblecloud.com 13.85.100.58
```

最后将这个dns zone添加到ansiblecloud.com dns zone。然后文章中步骤：https://access.redhat.com/articles/7019408
