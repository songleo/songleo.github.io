---
layout: post
title: python技巧分享（十一）
date: 2018-06-16 00:05:00
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 遍历list时每次读取2个元素

```python
my_list = [0, 'apple', 1, 'banana', 2, 'grape', 3, 'pear']
my_iter = iter(my_list)
for e in my_iter:
    print e, next(my_iter)

'''
0 apple
1 banana
2 grape
3 pear
'''
```

借助iter函数，传入list生成一个迭代器，然后遍历该迭代器，并调用next函数输出迭代器的下一个元素，到达每次读取list中2个元素的目的。需要说明一下，list的元素最好是偶数个，否则读取最后一对元素时，会由于迭代器元素已经读取完毕，导致抛出StopIteration异常。

### 2 split字符串时忽略引号中的空格

```python
import shlex

my_str = 'a b c "d e f" g'
print shlex.split(my_str)
# ['a', 'b', 'c', 'd e f', 'g']

print my_str.split()
# ['a', 'b', 'c', '"d', 'e', 'f"', 'g']
```

示例中，通过shlex.split函数，在split带有引号的字符串时，会自动忽略引号中的空格，将引号中的字符串当成一个完整字符串。如果使用字符串自带的split函数，会发现引号中字符串被split成3段，如果字符串中有空格，且想单独split成一个元素，就可以通过该方式实现。

### 3 遍历list时同时获取索引和值

```python
my_list = ['a', 'b', 'c', 'd']
for idx, ch in enumerate(my_list):
    print idx, ch

print '-' * 3

for idx, ch in enumerate(my_list, 1):
    print idx, ch

'''
0 a
1 b
2 c
3 d
---
1 a
2 b
3 c
4 d
'''
```

有时候遍历list时，需要获取元素的索引值，借助enumerate函数，可以轻易实现该功能，并且enumerate函数还可以指定索引值的初始值，由示例中可以看到，当指定了索引的起始值为1时，索引值是在1的基础之上依次自增，默认索引值是从0开始，所以可以同时获取到list元素的索引和值。

