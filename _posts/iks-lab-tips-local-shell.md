https://cloudshell-console-ikslab.us-south.cf.cloud.ibm.com/
ikslab

### 实验环境准备

install ibm cloud cli

```
curl -sL https://ibm.biz/idt-installer | bash
ibmcloud login --sso
ibmcloud plugin install container-service -r Bluemix
ibmcloud plugin install container-registry -r Bluemix
ibmcloud plugin list
curl -sSL -o /usr/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/v1.14.4/bin/linux/amd64/kubectl && chmod +x /usr/bin/kubectl
# install docker
apt-get update
apt-get -y upgrade
apt-get -y install docker.io
kubectl version
docker version
```

### Lab1

```
ibmcloud login --sso
ibmcloud cr login
ibmcloud cr namespace-add ssli-iks-demo
cd Lab1
docker build --tag us.icr.io/ssli-iks-demo/hello-world .
docker images
docker push us.icr.io/ssli-iks-demo/hello-world
ibmcloud cs clusters
ibmcloud cs workers ssli-iks-demo
ibmcloud cs cluster-config ssli-iks-demo
export KUBECONFIG=/Users/ssli/.bluemix/plugins/container-service/clusters/ssli-iks-demo/kube-config-hou02-ssli-iks-demo.yml
kubectl get no
kubectl run hello-world --image=us.icr.io/ssli-iks-demo/hello-world
kubectl get deploy
kubectl get po
kubectl describe po  hello-world-xxxxx
kubectl expose deployment/hello-world --type="NodePort" --port=8080
kubectl get svc hello-world
kubectl describe service hello-world
ibmcloud cs workers ssli-iks-demo
curl 184.172.242.146:30743
```

### Lab2


```
kubectl edit deployment/hello-world && kubectl rollout status deployment/hello-world
docker build --tag us.icr.io/ssli-iks-demo/hello-world:2 .
docker push us.icr.io/ssli-iks-demo/hello-world:2
kubectl set image deployment/hello-world hello-world=us.icr.io/ssli-iks-demo/hello-world:2
kubectl rollout status deployment/hello-world
kubectl get po -w
curl 184.172.242.146:30743
```

```
ssli@sslis-mbp-4:Lab 1$ kubectl edit deployment/hello-world && kubectl rollout status deployment/hello-world
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
ssli@sslis-mbp-4:Lab 1$ kubectl get po
NAME                           READY   STATUS    RESTARTS   AGE
hello-world-86854bf45c-4qdbw   1/1     Running   0          17s
hello-world-86854bf45c-544bx   1/1     Running   0          17s
hello-world-86854bf45c-5dr28   1/1     Running   0          17s
hello-world-86854bf45c-78zsp   1/1     Running   0          17s
hello-world-86854bf45c-8ppt4   1/1     Running   0          12m
hello-world-86854bf45c-f9gkq   1/1     Running   0          17s
hello-world-86854bf45c-lcqw7   1/1     Running   0          17s
hello-world-86854bf45c-vx4lf   1/1     Running   0          17s
hello-world-86854bf45c-w2xfd   1/1     Running   0          17s
hello-world-86854bf45c-ww42t   1/1     Running   0          17s


docker build --tag us.icr.io/ssli-iks-demo/hello-world:1 .
docker push us.icr.io/ssli-iks-demo/hello-world:1
docker build --tag us.icr.io/ssli-iks-demo/hello-world:2 .
docker push us.icr.io/ssli-iks-demo/hello-world:2


ssli@sslis-mbp-4:Lab 1$ kubectl set image deployment/hello-world hello-world=us.icr.io/ssli-iks-demo/hello-world:2
deployment.extensions/hello-world image updated
ssli@sslis-mbp-4:Lab 1$ kubectl rollout status deployment/hello-world
Waiting for deployment "hello-world" rollout to finish: 2 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 2 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 2 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "hello-world" rollout to finish: 8 of 10 updated replicas are available...
Waiting for deployment "hello-world" rollout to finish: 9 of 10 updated replicas are available...
deployment "hello-world" successfully rolled out
ssli@sslis-mbp-4:Lab 1$ kubectl get replicasets -w
NAME                     DESIRED   CURRENT   READY   AGE
hello-world-79dfb7ddd5   10        10        10      26s
hello-world-86854bf45c   0         0         0       20m
^Cssli@sslis-mbp-4:Lab 1$ curl 184.172.242.146:30743
Hello world from hello-world-79dfb7ddd5-rcfvq! Your app is up and running in a cluster!
ssli@sslis-mbp-4:Lab 1$ curl 184.172.242.146:30743
Hello world from hello-world-79dfb7ddd5-hgtvt! Your app is up and running in a cluster!
ssli@sslis-mbp-4:Lab 1$ curl 184.172.242.146:30743
Hello world from hello-world-79dfb7ddd5-mtm8h! Your app is up and running in a cluster!
ssli@sslis-mbp-4:Lab 1$ kubectl describe deploy hello-world


kubectl rollout undo deployment/hello-world
kubectl describe deploy hello-world

cd Lab\ 2/ # 修改镜像为 “us.icr.io/ssli-iks-demo/hello-world:2”, 修改replicas为1
docker build --tag us.icr.io/ssli-iks-demo/hello-world:2 .
docker push us.icr.io/ssli-iks-demo/hello-world:2

ssli@sslis-mbp-4:Lab 2$ curl 184.172.242.146:30072
Hello world from hw-demo-deployment-59f756bf96-f79cq! Great job getting the second stage up and running!
ssli@sslis-mbp-4:Lab 2$ curl 184.172.242.146:30072
Hello world from hw-demo-deployment-59f756bf96-f79cq! Great job getting the second stage up and running!
ssli@sslis-mbp-4:Lab 2$ curl 184.172.242.146:30072
Hello world from hw-demo-deployment-59f756bf96-f79cq! Great job getting the second stage up and running!
ssli@sslis-mbp-4:Lab 2$ curl 184.172.242.146:30072
Hello world from hw-demo-deployment-59f756bf96-f79cq! Great job getting the second stage up and running!
ssli@sslis-mbp-4:Lab 2$ curl 184.172.242.146:30072
Hello world from hw-demo-deployment-59f756bf96-f79cq! Great job getting the second stage up and running!
ssli@sslis-mbp-4:Lab 2$ curl 184.172.242.146:30072
Hello world from hw-demo-deployment-59f756bf96-4rptq! Great job getting the second stage up and running!
ssli@sslis-mbp-4:Lab 2$ curl 184.172.242.146:30072
Hello world from hw-demo-deployment-59f756bf96-4rptq! Great job getting the second stage up and running!



kubectl describe po hw-demo-deployment-59f756bf96-4rptq # 看到容器被重启


# 修改replicas为1

ssli@sslis-mbp-4:Lab 2$ kubectl get po
NAME                                  READY   STATUS             RESTARTS   AGE
hello-world-86854bf45c-6knmg          1/1     Running            0          26m
hello-world-86854bf45c-977rb          1/1     Running            0          26m
hello-world-86854bf45c-9gbtl          1/1     Running            0          26m
hello-world-86854bf45c-dc5nf          1/1     Running            0          26m
hello-world-86854bf45c-kgfvh          1/1     Running            0          26m
hello-world-86854bf45c-nztvm          1/1     Running            0          26m
hello-world-86854bf45c-rc9fq          1/1     Running            0          26m
hello-world-86854bf45c-rq47n          1/1     Running            0          26m
hello-world-86854bf45c-tldxz          1/1     Running            0          26m
hello-world-86854bf45c-x7vfb          1/1     Running            0          26m
hw-demo-deployment-59f756bf96-f79cq   0/1     CrashLoopBackOff   6          10m
ssli@sslis-mbp-4:Lab 2$ kubectl get po -w
NAME                                  READY   STATUS             RESTARTS   AGE
hello-world-86854bf45c-6knmg          1/1     Running            0          26m
hello-world-86854bf45c-977rb          1/1     Running            0          26m
hello-world-86854bf45c-9gbtl          1/1     Running            0          26m
hello-world-86854bf45c-dc5nf          1/1     Running            0          26m
hello-world-86854bf45c-kgfvh          1/1     Running            0          26m
hello-world-86854bf45c-nztvm          1/1     Running            0          26m
hello-world-86854bf45c-rc9fq          1/1     Running            0          26m
hello-world-86854bf45c-rq47n          1/1     Running            0          26m
hello-world-86854bf45c-tldxz          1/1     Running            0          26m
hello-world-86854bf45c-x7vfb          1/1     Running            0          26m
hw-demo-deployment-59f756bf96-f79cq   0/1     CrashLoopBackOff   6          10m
NAME                                  READY   STATUS             RESTARTS   AGE
hw-demo-deployment-59f756bf96-f79cq   1/1     Running            7          10m
^Cssli@sslis-mbp-4:Lab 2$
ssli@sslis-mbp-4:Lab 2$ curl 184.172.242.146:30072
Hello world from hw-demo-deployment-59f756bf96-f79cq! Great job getting the second stage up and running!
```

## lab 3

```
ibmcloud login --sso

ibmcloud cr login
docker build -t us.icr.io/ssli-iks-demo/watson ./watson
docker push us.icr.io/ssli-iks-demo/watson

docker build -t us.icr.io/ssli-iks-demo/watson-talk ./watson-talk
docker push us.icr.io/ssli-iks-demo/watson-talk

# 修改watson-deployment.yml中的镜像url
ibmcloud account org-create ssli-iks-demo
ibmcloud account space-create ssli-iks-demo
ibmcloud cf create-service tone_analyzer standard tone
ssli@sslis-mbp-4:Lab 3$ ibmcloud cf services
Invoking 'cf services'...

Getting services in org ssli-iks-demo / space ssli-iks-demo as lssongg@cn.ibm.com...

name   service         plan       bound apps   last operation
tone   tone_analyzer   standard                create succeeded

ibmcloud cs cluster-service-bind ssli-iks-demo default tone
kubectl apply -f watson-deployment.yml

kubectl get pods
kubectl get deployments
kubectl get services

ibmcloud cs workers ssli-iks-demo

http://184.172.242.146:30080/analyze/"Today is a beautiful day"
http://184.172.242.146:30080/analyze/"Today is a terrible day"
```
