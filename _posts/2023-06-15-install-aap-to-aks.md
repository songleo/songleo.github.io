---
 layout: post
 title: install aap on aks
 date: 2023-06-15 00:12:05
 ---

 ## create the aks

 - aks version: 1.25.5
 - network type (plugin): kubenet
 - private cluster: enabled
 - application gateway ingress controller: enabled

 ```
 az_aks_command() { CMD=$1; CMDOPTS=$2; az aks command invoke --resource-group ${RESOURCE_GROUP} --name ${AKS_NAME} --command "${CMD}" ${CMDOPTS}; }
 export RESOURCE_GROUP=ssli-test-rg
 export AKS_NAME=ssli-aks

 $ az_aks_command "kubectl get no -o wide"
 ```

 ## prepare the jump vm to access the aks

 Create a VM in the same VNet as the AKS cluster, then we can login this vm and access the aks.

 ```
 # kubectl get no
 NAME                                STATUS   ROLES   AGE   VERSION
 aks-agentpool-34673761-vmss000000   Ready    agent   14h   v1.25.5
 ```

 ## install olm to aks

 ```
 kubectl create -f https://github.com/operator-framework/operator-lifecycle-manager/releases/download/v0.24.0/crds.yaml
 kubectl create -f https://github.com/operator-framework/operator-lifecycle-manager/releases/download/v0.24.0/olm.yaml

 kubectl get po -n olm && kubectl get po -n operators
 ```
 ## install catalog source

 ```
 kubectl create secret docker-registry redhat-operators-pull-secret --namespace=olm --from-file=.dockerconfigjson

 kubectl create secret docker-registry certified-operators-pull-secret --namespace=olm --from-file=.dockerconfigjson

 kubectl apply -f catalog_source.yaml

 $ k get catalogsource
 NAME                    DISPLAY               TYPE   PUBLISHER        AGE
 certified-operators     Certified Operators   grpc   aap-build-team   46s
 operatorhubio-catalog   Community Operators   grpc   OperatorHub.io   15h
 redhat-operators        Red Hat Operators     grpc   aap-build-team   46s

 $ k get po
 NAME                                READY   STATUS    RESTARTS   AGE
 catalog-operator-655fb46cd4-28sgx   1/1     Running   0          15h
 certified-operators-lwck4           1/1     Running   0          3m28s
 olm-operator-67fdb4b99d-4dvq8       1/1     Running   0          15h
 operatorhubio-catalog-zjjjn         1/1     Running   0          9h
 packageserver-5fd97cb877-96s77      1/1     Running   0          15h
 packageserver-5fd97cb877-9dfhk      1/1     Running   0          15h
 redhat-operators-bf8p4              1/1     Running   0          3m28s
 ```


 ## install operator

 - aap

 ```
 ---
 apiVersion: operators.coreos.com/v1alpha1
 kind: Subscription
 metadata:
   name: ansible-automation-platform-operator
   namespace: operators
 spec:
   channel:
   installPlanApproval: Automatic
   name: ansible-automation-platform-operator
   source: redhat-operators
   sourceNamespace: olm
 ```
 - keycloak

 ```
 ---
 apiVersion: v1
 kind: Namespace
 metadata:
   name: keycloak
 ---
 apiVersion: operators.coreos.com/v1
 kind: OperatorGroup
 metadata:
   name: keycloak-operator-group
   namespace: keycloak
 spec:
   targetNamespaces:
     - ansible-automation-platform
 ---
 apiVersion: operators.coreos.com/v1alpha1
 kind: Subscription
 metadata:
   name: keycloak-operator
   namespace: keycloak
 spec:
   channel: alpha
   name: keycloak-operator
   installPlanApproval: Automatic
   source: operatorhubio-catalog
   sourceNamespace: olm
 ```

 - cert-manager

 ```
 ---
 apiVersion: operators.coreos.com/v1alpha1
 kind: Subscription
 metadata:
   name: cert-manager
   namespace: operators
 spec:
   channel: stable
   installPlanApproval: Automatic
   name: cert-manager
   source: operatorhubio-catalog
   sourceNamespace: olm
 ```

 - aca

 ```
 ---
 apiVersion: operators.coreos.com/v1alpha1
 kind: Subscription
 metadata:
   name: ansible-cloud-addons-operator
   namespace: operators
 spec:
   channel:
   installPlanApproval: Automatic
   name: ansible-cloud-addons-operator
   source: redhat-operators
   sourceNamespace: olm
 ```

 check all installed operator:

 ```
 $ k get po -n keycloak
 NAME                                READY   STATUS    RESTARTS   AGE
 keycloak-operator-548dd798f-lhpcm   1/1     Running   0          3m40s
 $ k get po -n operators
 NAME                                                              READY   STATUS    RESTARTS   AGE
 aap-billing-operator-controller-manager-75649cc456-t85lc          2/2     Running   0          2m23s
 aap-ui-operator-controller-manager-9bfd86686-jpx9v                2/2     Running   0          2m23s
 automation-controller-operator-controller-manager-7d75886b7f4gl   2/2     Running   0          3m4s
 automation-hub-operator-controller-manager-568557674d-knpkm       2/2     Running   0          3m4s
 cert-manager-65bdd959b4-fhbv7                                     1/1     Running   0          4m7s
 cert-manager-cainjector-65b88668bc-rc9l4                          1/1     Running   0          4m7s
 cert-manager-webhook-b84d54d8c-kbvh5                              1/1     Running   0          4m7s
 resource-operator-controller-manager-67c8958c8d-k2zd7             2/2     Running   0          3m4s
 ```

 ## install controller

 ```
 $ k create ns ansible-automation-platform

 $ cat <<EOF | kubectl apply -f -
 apiVersion: automationcontroller.ansible.com/v1beta1
 kind: AutomationController
 metadata:
   name: automation-controller
   namespace: ansible-automation-platform
 spec:
   replicas: 1
 EOF
 ```

 ## configure the ingress for controller

 ```
 $ cat <<EOF | kubectl apply -f -
 apiVersion: networking.k8s.io/v1
 kind: Ingress
 metadata:
   name: automation-controller-ingress
   namespace: ansible-automation-platform
 spec:
   ingressClassName: azure-application-gateway
   rules:
   - http:
       paths:
       - pathType: Prefix
         path: "/"
         backend:
           service:
             name: automation-controller-service
             port:
               number: 80
 EOF
 ```

 access the controller console: `http://you_appgw_public_ip/#/home`

 ## enable https for controller

 ```
 $ openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout mykey.key -out mycert.crt
 $ kubectl create secret tls mycert-secret --key mykey.key --cert mycert.crt

 $ cat <<EOF | kubectl apply -f -
 apiVersion: networking.k8s.io/v1
 kind: Ingress
 metadata:
   name: automation-controller-ingress
   namespace: ansible-automation-platform
 spec:
   ingressClassName: azure-application-gateway
   tls:
   - secretName: mycert-secret
   rules:
   - host: controller.ssli-aks.com
     http:
       paths:
       - pathType: Prefix
         path: "/"
         backend:
           service:
             name: automation-controller-service
             port:
               number: 80
 EOF
 ```

 access the controller console: `https://you_appgw_public_ip/#/home`

 ## prepare the external database for controller

 ### azure postgres

 - private access: vnet integration
 - create a new subnet from aks vnet for postgres
 - postgres version: 13
 - prepare the database for controller: awx

 ## create keycloak

 - prepare the db connection secret

 ```
 cat <<EOF | kubectl apply -f -
 apiVersion: keycloak.org/v1alpha1
 kind: Keycloak
 metadata:
   labels:
     app: sso
   name: ansible-automation-keycloak
   namespace: ansible-automation-platform
 spec:
   externalDatabase:
     enabled: true
   instances: 1
 EOF
 ```

 create keycloak realm


 ```
 cat <<EOF | kubectl apply -f -
 apiVersion: keycloak.org/v1alpha1
 kind: KeycloakRealm
 metadata:
   name: aap-realm
   labels:
     app: sso
 spec:
   instanceSelector:
     matchLabels:
       app: sso
   realm:
     enabled: true
     displayName: Ansible Automation Platform
     realm: ansible-automation-platform
     id: ansible-automation-platform
 ---
 apiVersion: keycloak.org/v1alpha1
 kind: KeycloakClient
 metadata:
   name: automation-hub
   labels:
     app: sso
 spec:
   client:
     adminUrl: https://sso.ssli-aks.com/
     enabled: true
     clientAuthenticatorType: client-secret
     redirectUris:
       - https://sso.ssli-aks.com/*
     clientId: automation-hub
     optionalClientScopes:
       - address
       - microprofile-jwt
       - offline_access
       - phone
     defaultClientScopes:
       - email
       - profile
       - roles
       - web-origins
     name: Ansible Automation Hub
     rootUrl: https://sso.ssli-aks.com/
     secret: NJrxkPiZO3A407myA0rMLwUt9AaJ8C8LhIpd0ImO
     webOrigins:
       - https://sso.ssli-aks.com/
     useTemplateMappers: false
     standardFlowEnabled: true
     serviceAccountsEnabled: true
     protocol: openid-connect
     directAccessGrantsEnabled: true
     protocolMappers:
       - name: Client ID
         protocol: openid-connect
         protocolMapper: oidc-usersessionmodel-note-mapper
         consentRequired: false
         config:
           user.session.note: clientId
           id.token.claim: 'true'
           access.token.claim: 'true'
           claim.name: clientId
           jsonType.label: String
       - name: Client IP Address
         protocol: openid-connect
         protocolMapper: idc-usersessionmodel-note-mapper
         consentRequired: false
         config:
           user.session.note: clientAddress
           id.token.claim: 'true'
           access.token.claim: 'true'
           claim.name: clientAddress
           jsonType.label: String
       - name: Client Host
         protocol: openid-connect
         protocolMapper: oidc-usersessionmodel-note-mapper
         consentRequired: false
         config:
           user.session.note: clientHost
           id.token.claim: 'true'
           access.token.claim: 'true'
           claim.name: clientHost
           jsonType.label: String
       - name: Audience Mapper
         protocol: openid-connect
         protocolMapper: oidc-audience-mapper
         consentRequired: false
         config:
           included.client.audience: automation-hub
           id.token.claim: 'true'
           access.token.claim: 'true'
       - name: client_roles
         protocol: openid-connect
         protocolMapper: oidc-usermodel-client-role-mapper
         consentRequired: false
         config:
           multivalued: 'true'
           userinfo.token.claim: 'true'
           id.token.claim: 'true'
           access.token.claim: 'true'
           claim.name: client_roles
           usermodel.clientRoleMapping.clientId: automation-hub
       - name: group
         protocol: openid-connect
         protocolMapper: oidc-group-membership-mapper
         config:
           full.path: "true"
           id.token.claim: "true"
           access.token.claim: "true"
           claim.name: "group"
           userinfo.token.claim: "true"

   realmSelector:
     matchLabels:
       app: sso
   roles:
     - clientRole: true
       description: An administrator role for Automation Hub
       name: hubadmin
 EOF
 ```

 create the ingress for keycloak

 ```
 $ cat <<EOF | kubectl apply -f -
 apiVersion: v1
 kind: Service
 metadata:
   labels:
     app: keycloak
   name: keycloak-service
   namespace: ansible-automation-platform
 spec:
   ports:
   - name: keycloak
     port: 8080
     protocol: TCP
     targetPort: 8080
   selector:
     app: keycloak
     component: keycloak
   type: ClusterIP
 ---
 apiVersion: networking.k8s.io/v1
 kind: Ingress
 metadata:
   name: keycloak-ingress
   namespace: ansible-automation-platform
 spec:
   ingressClassName: azure-application-gateway
   tls:
   - secretName: mycert-secret
   rules:
   - host: sso.ssli-aks.com
     http:
       paths:
       - backend:
           service:
             name: keycloak-service
             port:
               number: 8080
         path: /
         pathType: Prefix
       - backend:
           service:
             name: keycloak-service
             port:
               number: 8080
         path: /auth
         pathType: Prefix
 EOF
 ```

 ## install hub

 - prepare the secret

 ```
 apiVersion: automationhub.ansible.com/v1beta1
 kind: AutomationHub
 metadata:
   name: private-ah
   namespace: ansible-automation-platform
 spec:
   sso_secret: automation-hub-sso
   pulp_settings:
     verify_ssl: false
   route_tls_termination_mechanism: Edge
   ingress_type: Route
   loadbalancer_port: 80
   file_storage_size: 100Gi
   image_pull_policy: IfNotPresent
   web:
     replicas: 1
   file_storage_access_mode: ReadWriteMany
   content:
     log_level: INFO
     replicas: 2
   postgres_storage_requirements:
     limits:
       storage: 50Gi
     requests:
       storage: 8Gi
   api:
     log_level: INFO
     replicas: 1
   postgres_resource_requirements:
     limits:
       cpu: 1000m
       memory: 8Gi
     requests:
       cpu: 500m
       memory: 2Gi
   loadbalancer_protocol: http
   resource_manager:
     replicas: 1
   worker:
     replicas: 2
 ```

 ## create ingress for hub

 ```
 $ cat <<EOF | kubectl apply -f -
 apiVersion: networking.k8s.io/v1
 kind: Ingress
 metadata:
   name: automation-hub-ingress
 spec:
   ingressClassName: azure-application-gateway
   tls:
   - hosts:
     - hub.ssli-aks.com
     secretName: mycert-secret
   rules:
   - host: hub.ssli-aks.com
     http:
       paths:
       - path: /
         pathType: Prefix
         backend:
           service:
             name: automation-hub-service
             port:
               number: 80
 EOF
 ```

 ### ref

 - https://learn.microsoft.com/en-us/azure/aks/private-clusters#options-for-connecting-to-the-private-cluster
 - https://github.com/operator-framework/operator-lifecycle-manager/blob/master/doc/install/install.md
 - https://access.redhat.com/documentation/en-us/red_hat_ansible_automation_platform/2.3/html/deploying_the_red_hat_ansible_automation_platform_operator_on_openshift_container_platform/installing-aap-operator-cli
 - https://github.com/ansible/awx-operator/tree/2.3.0
