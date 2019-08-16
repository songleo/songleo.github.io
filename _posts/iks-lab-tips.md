# 环境准备

访问`https://cloudshell-console-ikslab.us-south.cf.cloud.ibm.com/`进入cloudshell，输入`ikslab`进入，点击右上角进入终端：


如果需要登陆，执行以下命令：

```
ibmcloud login --sso
```

获取集群信息：


```
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~$ export MYCLUSTER=ssli-iks-demo
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~$ ibmcloud ks cluster-get $MYCLUSTER
Retrieving cluster ssli-iks-demo...
OK


Name:                           ssli-iks-demo
ID:                             bl3rp9gd07g2n97e4d80
State:                          normal
Created:                        2019-08-05T05:21:12+0000
Location:                       hou02
Master URL:                     https://c5.dal12.containers.cloud.ibm.com:22945
Public Service Endpoint URL:    https://c5.dal12.containers.cloud.ibm.com:22945
Private Service Endpoint URL:   -
Master Location:                Dallas
Master Status:                  Ready (1 week ago)
Master State:                   deployed
Master Health:                  normal
Ingress Subdomain:              -
Ingress Secret:                 -
Workers:                        1
Worker Zones:                   hou02
Version:                        1.13.8_1529
Owner:                          lssongg@cn.ibm.com
Monitoring Dashboard:           -
Resource Group ID:              19561fba284c49b7b04aa63965580d65
Resource Group Name:            Default
```

下载集群配置文件：

```
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~$ ibmcloud ks cluster-config $MYCLUSTER
OK
The configuration for ssli-iks-demo was downloaded successfully.

Export environment variables to start using Kubernetes.

export KUBECONFIG=/usr/shared-data/cloud-ibm-com-716e67d696854a799fb7eb0b4e999651-1/.bluemix/plugins/container-service/clusters/ssli-iks-demo/kube-config-hou02-ssli-iks-demo.yml

lssongg@cloudshell-1-7b94c8d8f-fdlhr:~$ export KUBECONFIG=/usr/shared-data/cloud-ibm-com-716e67d696854a799fb7eb0b4e999651-1/.bluemix/plugins/container-service/clusters/ssli-iks-demo/kube-config-hou02-ssli-iks-demo.yml
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~$ kubectl get no
NAME            STATUS   ROLES    AGE   VERSION
10.76.196.104   Ready    <none>   11d   v1.13.8+IKS
```


# lab1

如果没有登陆到ibmcloud，执行`ibmcloud login --sso`命令登陆（非联邦账户省略--sso）。

```
wget https://github.com/IBM/container-service-getting-started-wt/archive/master.zip
unzip master.zip
cd container-service-getting-started-wt-master/
cd Lab\ 1/
ibmcloud cr login
ibmcloud cr namespace-add ssli-iks-demo
docker build --tag us.icr.io/ssli-iks-demo/hello-world . # cloudshell上面编译镜像有问题
docker pull songleo/hello-world
docker tag songleo/hello-world us.icr.io/ssli-iks-demo/hello-world
docker images
docker push us.icr.io/ssli-iks-demo/hello-world
ibmcloud cs clusters
ibmcloud cs workers ssli-iks-demo
kubectl run hello-world --image=us.icr.io/ssli-iks-demo/hello-world
kubectl get deploy
kubectl get po
kubectl describe po hello-world-86854bf45c-4vvj9
kubectl expose deployment/hello-world --type="NodePort" --port=8080
kubectl get svc hello-world
kubectl describe service hello-world
ibmcloud cs workers ssli-iks-demo
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ kubectl describe service hello-world
Name:                     hello-world
Namespace:                default
Labels:                   run=hello-world
Annotations:              <none>
Selector:                 run=hello-world
Type:                     NodePort
IP:                       172.21.132.104
Port:                     <unset>  8080/TCP
TargetPort:               8080/TCP
NodePort:                 <unset>  30541/TCP
Endpoints:                172.30.169.5:8080
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ ibmcloud cs workers ssli-iks-demo
OK
ID                                                       Public IP         Private IP      Machine Type   State    Status   Zone    Version
kube-bl3rp9gd07g2n97e4d80-ssliiksdemo-default-000000d8   184.172.242.146   10.76.196.104   free           normal   Ready    hou02   1.13.8_1529*

* To update to 1.13.8_1530 version, run 'ibmcloud ks worker-update'. Review and make any required version changes before you update: ibm.biz/upworker
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ curl 184.172.242.146:30541
Hello world from hello-world-86854bf45c-4vvj9! Your app is up and running in a cluster!
```
