## 联系方式

- 手机/微信：18602938087
- 邮箱：lisong1205@gmail.com

## 个人信息

- 姓名：李松松
- 性别：男
- 出生年月：1988年12月
- 毕业院校：西安科技大学-硕士-电子与通信工程
- 毕业时间：2015年07月
- 微信公众号：reborncodinglife
- 博客：[http://reborncodinglife.com/](http://reborncodinglife.com/)
- 期望职位：go开发工程师
- 期望薪资：税前月薪16k-20k，[特别喜欢的公司](http://reborncodinglife.com/2016/06/01/how-to-find-great-dev-team/)可以例外
- 个人爱好：[阅读](https://github.com/songleo/songleo.github.io/blob/master/_posts/2016-01-30-my-book-list.md)、羽毛球
- 期望城市：西安

## 工作经历

- [北京景行锐创软件有限公司](http://www.jhinno.com/) 2015年12月 - 2015年08月
- [广州海格通信集团股份有限公司](http://www.haige.com/cn/index.html)  2015年07月 - 2015年12月

## 专业技能

- 熟练使用linux操作系统、shell及常用命令
- 熟练使用常见版本控制工具如svn、git
- 熟练使用go、python和c等编程语言
- 熟练掌握软件产品开发、测试及bugfix相关规范和流程
- 具备良好的代码编写习惯和文档编写能力

## 项目经验

### fairshare调度策略实现

使用go实现集群作业调度系统中的fairshare调度策略，将集群的处理能力按用户和用户组进行分配来提供对资源的公平访问。从而使用户和队列能够公平的使用资源，以致于没有一个用户或队列能独占整个集群的资源，也没有一个队列无资源可用，实现将资源有限分配给重要用户使用和均衡资源给所有用户使用。

### 许可证管理模块

使用go实现集群作业调度系统的许可证管理模块，收集集群相关硬件信息，作为集群系统的唯一标识进而实现许可证控制，并提供多种许可证控制策略，如时长限制和cpu核数限制、demo许可证控制等。

### 集群作业调度系统配置管理

使用go实现服务器端和客户端的配置管理的开发，解析集群作业调度系统的配置文件供其他模块调用，实现配置信息的统一管理，支持配置信息的错误检测并打印相应级别的提示信息，如警告、一般错误和致命错误等，并给出相应的建议配置，提升用户使用体验，在配置信息部分增加默认配置，若相应的配置文件被误删，能自动构建默认配置，不影响系统功能使用。

### 集群作业调度系统测试的自动化

通过robot framework自动化测试框架，使用python开发相应测试库和关键字，实现命令行的自动化测试，快速自动完成大量测试用例，节约了一定的的人工测试成本，并编写相应的自动化使用手册供QA使用，方便QA往自动化测试库中添加用例，将其发现的bug加入自动化测试库，实现回归测试的自动化，减少测试时间，使得QA有更多的时间进行一些探索性测试发现新的bug。后期将自动化测试用例加入dailybuild，在每次构建程序时自动运行自动化测试库，确保每天的代码提交不会破坏原有的正常功能。

### 集群作业调度系统命令行

使用python开发集群作业调度系统的命令行，实现命令行到服务器的交互，通信方式使用https + json实现，通过argparse模块实现相应的命令行选项、参数和子命令，并提供了相应的webservice api供第三方应用集成和调用，且支持i18n功能。

### mic调度策略实现

使用c实现集群作业调度系统的mic调度策略，分别实现了mic基础调度和mic绑定调度。mic基础调度按作业请求的mic块数来选择符合条件的执行节点，mic绑定调度是为了提高mic的使用性能，避免多个作业同时运行在同一个mic而引起互相干扰，需要独占mic直到作业运行完毕，并提供接口供常见mpi集成进而支持并行作业的mic调度。

### 集群作业调度系统的文档编写

负责编写集群作业调度系统的管理员手册、用户手册、命令行参考手册和安装手册等文档，具有较好的文档编写能力。

## 部分文章链接

- [go技巧分享系列文章](https://www.jianshu.com/c/3058964de009)
- [关于单元测试（go）](https://www.jianshu.com/p/4ad45d03c835)
- [python技巧分享系列文章](https://www.jianshu.com/c/e1d7f53db165)
- [如何调试windows的stackdump文件](http://reborncodinglife.com/2016/12/29/how-to-debug-windows-stackdump/)
- [工作中的小技巧分享](https://github.com/songleo/songleo.github.io/blob/master/_posts/2016-11-25-knowledge-share-for-dev2.md)
- [我使用最频繁的10个git命令](https://github.com/songleo/songleo.github.io/blob/master/_posts/2016-04-23-git-common-command.md)
- [coding感想（二）](https://www.jianshu.com/p/386cd22a379d)
- [the way to go 中文译本](https://github.com/Unknwon/the-way-to-go_ZH_CN) ：参与该书的翻译和校对
- [the little go book 中文译本](https://github.com/songleo/the-little-go-book_ZH_CN) ：完成该书的翻译和校对

## 致谢

感谢您花时间阅读我的简历，期待能有机会和您共事。
