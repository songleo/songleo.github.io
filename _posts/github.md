---
layout: post
title: todo list
date: 2023-03-13 00:12:05
---

- https://media.licdn.com/dms/image/D5622AQFS4YY_9lYTdQ/feedshare-shrink_1280/0/1697444954712?e=1700092800&v=beta&t=2WdfeRRgUrsokXiFtxHP3xY9Ib7AmLj3qksfpZ9hCYw
- https://media.licdn.com/dms/image/D4E22AQHoYMZjS4rWXQ/feedshare-shrink_1280/0/1697298328213?e=1700697600&v=beta&t=GNPmaqi1XWcFjAqwBCXFxBKox1pfQZOcuk7hD7NJpoo

```
The diagram below illustrates the typical workflow.

Step 1: The process starts with a product owner creating user stories based on requirements.

Step 2: The dev team picks up the user stories from the backlog and puts them into a sprint for a two-week dev cycle.

Step 3: The developers commit source code into the code repository Git.

Step 4: A build is triggered in Jenkins. The source code must pass unit tests, code coverage threshold, and gates in SonarQube.

Step 5: Once the build is successful, the build is stored in artifactory. Then the build is deployed into the dev environment.

Step 6: There might be multiple dev teams working on different features. The features need to be tested independently, so they are deployed to QA1 and QA2.

Step 7: The QA team picks up the new QA environments and performs QA testing, regression testing, and performance testing.

Steps 8: Once the QA builds pass the QA team’s verification, they are deployed to the UAT environment.

Step 9: If the UAT testing is successful, the builds become release candidates and will be deployed to the production environment on schedule.

Step 10: SRE (Site Reliability Engineering) team is responsible for prod monitoring.
```

- https://media.licdn.com/dms/image/D5622AQH3YWKeyXHerg/feedshare-shrink_800/0/1697025741898?e=1700697600&v=beta&t=oz6F-1KBv3TUfXz3HBlES4q6NKIVxlRVofwA0U4aROU

```
𝐁𝐥𝐮𝐞-𝐠𝐫𝐞𝐞𝐧 𝐝𝐞𝐩𝐥𝐨𝐲𝐦𝐞𝐧𝐭: Two identical production environments are maintained, and updates are switched between them instantly. This minimises downtime and provides a reliable way to deploy and roll back updates.

𝐂𝐚𝐧𝐚𝐫𝐲 𝐝𝐞𝐩𝐥𝐨𝐲𝐦𝐞𝐧𝐭: New features or updates are rolled out to a small group of users first, before being released to all users. This allows for real-time monitoring and risk mitigation.

𝐑𝐨𝐥𝐥𝐢𝐧𝐠 𝐝𝐞𝐩𝐥𝐨𝐲𝐦𝐞𝐧𝐭: Updates are rolled out to production servers gradually, one server at a time. This ensures continuous availability and minimises service disruption.

𝐅𝐞𝐚𝐭𝐮𝐫𝐞 𝐭𝐨𝐠𝐠𝐥𝐞𝐬: Developers can dynamically control which features are enabled, even in production. This allows for on-the-fly configuration changes, risk isolation, and controlled releases
.
𝐀/𝐁 𝐭𝐞𝐬𝐭𝐢𝐧𝐠: Multiple versions of a feature or design are released to different groups of users. This allows organisations to analyse user interactions and outcomes to make informed decisions about which version to roll out to all users.

𝐒𝐡𝐚𝐝𝐨𝐰 𝐝𝐞𝐩𝐥𝐨𝐲𝐦𝐞𝐧𝐭: A new version of the software is run in parallel with the existing version, without impacting users. This allows for real-world simulation, performance monitoring, and data collection.

```

- https://media.licdn.com/dms/image/D5622AQE3mGHWKVQ_6Q/feedshare-shrink_1280/0/1696678303781?e=1701302400&v=beta&t=0i9SGb3q3bkykhce3AjpkvGIe7YjGrJJU8DyIA9hSn4

```
𝐀𝐏𝐈 𝐆𝐚𝐭𝐞𝐰𝐚𝐲 𝐯𝐬 𝐋𝐨𝐚𝐝 𝐁𝐚𝐥𝐚𝐧𝐜𝐞𝐫 𝐯𝐬 𝐑𝐞𝐯𝐞𝐫𝐬𝐞 𝐏𝐫𝐨𝐱𝐲

API Gateway, Load Balancer, and Reverse Proxy are three important technologies that work together to make our online experiences smooth and secure.

𝐀𝐏𝐈 𝐆𝐚𝐭𝐞𝐰𝐚𝐲: An API Gateway is like a gatekeeper for APIs. It manages who can access the APIs, how often they can access them, and how they can use them. It also helps to make the APIs work better together.

𝐋𝐨𝐚𝐝 𝐁𝐚𝐥𝐚𝐧𝐜𝐞𝐫: A Load Balancer is like a traffic cop for websites. It distributes traffic across multiple servers to ensure that websites are always available and run smoothly, even when there is a lot of traffic.

𝐑𝐞𝐯𝐞𝐫𝐬𝐞 𝐏𝐫𝐨𝐱𝐲: A Reverse Proxy is like a bodyguard for websites. It sits in front of websites and handles security tasks such as encrypting data and preventing attacks. It also helps to improve performance by caching frequently accessed content.

These three technologies can work together to create a powerful infrastructure for web applications. For example, an API Gateway can be used to manage and secure APIs, while a Load Balancer can be used to distribute traffic across multiple servers. A Reverse Proxy can be used to add additional security and performance features.
```
