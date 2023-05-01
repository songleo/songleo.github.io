---
layout: post
title: 给aap on azure配置hub-spoke peering
date: 2023-04-30 00:12:05
---

## 创建2个vnet

- hub: 10.3.0.0/16
- spoke：10.2.0.0/16

aap提前创建好，但是vnet不能和hub以及spoke有地址重叠，否则无法peering。比如可以使用10.11.0.0/24。

## 给hub创建vpn gateway

这会自动创建一个gateway subnet，使用10.3.1.0/24。

## 创建hub-spoke peering

- 在hub端选择：use this virtual network's gateway or route server
- 在spoke端选择：use the remote virtual network's gateway or route server

创建成功后确保hub端的peering的gateway transit是enabled状态。

## 创建hub-aap peering

## 根据guide更新路由表

- 在aap关联的路由表中添加规则，将下一跳设置到spoke vnet

    - 路由

    ```
    spoke1_route 10.2.0.0/16 "virtual network gateway"
    ```


- 新创建一个路由表，并关联spoke vnet，添加规则设置下一跳到aap vnet

    - 路由

    ```
    aap_route 10.11.0.0/20 "virtual network gateway"
    ```

    - 子网

    ```
    default 10.2.0.0/24 ssli-spoke-vnet
    ```

## ref
- https://learn.microsoft.com/en-us/azure/vpn-gateway/vpn-gateway-peering-gateway-transit?toc=%2fazure%2fvirtual-network%2ftoc.json
- https://learn.microsoft.com/en-us/azure/vpn-gateway/tutorial-create-gateway-portal#vnetgateway
- https://access.redhat.com/documentation/en-us/red_hat_ansible_automation_platform/2.1/html/red_hat_ansible_automation_platform_on_microsoft_azure_guide/aap-azure-network-peering
