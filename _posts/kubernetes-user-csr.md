```
$ openssl genrsa -out ssli.key 2048
$ openssl req -new -key ssli.key -out ssli.csr
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [XX]:cn
State or Province Name (full name) []:sx
Locality Name (eg, city) [Default City]:xa
Organization Name (eg, company) [Default Company Ltd]:rh
Organizational Unit Name (eg, section) []:rhxa
Common Name (eg, your name or your server's hostname) []:ssli
Email Address []:ssli@redhat.com

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:123456
An optional company name []:rh

$ cat ssli.csr | base64 | tr -d "\n"

$ cat <<EOF | kubectl apply -f -
apiVersion: certificates.k8s.io/v1beta1
kind: CertificateSigningRequest
metadata:
  name: ssli
spec:
  groups:
  - system:authenticated
  request: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQzRUQ0NBY2tDQVFBd2NqRUxNQWtHQTFVRUJoTUNZMjR4Q3pBSkJnTlZCQWdNQW5ONE1Rc3dDUVlEVlFRSApEQUo0WVRFTE1Ba0dBMVVFQ2d3Q2NtZ3hEVEFMQmdOVkJBc01CSEpvZUdFeERUQUxCZ05WQkFNTUJITnpiR2t4CkhqQWNCZ2txaGtpRzl3MEJDUUVXRDNOemJHbEFjbVZrYUdGMExtTnZiVENDQVNJd0RRWUpLb1pJaHZjTkFRRUIKQlFBRGdnRVBBRENDQVFvQ2dnRUJBTTFrRnhUQjJkZ0c2ZnZuUEM2R2N0UVpwL0ZoeHg0Z0R5TlZmdzNzOGNDdApXUStaTEFBUXZydHBKdVpNQzBSN0dHQUNPbFNBNFhqNWJIcDJlM3RGYnBybGMrZWxyb0w4U3hRVE9JWXZyL3A1CmVFaDFvU2ZWMkhQUjBoTW96bXNIdHpZY0tReFpMelpyRW53Rkp1NDhSbTlhUmRsUGx0MFFZTlUwZ1Q5QndLV2sKTkh0Z0xPc3VLMzEyM3VlZUdVWHUwNmgvbFBTMHM3emhnM3dpMjZBdktDNW9Ob1JFMTZOUjJRM1RRUkdhbG1HUwpETU9zZjFTRzFZclpzRmF5WklrZHdEYTVvb3VkbmVuWmxUYmc2dGJwMUkrbDloRWNYeUJBUnpmdUMzZ2JqempmCnhVVFQzQVRObVl3YnFGek1VMkJVS1R2YTZUam9FQ1dQWTJSU3JaUFlBcUVDQXdFQUFhQXFNQkVHQ1NxR1NJYjMKRFFFSkFqRUVEQUp5YURBVkJna3Foa2lHOXcwQkNRY3hDQXdHTVRJek5EVTJNQTBHQ1NxR1NJYjNEUUVCQ3dVQQpBNElCQVFESi9lcldDYVVzZTJxZ2c0d3BHTlh4SU9GMEZNWGtxcUN3ekh1YUlZR2xtRlcvVW4zUGNOU01iV0ZzCldjVi9McnpnV1cyWkVmRkY2NWo0ektZSXYvRm9PbU96NmxkUURDQXB0YUhjZnlUUWwvUGFVSWlab2VvdHJDRHgKM2NTYzFNdVZwdkZUN1V4OC9RUW5MR3JWZGtoUDRJNUhWUlQydkxvdDMxV2UycGJNZStramoxTnJ6THE5THhlTApVeWo5Wmc4OFhycWZ5VC9zVGhtWTk5Q2FCdndEblJtMWhWYzk0S0d6aXZ5MFZicmUwaDNuNWlkQkN6V0RCK3hQCmJnUE91Tkl1cWFVVnEyajA3NW9Xa0FPOEJwcFNMVWVqUjFONml5Wk1KY3pFRzZ5amk1N25TdXdjYUsrWWxLZG4KSU9iYVFVNlhEejNFMWVKU2pYTlR1QlE2cEV0VQotLS0tLUVORCBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0K
  usages:
  - client auth
EOF

$ k get csr
NAME   AGE   REQUESTOR    CONDITION
ssli   6s    kube:admin   Pending
$ k certificate approve ssli
certificatesigningrequest.certificates.k8s.io/ssli approved

$ kubectl get csr/ssli -o yaml

$ kubectl get csr ssli -o jsonpath='{.status.certificate}' | base64 -d > ssli.crt

$ kubectl create role developer --verb=create --verb=get --verb=list --verb=update --verb=delete --resource=pods

$ kubectl create rolebinding developer-binding-ssli --role=developer --user=ssli

$ kubectl config set-credentials ssli --client-key=/share/git/k8s_practice/authn-authz/ssli.key --client-certificate=/share/git/k8s_practice/authn-authz/ssli.crt --embed-certs=true

$ kubectl config set-context ssli --cluster=soli-acm-hub --user=ssli

$ kubectl config use-context ssli
```