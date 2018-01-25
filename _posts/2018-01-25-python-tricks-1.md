---
layout: post
title: python技巧分享（一）
date: 2018-01-25 21:55:32
---

这是一个系列文章，专门分享python的使用技巧和建议，每次分享3点，希望你能有所收获。

### 1 如何创建指定长度且有特定值的list

- 不推荐方式

```
list1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
print list1
# [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
```

- 推荐方式

```
list1 = [0] * 10
print list1
# [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
```

其实，第一种凡事一看就不符合DRY（Don’t Repeat Yourself）原则，稍微想想就知道还有更优雅的做法。如果是元组呢？只需要将[0]改成(0,)即可，千万不要忘记0后面的逗号。另外，这里不止支持数字，其实可以是任意对象组成的list或者tuple。例如：

```
class User(object):
    pass


user_list = [User()] * 10
```

### 2 如何连接字符串

- 不推荐方式

```
def plus_str():
    str_list = ['1'] * 10000
    long_str = ''
    for str in str_list:
        long_str = long_str + str
    return long_str
```

- 推荐方式

```
def join_str():
    str_list = ['1'] * 10000
    return ''.join(str_list)
```

使用加号方式连接字符串，效率底下，因为会频繁的拷贝字符串和分配内存，比较耗时。但是使用join方式连接字符串，只需要分配一次内存，并将所有待连接的字符串拷贝到内存空间，效率更高。在我的电脑上，测试2个函数的耗时，当执行10000次时，前者耗时是后者约24倍，代码如下：

```
print timeit(stmt="plus_str()",
             setup="from __main__ import plus_str",
             number=10000)

// 输出：42.7354210396

print timeit(stmt="join_str()",
             setup="from __main__ import join_str",
             number=10000)

// 输出： 1.78316799643
```


### 3 如何合并字典

- 不推荐方式

```
dict1 = {'a': 1, 'b': 2, 'c': 3}
dict2 = {'a': 4, 'b': 5, 'g': 6}
dict1.update(dict2)
merged_dict = dict1
print merged_dict
# {'a': 4, 'c': 3, 'b': 5, 'g': 6}
```

- 推荐方式

```
dict1 = {'a': 1, 'b': 2, 'c': 3}
dict2 = {'d': 4, 'f': 5, 'g': 6}
merged_dict = dict(dict1, **dict2)
print merged_dict
# {'a': 1, 'c': 3, 'b': 2, 'd': 4, 'g': 6, 'f': 5}
```

前一种方式会将源字典dict1修改，有一定的副作用。后面这张方式不会修改源字典，没有副作用。如果有重复的key值，按从右到左的顺序覆盖，例如：

```
dict1 = {'a': 1, 'b': 2, 'c': 3}
dict2 = {'a': 4, 'b': 5, 'g': 6}
merged_dict = dict(dict1, **dict2)
print merged_dict
# {'a': 4, 'c': 3, 'b': 5, 'g': 6}
```
使用右边参数dict2的key值覆盖dict1的key值。

通过内建函数dict，将2个字典作为参数传递给该函数，创建一个新字典。需要特别指出的是，第二个参数dict2需要加上2个星号，这里表示该参数是一个具名参数，并且类型是字典。因为dict函数创建字典时，可以接受多个参数，这是python函数支持可变参数的规定格式。


