---
layout: post
title: 常见授权类型
date: 2022-07-08 12:12:05
---

最近在学习security相关知识，看到一篇介绍授权的文章，觉得讲得挺好，所以总结下分享给大家：

## dac (discretionary access control)

dac主要用于文件系统权限控制，比如我有3个用户user1，user2和user3。系统中有一个文件，文件只给user1授权可读写，其他用户默认都无权限访问该文件。那么只有user1有权限访问改文件，user2和user3无权访问改文件。

## mac (mandatory access control)

mac主要用于军事级别的安全系统，它有2个原则：

- no read up
- no write down

例如在系统中有3个安全级别，一般、机密和绝密，有3个用户user1，user2和user3分别被授予一般、机密和绝密访问权限，然后有3个文件分别被授予一般、机密和绝密权限。no read up是指user1只能读取一般权限的文件，不能读取机密和绝密权限文件。no write down是指user3只能对绝密文件有写权限，不能对一般和机密级别的文件进行写操作。no write down这个原则很有意思，意思就是安全级别高的人，却不能对低级别的文件进行写操作，原因就是防止拥有绝密权限的人把绝密文件写入一般权限文件，这样就会导致user1能访问到绝密权限的文件了。

## rbac (role-based access control)

rbac是基于角色的访问控制，例如系统中有user1，user2和user3，然后有3个角色admin，reader和guest，这3个角色分别被授予管理员权限、读权限和无权限。然后我们将admin角色绑定到user1，将reader角色绑定到user2，将guest角色绑定到user3，那么user1就具备了管理员权限，user2就具备了读权限，user3无权限。这就是rbac，基于角色的访问控制。

## abac (attribute-based access control)

abac是基于属性的访问控制，这是一种新类型的授权类型。比如你有一个系统，系统中有一个文件只允许居住在北京，并且开发部门的经理在上班时间（09-18）访问该文件。这里注意有及几个属性：

- 居住在北京
- 开发部门经理
- 上班时间

那么如果一个居住在北京的开发部门经理在晚上20点访问该文件，就会被拒绝。因为不是上班时间，无法访问该文件。但是如果居住在北京的开发部门经理在上班时间访问该文件，那么会被允许访问。这就是abac，基于一些属性的访问控制。
