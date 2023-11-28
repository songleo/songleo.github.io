---
layout: post
title: todo list
date: 2023-03-13 00:12:05
---

- cache

    - https://www.linkedin.com/posts/alexxubyte_systemdesign-coding-interviewtips-activity-7132041993706201088-o6mz/?utm_source=share&utm_medium=member_desktop
    - https://media.licdn.com/dms/image/D4E22AQGIkKGcm9jRkg/feedshare-shrink_800/0/1700411316862?e=1703116800&v=beta&t=xApDFj-FlrqnhbB14npoFPzZSlQBPL-OmFLlS4xEuic

- sso:
    - https://media.licdn.com/dms/image/D4E22AQFhtND12RqLKw/feedshare-shrink_800/0/1700066713756?e=1703116800&v=beta&t=419amzm57vXc2A2RW9mk3N94gDRf378O9e-gjvimAaQ
    - https://chat.openai.com/c/a8043da3-cae8-4ee0-a080-a629387fecb2
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
