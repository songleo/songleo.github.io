# 环境准备

访问`https://cloudshell-console-ikslab.us-south.cf.cloud.ibm.com/`进入cloudshell，输入`ikslab`进入，点击右上角进入终端，选择IBM，具体步骤参考：https://irisdingbj-shaojun.gitbook.io/istiolab/00-setupcluster

注意，在cloudshell中直接使用docker命令build镜像会有错误。需要替换成一下命令：

- ibmcloud cr build 替代 docker build
- ibmcloud cr images 替代 docker images

获取集群信息：

```
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~$ export MYCLUSTER=jtc-workshop02
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~$ ibmcloud ks cluster-get $MYCLUSTER
Retrieving cluster jtc-workshop02...
OK


Name:                           jtc-workshop02
ID:                             blbhffrs0i9789thbv30
State:                          normal
Created:                        2019-08-16T20:54:28+0000
Location:                       syd01
Master URL:                     https://c2.au-syd.containers.cloud.ibm.com:31716
Public Service Endpoint URL:    https://c2.au-syd.containers.cloud.ibm.com:31716
Private Service Endpoint URL:   -
Master Location:                Sydney
Master Status:                  Ready (12 hours ago)
Master State:                   deployed
Master Health:                  normal
Ingress Subdomain:              jtc-workshop02.au-syd.containers.appdomain.cloud
Ingress Secret:                 jtc-workshop02
Workers:                        3
Worker Zones:                   syd01
Version:                        1.13.9_1532
Owner:                          Mike.Petersen@ibm.com
Monitoring Dashboard:           -
Resource Group ID:              5eb57fd577b64b51beb832c2e9d5287a
Resource Group Name:            Default
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~$ ibmcloud ks cluster-config $MYCLUSTER
OK
The configuration for jtc-workshop02 was downloaded successfully.

Export environment variables to start using Kubernetes.

export KUBECONFIG=/usr/shared-data/cloud-ibm-com-e2b54d0c3bbe4180b1ee63a0e2a7aba4-1/.bluemix/plugins/container-service/clusters/jtc-workshop02/kube-config-syd01-jtc-workshop02.yml

lssongg@cloudshell-1-7b94c8d8f-fdlhr:~$ export KUBECONFIG=/usr/shared-data/cloud-ibm-com-e2b54d0c3bbe4180b1ee63a0e2a7aba4-1/.bluemix/plugins/container-service/clusters/jtc-workshop02/kube-config-syd01-jtc-workshop02.yml
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~$ kubectl get no
NAME           STATUS   ROLES    AGE   VERSION
10.138.95.53   Ready    <none>   12h   v1.13.8+IKS
10.138.95.55   Ready    <none>   12h   v1.13.8+IKS
10.138.95.56   Ready    <none>   12h   v1.13.8+IKS
```


# lab1

主要完成容器镜像的build和push，并kubernetes集群中将镜像运行起来。

```
wget https://github.com/IBM/container-service-getting-started-wt/archive/master.zip
unzip master.zip
cd container-service-getting-started-wt-master/
cd Lab\ 1/
ibmcloud cr login
ibmcloud cr namespace-add jtc-workshop02
ibmcloud cr build --tag songleo/hello-world . # cloudshell上面编译镜像有问题，有问题就使用songleo/hello-world
ibmcloud cr images
ibmcloud cs clusters
ibmcloud cs workers jtc-workshop02
kubectl run hello-world --image=songleo/hello-world
kubectl get deploy
kubectl get po
kubectl describe po hello-world-86854bf45c-4vvj9
kubectl expose deployment/hello-world --type="NodePort" --port=8080
kubectl get svc hello-world
kubectl describe service hello-world
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ kubectl describe service hello-world
Name:                     hello-world
Namespace:                default
Labels:                   run=hello-world
Annotations:              <none>
Selector:                 run=hello-world
Type:                     NodePort
IP:                       172.21.122.52
Port:                     <unset>  8080/TCP
TargetPort:               8080/TCP
NodePort:                 <unset>  30047/TCP
Endpoints:                172.30.39.138:8080
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ ibmcloud cs workers jtc-workshop02
OK
ID                                                       Public IP      Private IP     Machine Type         State    Status   Zone    Version
kube-blbhffrs0i9789thbv30-jtcworkshop-default-000001de   168.1.192.70   10.138.95.53   b3c.4x16.encrypted   normal   Ready    syd01   1.13.8_1530
kube-blbhffrs0i9789thbv30-jtcworkshop-default-000002a1   168.1.192.71   10.138.95.55   b3c.4x16.encrypted   normal   Ready    syd01   1.13.8_1530
kube-blbhffrs0i9789thbv30-jtcworkshop-default-0000037b   168.1.192.68   10.138.95.56   b3c.4x16.encrypted   normal   Ready    syd01   1.13.8_1530
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ curl 168.1.192.70:30047
Hello world from hello-world-6f89cb5c5-7kmms! Your app is up and running in a cluster!
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ curl 168.1.192.71:30047
Hello world from hello-world-6f89cb5c5-7kmms! Your app is up and running in a cluster!
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ curl 168.1.192.68:30047
Hello world from hello-world-6f89cb5c5-7kmms! Your app is up and running in a cluster!
```

# lab2

修改replicas为10。

```
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ kubectl edit deployment/hello-world && kubectl rollout status deployment/hello-world
deployment.extensions/hello-world edited
Waiting for deployment "hello-world" rollout to finish: 1 of 10 updated replicas are available...
Waiting for deployment "hello-world" rollout to finish: 2 of 10 updated replicas are available...
Waiting for deployment "hello-world" rollout to finish: 3 of 10 updated replicas are available...
Waiting for deployment "hello-world" rollout to finish: 4 of 10 updated replicas are available...
Waiting for deployment "hello-world" rollout to finish: 5 of 10 updated replicas are available...
Waiting for deployment "hello-world" rollout to finish: 6 of 10 updated replicas are available...
Waiting for deployment "hello-world" rollout to finish: 7 of 10 updated replicas are available...
Waiting for deployment "hello-world" rollout to finish: 8 of 10 updated replicas are available...
Waiting for deployment "hello-world" rollout to finish: 9 of 10 updated replicas are available...
deployment "hello-world" successfully rolled out
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ kubectl get po
NAME                          READY   STATUS    RESTARTS   AGE
hello-world-6f89cb5c5-54h9p   1/1     Running   0          25s
hello-world-6f89cb5c5-6vr99   1/1     Running   0          25s
hello-world-6f89cb5c5-7kmms   1/1     Running   0          14m
hello-world-6f89cb5c5-7ktxk   1/1     Running   0          25s
hello-world-6f89cb5c5-8pc92   1/1     Running   0          25s
hello-world-6f89cb5c5-9n65l   1/1     Running   0          25s
hello-world-6f89cb5c5-nb5xr   1/1     Running   0          25s
hello-world-6f89cb5c5-r4lqj   1/1     Running   0          25s
hello-world-6f89cb5c5-sj7tm   1/1     Running   0          25s
hello-world-6f89cb5c5-w7c99   1/1     Running   0          25s
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ curl 168.1.192.68:30047
Hello world from hello-world-6f89cb5c5-bbmmm! Your app is up and running in a cluster!
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ curl 168.1.192.68:30047
Hello world from hello-world-6f89cb5c5-rws2w! Your app is up and running in a cluster!
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ curl 168.1.192.68:30047
Hello world from hello-world-6f89cb5c5-pht9l! Your app is up and running in a cluster!
```

```
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 1$ kubectl set image deployment/hello-world hello-world=songleo/hello-world:2 && kubectl rollout status deployment/hello-world
deployment.extensions/hello-world image updated
Waiting for deployment "hello-world" rollout to finish: 5 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 5 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 5 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 5 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 6 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 6 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 6 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 6 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 7 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 7 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 7 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 7 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 8 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 8 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 8 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 8 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 9 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 9 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 9 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 9 out of 10 new replicas have been updated...
Waiting for deployment "hello-world" rollout to finish: 3 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 3 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 3 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 2 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 2 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 2 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 8 of 10 updated replicas are available...
Waiting for deployment "hello-world" rollout to finish: 9 of 10 updated replicas are available...
deployment "hello-world" successfully rolled out

kubectl get po
kubectl describe po hello-world-6b875
curl 168.1.192.68:30047
kubectl rollout undo deployment/hello-world
```

进入Lab 2目录，将实验2中的healthcheck.yml文件的镜像修改正songleo/hello-world:2

```
kubectl apply -f healthcheck.yml
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 2$ curl 168.1.192.68:30072
Hello world from hw-demo-deployment-7d8cd54947-lvlqx! Great job getting the second stage up and running!
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 2$ curl 168.1.192.68:30072
Hello world from hw-demo-deployment-7d8cd54947-pq2dc! Great job getting the second stage up and running!
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 2$ curl 168.1.192.68:30072
Hello world from hw-demo-deployment-7d8cd54947-lmr92! Great job getting the second stage up and running!
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 2$ curl 168.1.192.68:30072
Hello world from hw-demo-deployment-7d8cd54947-pq2dc! Great job getting the second stage up and running!
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 2$ curl 168.1.192.68:30072
Hello world from hw-demo-deployment-7d8cd54947-lvlqx! Great job getting the second stage up and running!
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 2$ curl 168.1.192.68:30072
Hello world from hw-demo-deployment-7d8cd54947-pq2dc! Great job getting the second stage up and running!
```
将replicas改为1，再去访问。

```
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 2$ curl 168.1.192.68:30072
Hello world from hw-demo-deployment-7d8cd54947-lvlqx! Great job getting the second stage up and running!
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 2$ curl 168.1.192.68:30072
Hello world from hw-demo-deployment-7d8cd54947-lvlqx! Great job getting the second stage up and running!
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 2$ curl 168.1.192.68:30072
curl: (7) Failed to connect to 168.1.192.68 port 30072: Connection refused
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~/container-service-getting-started-wt-master/Lab 2$ curl 168.1.192.68:30072
curl: (7) Failed to connect to 168.1.192.68 port 30072: Connection refused
```


# lab3

修改镜像为songleo/watson和songleo/watson-talk（必须使用自己的免费集群才可以做该实验）

```
ibmcloud target --cf
ibmcloud account org-create jtc-workshop02
ibmcloud account space-create jtc-workshop02 -o jtc-workshop02
ibmcloud cf create-service tone_analyzer standard tone
lssongg@cloudshell-1-7b94c8d8f-fdlhr:~$ ibmcloud cf services
Invoking 'cf services'...

Getting services in org jtc-workshop02 / space jtc-workshop02 as lssongg@cn.ibm.com...

name   service         plan       bound apps   last operation
tone   tone_analyzer   standard                create succeeded

ibmcloud cs cluster-service-bind ssli-iks-demo default tone
ibmcloud cs cluster-service-bind jtc-workshop02 default tone
ibmcloud cs clusters
ibmcloud ks cluster-config ssli-iks-demo
kubectl apply -f watson-deployment.yml

kubectl get pods
kubectl get deployments
kubectl get services

ibmcloud cs workers ssli-iks-demo

http://184.172.242.146:30080/analyze/"Today is a beautiful day"
http://184.172.242.146:30080/analyze/"Today is a terrible day"
```







