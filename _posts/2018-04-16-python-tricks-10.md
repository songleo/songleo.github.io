---
layout: post
title: python技巧分享（十）
date: 2018-04-16 00:05:00
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 通过索引删除列表元素

```python
my_list = range(0, 10)
print my_list
# [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
del my_list[9]
print my_list
# [0, 1, 2, 3, 4, 5, 6, 7, 8]
del my_list[5:8]
print my_list
# [0, 1, 2, 3, 4, 8]
```

示例中，通过del语句，可以很方便删除列表中的某个元素或者部分元素。这里需要注意，指定的索引值不能大于列表最大长度-1，否则会抛出IndexError异常，另外，list对象的pop方法和remove方法也可以删除元素。

### 2 清空列表元素

```python
my_list = range(0, 10)
print my_list
# [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
print id(my_list)
# 87838600
del my_list[:]
print my_list
# []
print id(my_list)
# 87838600
```

清空一个列表有很多方式可以实现，但是借助del语句，可以不用生成新的列表对象。示例中可以看到，清空列表元素前和清空后，列表的id没有改变，即没有生成新的对象，可以继续使用该列表。

### 3 列表解析（list comprehensions）

```python
my_list = range(0, 10)
even_num_list = [e for e in my_list if not e % 2]
print even_num_list
# [0, 2, 4, 6, 8]
odd_num_list = [e for e in my_list if e % 2]
print odd_num_list
# [1, 3, 5, 7, 9]

# syntax: [ expression for target in iterable lc-clauses ]
```

列表解析很有用，一行代码就可以完成很多功能。示例中，借助列表解析，很方便就从列表中筛选出偶数和奇数，代码少且运行更快。如果使用其他方式实现，难免代码会多一些，并且性能也会差一些。

列表解析语法规则如下：

> [ expression for target in iterable lc-clauses ]

- lc-clauses表示以下语句，可以是0个或者多个：

> for target in iterable if expression

列表解析详见：https://docs.python.org/2/tutorial/datastructures.html#list-comprehensions
