---
layout: post
title: 在rosa部署alb和waf
date: 2024-05-11 00:12:05
---


### 准备环境变量

```
export AWS_PAGER=""
export CLUSTER_NAME=$(oc get infrastructure cluster -o=jsonpath="{.status.infrastructureName}"  | sed 's/-[a-z0-9]\{5\}$//')
export REGION=$(oc get infrastructure cluster -o=jsonpath="{.status.platformStatus.aws.region}")
export OIDC_ENDPOINT=$(oc get authentication.config.openshift.io cluster -o jsonpath='{.spec.serviceAccountIssuer}' | sed  's|^https://||')
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export SCRATCH="/tmp/${CLUSTER_NAME}/alb-waf"
mkdir -p ${SCRATCH}
echo "Cluster: ${CLUSTER_NAME}, Region: ${REGION}, OIDC Endpoint: ${OIDC_ENDPOINT}, AWS Account ID: ${AWS_ACCOUNT_ID}"
```

### 给vpc和subnet添加tag

```
export VPC_ID=<vpc-id>
export PUBLIC_SUBNET_IDS=<public-subnets>
export PRIVATE_SUBNET_IDS=<private-subnets>

aws ec2 create-tags --resources ${VPC_ID} --tags Key=kubernetes.io/cluster/${CLUSTER_NAME},Value=owned --region ${REGION}
aws ec2 create-tags --resources ${PUBLIC_SUBNET_IDS} --tags Key=kubernetes.io/role/elb,Value='' --region ${REGION}
aws ec2 create-tags --resources ${PRIVATE_SUBNET_IDS} --tags Key=kubernetes.io/role/internal-elb,Value='' --region ${REGION}

aws ec2 create-tags --resources ${PUBLIC_SUBNET_IDS} --tags Key=kubernetes.io/cluster/${CLUSTER_NAME},Value='' --region ${REGION}
aws ec2 create-tags --resources ${PRIVATE_SUBNET_IDS} --tags Key=kubernetes.io/cluster/${CLUSTER_NAME},Value='' --region ${REGION}
```

### 创建role和policy


```
oc new-project aws-load-balancer-operator
POLICY_ARN=$(aws iam list-policies --query \
     "Policies[?PolicyName=='aws-load-balancer-operator-policy'].{ARN:Arn}" \
     --output text)
if [[ -z "${POLICY_ARN}" ]]; then
    wget -O "${SCRATCH}/load-balancer-operator-policy.json" \
       https://raw.githubusercontent.com/rh-mobb/documentation/main/content/docs/rosa/aws-load-balancer-operator/load-balancer-operator-policy.json
     POLICY_ARN=$(aws --region "$REGION" --query Policy.Arn \
     --output text iam create-policy \
     --policy-name aws-load-balancer-operator-policy \
     --policy-document "file://${SCRATCH}/load-balancer-operator-policy.json")
fi
echo $POLICY_ARN

cat <<EOF > "${SCRATCH}/trust-policy.json"
{
 "Version": "2012-10-17",
 "Statement": [
 {
 "Effect": "Allow",
 "Condition": {
   "StringEquals" : {
     "${OIDC_ENDPOINT}:sub": ["system:serviceaccount:aws-load-balancer-operator:aws-load-balancer-operator-controller-manager", "system:serviceaccount:aws-load-balancer-operator:aws-load-balancer-controller-cluster"]
   }
 },
 "Principal": {
   "Federated": "arn:aws:iam::$AWS_ACCOUNT_ID:oidc-provider/${OIDC_ENDPOINT}"
 },
 "Action": "sts:AssumeRoleWithWebIdentity"
 }
 ]
}
EOF

ROLE_ARN=$(aws iam create-role --role-name "mgt-371ceo-alb-operator" --assume-role-policy-document "file://${SCRATCH}/trust-policy.json" --query Role.Arn --output text)

echo $ROLE_ARN

aws iam attach-role-policy --role-name "mgt-371ceo-alb-operator" --policy-arn $POLICY_ARN
aws iam attach-role-policy --role-name "mgt-371ceo-alb-operator" --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess

cat << EOF | oc apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: aws-load-balancer-operator
  namespace: aws-load-balancer-operator
stringData:
  credentials: |
    [default]
    role_arn = $ROLE_ARN
    web_identity_token_file = /var/run/secrets/openshift/serviceaccount/token
EOF
```

### 部署aws load balancer operator

```
cat << EOF | oc apply -f -
apiVersion: operators.coreos.com/v1
kind: OperatorGroup
metadata:
  name: aws-load-balancer-operator
  namespace: aws-load-balancer-operator
spec:
  upgradeStrategy: Default
---
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: aws-load-balancer-operator
  namespace: aws-load-balancer-operator
spec:
  channel: stable-v1.0
  installPlanApproval: Automatic
  name: aws-load-balancer-operator
  source: redhat-operators
  sourceNamespace: openshift-marketplace
  startingCSV: aws-load-balancer-operator.v1.0.0
EOF

cat << EOF | oc apply -f -
apiVersion: networking.olm.openshift.io/v1
kind: AWSLoadBalancerController
metadata:
  name: cluster
spec:
  credentials:
    name: aws-load-balancer-operator
  enabledAddons:
    - AWSWAFv2
EOF
```

### 验证部署

```
$ k get po
NAME                                                             READY   STATUS    RESTARTS   AGE
aws-load-balancer-controller-cluster-58cf55c64c-cqhdq            1/1     Running   0          5m8s
aws-load-balancer-operator-controller-manager-746c4cf4cc-94dcn   2/2     Running   0          5m30s
```

### 部署app

```
oc new-app --docker-image=docker.io/openshift/hello-openshift

oc patch service hello-openshift -p '{"spec":{"type":"NodePort"}}'

cat << EOF | oc apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hello-openshift-alb
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
spec:
  ingressClassName: alb
  rules:
    - http:
        paths:
          - path: /
            pathType: Exact
            backend:
              service:
                name: hello-openshift
                port:
                  number: 8080
EOF


INGRESS=$(oc get ingress hello-openshift-alb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

curl "http://${INGRESS}"
```

### 部署waf

```
cat << EOF > ${SCRATCH}/waf-rules.json
[
    {
      "Name": "AWS-AWSManagedRulesCommonRuleSet",
      "Priority": 0,
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesCommonRuleSet"
        }
      },
      "OverrideAction": {
        "None": {}
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "AWS-AWSManagedRulesCommonRuleSet"
      }
    },
    {
      "Name": "AWS-AWSManagedRulesSQLiRuleSet",
      "Priority": 1,
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesSQLiRuleSet"
        }
      },
      "OverrideAction": {
        "None": {}
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "AWS-AWSManagedRulesSQLiRuleSet"
      }
    }
]
EOF

WAF_ARN=$(aws wafv2 create-web-acl --name ${CLUSTER_NAME}-waf --region ${REGION} --default-action Allow={} --scope REGIONAL --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=${CLUSTER_NAME}-waf-metrics --rules file://${SCRATCH}/waf-rules.json --query 'Summary.ARN' --output text)

oc annotate ingress.networking.k8s.io/hello-openshift-alb alb.ingress.kubernetes.io/wafv2-acl-arn=${WAF_ARN} --overwrite
```

### 验证waf

```
curl -X POST "http://${INGRESS}" -F "user='<script><alert>Hello></alert></script>'"
```

### ref

- https://docs.openshift.com/rosa/cloud_experts_tutorials/cloud-experts-using-alb-and-waf.html
