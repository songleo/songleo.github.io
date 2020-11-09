

- application name: ssli-ocp-test
- homepage url: https://oauth-openshift.apps.soli-ocp44-acm.dev05.red-chesterfield.com
- authorization callback url: https://oauth-openshift.apps.soli-ocp44-acm.dev05.red-chesterfield.com/oauth2callback/github/

注册应用后得到client id和client secret。

在ocp创建相应的idp secret:

```
oc create secret generic <secret_name> --from-literal=clientSecret=<secret> -n openshift-config
```

在ocp创建相应的ca configmap:

```
oc create configmap ca-config-map --from-file=ca.crt=/path/to/ca -n openshift-config
```

创建github cr:

```
apiVersion: config.openshift.io/v1
kind: OAuth
metadata:
  name: cluster
spec:
  identityProviders:
    - github:
        clientID: e815e42908b564848231
        clientSecret:
          name: github-client-secret-fqpl4
        hostname: ''
        organizations:
          - open-cluster-management
        teams: []
      mappingMethod: claim
      name: github
      type: GitHub
```

## ref

https://docs.openshift.com/container-platform/4.4/authentication/identity_providers/configuring-github-identity-provider.html#identity-provider-overview_configuring-github-identity-provider