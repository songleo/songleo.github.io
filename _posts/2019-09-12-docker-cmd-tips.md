---
layout: post
title: docker命令tips
date: 2019-09-12 00:12:05
---

- docker覆盖entrypoint

```
docker run --rm --entrypoint /bin/sh -it -d quay.io/cluster-api-provider-ibmcloud/clusterctl
```

- 进入docker

```
docker exec -it 5ed19cf131d5 /bin/sh
```

- 从docker中拷贝文件到本地

```
docker cp 5ed19cf131d5:/bin/clusterctl ./
```

- 清理docker的空间

```
rm -rf /var/lib/docker/volumes/ ; service docker restart
```

- 启动docker并执行命令

```
docker run --rm --entrypoint "" -v ${PWD}:/tmp  quay.io/cluster-api-provider-ibmcloud/clusterctl /bin/sh -c "cp /bin/clusterctl /tmp"
```

- 导出多个img

```
docker save -o images.tar img1:9.6 img2:3.4
docker load -i images.tar
```

- 扫描docker漏洞

```
# 需要安装trivy
trivy registry.access.redhat.com/ubi8/ubi-minimal:latest
```

> :) 未完待续......
