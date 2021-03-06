---
layout: post
title: coding感想（一）
date: 2016-12-13 19:11:32
---

工作一年多了，项目中真正写代码的时间其实并不多，更多时候是在调试代码或者维护已有代码。调试代码或者维护已有代码难免要去读代码，如果是自己写的代码，那么读不懂只能怪自己写得不好，如果是别人写的代码，读不懂也只能怪自己，技不如人呗，开个玩笑而已，读不懂别人的代码说不定不是你的问题，也许是别人写的代码易读性和可维护性都不好，才导致你读起来费劲，难以理解。所以我结合自己的coding和debug经验，谈谈一些关于写代码的想法，先从以下3点谈起：

- DRY（Don't Repeat Yourself）原则
- 一致性
- 可读性

别看都是一些很简单的规则，但你未必就遵循。

### 1) DRY原则

写代码如果不遵守DRY原则，可以说代码就是“bug之源”。编程很大程度上就是为了让电脑代替人类进行一些重复性的工作。作为一个程序员，你连自己的重复性工作都解决不了，还指望你开发的软件能很好代替人类工作，说出来真的怕被笑话。为什么需要定义类和方法，为什么需要定义函数，为什么需要库，为什么需要框架，这些东西存在的部分原因就是为了消灭重复代码，提高代码的可维护性。如果你写的代码中遍布重复的代码，那么当你需要修改重复部分代码时，必须修改所有重复的部分，少一个地方都会导致bug，这绝对是代码维护人员的噩梦。

所以，如果在代码中有很多重复的数据，应该将这些数据封装成类或者结构体，减少重复代码；如果代码中有部分重复了，那么就应该将重复部分抽取成一个函数，供重复地方调用；如果项目中几个人开发的代码有很多重复性代码，那么就应该将重复部分代码抽取出来，定义成一个库或者模块，供大家调用。总之谨记，千万不要写重复的代码。

### 2) 一致性

再来聊聊一致性，一致性为什么那么重要，先用公交卡举个例子，我们每天上班坐公交都需要刷公交卡，如果刷完公交卡，随手就将公交卡放进口袋里面或者钱包里面，又或者随声携带的包里面。也就是说每次刷完卡后，没有将公交卡放在一个固定的地方，那么当某天你急匆匆的赶上公交车，满身搜寻公交卡时，你就会明白一致性的重要性。如果每次刷完公交卡都放固定的地方，就不会出现找不到的情况。这个例子也许有点牵强，但确实能说明前后一致是多么重要。

那么在写代码时，何为一致性呢？举个例子，比如刚开始定义了2个常量，并且是以大写字母加下划线构成常量名称，例如：

    MAX_NAME_LEN = 10000
    DEFAULT_NAME = "DEFAULT"

再过段时间，又定义常量：

    MaxArrayLen = 10000
    DefaultItem = "Item"

又定义常量：

    max_id_len = 10000
    default_id = 0

可以看见，三次常量定义的命名规则都不一样，别人读你的代码时，都分不清什么是常量什么是变量。如果你遵循一种命名规则定义常量，那么一看就知道这是变量还是常量，也许你觉得这个例子很简单，一般人都会遵守，我再举个例子，变量定义：

    int hostNum;

上面定义了一个变量hostNum，表示host的数量。这时候你又定义了一个变量，表示资源数量，例如：

    int numResource

两次定义的变量中，表示数量的number单词一个在前，一个在后，别人读起来就容易产生误解。因为一般情况下num放在变量尾部表示索引，即hostNum表示第几个host，num放在变量开始位置表示总数，即numHost表示有多少个host。

所以，平时写代码时，保持前后一致性是非常重要的，如果是在现有项目基础上开发，那么最好和之前的编码风格保持一致；如果是一个从零开始构建的新项目，那么最好在项目开始之前就统一编码风格，否则到项目后期阶段再修改代价就大了。

### 3) 可读性

可读性这个话题其实包含了上面提到DRY原则和一致性原则，写代码时遵循DRY原则和一致性原则，在一定程度上肯定能提高代码的可读性。但是我个人认为，可读性不单指代码的可读性，如果是一个比较大的项目，可读性还体现在代码目录结构、模块划分、目录命名和文件命名等上面。所以我认为可读性好的代码，至少应该在以下6个方面得到体现：

- 变量命名，比如totalHost、hostIndex、hostId;
- 类或者结构体命名，比如Encoder、Decoder、Marshaler;
- 函数或者方法命名，比如ToLower、ToUpper、ToTitle;
- 库或者模块命名，比如os、sys、file;
- 源代码文件命名，比如io.go、ioutil.go、log.go;
- 源代码目录命名，比如lib、bin、api;

本次分享就到这里，下次再继续~

#### 本次荐书：编程人生

![image](https://img12.360buyimg.com/n7/jfs/t760/204/6411790/154557/996c0759/547c476eN18c67044.jpg)

