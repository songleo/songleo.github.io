---
layout: post
title: cka练习（十六）
date: 2021-12-20 00:12:05
---

```shell
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: secret-reader
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets", "daemonsets"]
  verbs: ["create"]
EOF
k create sa cicd-token -n cka
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-secrets-global
subjects:
- kind: ServiceAccount
  name: cicd-token
  namespace: cka
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
EOF

kubectl cordon node2
kubectl drain node2 --ignore-daemonsets
kubectl uncordon node2

kubectl cordon kmaster
kubectl drain kmaster --ignore--daemonsets
apt-mark unhold kubeadm kubelet kubectl
apt-get update && apt-get install -y kubeadm=1.20.1-00 kubelet=1.20.1-00 kubect;=1.20.1-00
apt-mark hold kubeadm kubelet kubectl
kubeadm upgrade plan
kubeadm upgrade apply v1.20.1
kubectl uncordon kmaster

ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key \
  snapshot save /tmp/etcd_snampshot.db
ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key \
  snapshot restore /tmp/etcd_snampshot.db

cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: test-network-policy
  namespace: cka
spec:
  podSelector:
    matchLabels:
      role: db
  policyTypes:
  - Ingress
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          project: fubar
    ports:
    - protocol: TCP
      port: 80
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          project: my-app
    ports:
    - protocol: TCP
      port: 80
EOF

kubectl expose deployment nginx --type=NodePort --port=80 --target-port=80 --name=nginx
service/nginx exposed
k get svc
NAME    TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
nginx   NodePort   10.105.85.221   <none>        80:30544/TCP   3s
curl master:30544

cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ping
  namespace: cka
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - http:
      paths:
      - path: /hello
        pathType: Prefix
        backend:
          service:
            name: hello
            port:
              number: 5678
EOF

kubectl scale --replicas=3 deployment nginx

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: node-selector
  labels:
    env: test
spec:
  containers:
  - name: nginx
    image: nginx
    imagePullPolicy: IfNotPresent
  nodeSelector:
    name: node1
EOF

kubectl get no --no-headers
kubectl describe nodes | grep -i taint | grep NoSchedule

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolume
metadata:
  name: app-config
spec:
  capacity:
    storage: 2Gi
  accessModes:
    - ReadWriteMany
  hostPath:
    path: "/srv/app-config"
EOF

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pv-volume
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Mi
  storageClassName: gp2
---
apiVersion: v1
kind: Pod
metadata:
  name: web-server
spec:
  containers:
    - name: web-server
      image: nginx
      volumeMounts:
      - mountPath: "/usr/share/nginx/html"
        name: mypd
  volumes:
    - name: mypd
      persistentVolumeClaim:
        claimName: pv-volume
EOF
k edit pvc pv-volume --record


k logs nginx-6669c4fd9f-78jdm | grep start >> log
cat log


cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: two-containers
spec:
  restartPolicy: Never
  volumes:
  - name: shared-data
    emptyDir: {}
  containers:
  - name: c1
    image: quay.io/songleo/busybox:latest
    volumeMounts:
    - name: shared-data
      mountPath: /tmp/
    command: ["/bin/sh"]
    args: ["-c", "echo log >> /tmp/log && sleep 10000"]
  - name: sidecar
    image: quay.io/songleo/busybox:latest
    volumeMounts:
    - name: shared-data
      mountPath: /tmp/
    command: ["/bin/sh"]
    args: ["-c", "tail -f /tmp/log"]
EOF
k logs two-containers -c sidecar

k top pod --sort-by=cpu

kubectl get nodes 
systemctl status kubelet
systemctl enable kubelet
systemctl restart kubelet
systemctl status kubelet
kubectl get nodes 
```
