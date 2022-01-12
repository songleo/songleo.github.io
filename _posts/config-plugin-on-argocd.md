### 插件配置

```
data:
  configManagementPlugins: |
    - name: createDeploy
      init:
        command: [sh, -c, './create-depoy-yaml.sh']
      generate:
        command: [sh, -c, 'cat demo.yaml']
      lockRepo: true


apiVersion: v1
data:
  configManagementPlugins: |
    - name: updateReplicas
      init:
        command: [sh, -c, 'sed -i "s/replicas: 2/replicas: 1/" deploy.yaml']
      generate:
        command: [sh, -c, 'cat deploy.yaml']
      lockRepo: true
kind: ConfigMap
...
```

sed -i 's/replicas: 2/replicas: 1/' hostname.yaml

cat << EOF | kubectl apply -f -
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: demo1
  namespace: argocd
spec:
  destination:
    namespace: default
    server: https://kubernetes.default.svc
  project: default
  source:
    path: demo
    plugin:
      name: createDeploy
    repoURL: https://github.com/songleo/argocd-demo.git
    targetRevision: HEAD
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
EOF

## ref

- https://argo-cd.readthedocs.io/en/stable/user-guide/config-management-plugins/
