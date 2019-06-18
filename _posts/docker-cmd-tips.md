## docker覆盖entrypoint

docker run --entrypoint /bin/sh -it -d quay.io/cluster-api-provider-ibmcloud/clusterctl

## 进入docker

docker exec -it 5ed19cf131d5 /bin/sh

## 从docker中拷贝文件到本地

docker cp 5ed19cf131d5:/bin/clusterctl ./