## [ClusterPool](https://github.com/openshift/hive/blob/master/docs/clusterpools.md)

### Overview

用于维护一个集群pool，方便快速（2-5mins）的创建一个cluster，默认情况下创建的所有集群都是休眠状态，当claimed后，集群才会进入running状态。目前支持aws/azure/gcp。

- ClusterClaim: 使用该API去claim想使用的集群，当claimed后，cluster pool中会将该cluster删除，然后创建一个新的cluster备用，删除ClusterClaim，集群随之删除

- ClusterDeployment: 位于ClusterClaim.Spec.Namespace中，用于获取创建集群的信息，如kubeconfig等

### Usage

创建相应的cloud的secret和pull secret。

```
oc create secret generic acm-observability-china-aws-creds -n acm-observability-china --from-literal=aws_access_key_id=${AWS_ACCESS_KEY_ID} --from-literal=aws_secret_access_key=${AWS_SECRET_ACCESS_KEY}

oc create secret generic acm-observability-china-ocp-pull-secret --from-file=.dockerconfigjson=./pull-secret.txt --type=kubernetes.io/dockerconfigjson --namespace acm-observability-china
```

创建ClusterPool，通过ClusterImageSet获取相应的cluster version（k get clusterimageset）。

```
apiVersion: hive.openshift.io/v1
kind: ClusterPool
metadata:
 name: obs-china-aws-4616
 namespace: acm-observability-china
spec:
 baseDomain: dev05.red-chesterfield.com
 imageSetRef:
   name: img4.6.16-x86-64-appsub
 size: 3
 pullSecretRef:
   name: acm-observability-china-ocp-pull-secret
 platform:
   aws:
     credentialsSecretRef:
       name: acm-observability-china-aws-creds
     region: us-east-1
```

创建ClusterClaim使用集群。

```
apiVersion: hive.openshift.io/v1
kind: ClusterClaim
metadata:
 name: ssli-demo
 namespace: acm-observability-china
spec:
 clusterPoolName: obs-china-aws-4616
 subjects:
 - apiGroup: rbac.authorization.k8s.io
   kind: Group
   name: Core-Services
```

从相应的ClusterDeployment中获取kubeconfig，ClusterDeployment位于ClusterClaim.Spec.Namespace中。

```
k get clusterclaim ssli-demo -o yaml
k get clusterdeployment -n obs-china-aws-4616-s2vzx obs-china-aws-4616-s2vzx -o yaml

oc get secret obs-china-aws-4616-s2vzx-1-d9skg-admin-kubeconfig -n obs-china-aws-4616-s2vzx -o yaml

k get secret obs-china-aws-4616-s2vzx-1-d9skg-admin-kubeconfig -n obs-china-aws-4616-s2vzx -o 'go-template={{index .data "kubeconfig"}}' | base64 --decode > ./kubeconfig

$ k --kubeconfig ./kubeconfig cluster-info
Kubernetes master is running at https://api.obs-china-aws-4616-s2vzx.dev05.red-chesterfield.com:6443

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```

### Other

- 手动休眠集群，修改ClusterDeployment：Hibernating -> Running
- 指定时间删除集群，修改ClusterClaim.Spec.Lifetime
- 定时休眠和唤醒集群：https://github.com/open-cluster-management/hibernate-cronjob


### Ref

- Preparing to Use ACM CICD Shared Infrastructure for ClusterPools: https://docs.google.com/document/d/1rnddo967c3OfSDksIIYddLsRLX6ArEcsLBxzl3lgs4s/edit#heading=h.66y4kqbj468a
- Creating and Using Clusterpools: https://docs.google.com/document/d/194q-8r8x9KpfiUEIWObqDMBwTUvmPGLGeYPuj5mBAtg/edit#
- Cluster Pools: https://github.com/openshift/hive/blob/master/docs/clusterpools.md
- https://github.com/open-cluster-management/hibernate-cronjob
