## install latest operator-sdk

```
wget https://github.com/operator-framework/operator-sdk/releases/download/v1.4.2/operator-sdk_darwin_amd64


operator-sdk init --domain open-cluster-management.io --repo github.com/open-cluster-management/multicluster-monitoring-operator

operator-sdk create api \
    --group=observability \
    --version=v1beta1 \
    --kind=MultiClusterObservability \
    --resource \
    --controller

operator-sdk create api \
    --group=observability \
    --version=v1beta1 \
    --kind=ObservabilityAddon \
    --resource

operator-sdk create api \
    --group=observability \
    --version=v1beta1 \
    --kind=PlacementRule \
    --controller

# migrate old api to new project


make manifests

make
```



## ref

- https://sdk.operatorframework.io/docs/building-operators/golang/migration/
- https://github.com/operator-framework/operator-sdk-samples/tree/master/go/memcached-operator