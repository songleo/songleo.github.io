---
layout: post
title: python技巧分享（三）
date: 2018-01-29 12:05:01
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 如何去掉list中重复元素

- 推荐方式

```
my_list = [3, 2, 1, 1, 2, 3]
print my_list
# [3, 2, 1, 1, 2, 3]
unique_list = list(set(my_list))
print unique_list
# [1, 2, 3]
```

或者

```
from collections import OrderedDict


my_list = [3, 2, 1, 1, 2, 3]
print my_list
# [3, 2, 1, 1, 2, 3]
unique_list = list(OrderedDict.fromkeys(my_list))
print unique_list
# [3, 2, 1]
```

前一种方式会导致去重后list元素顺序和原始list不一致，后一种方式将list元素顺序保留。


### 2 如何读取dict中的值

- 不推荐方式

```
url_dict = {
    'google': 'https://www.google.com/',
    'github': 'https://github.com/',
    'facebook': 'https://www.facebook.com/',
}


print url_dict['facebook']
print url_dict['google']
print url_dict['github']
# print url_dict['baidu']
# KeyError: 'baidu'

# https://www.facebook.com/
# https://www.google.com/
# https://github.com/
```

- 推荐方式

```
url_dict = {
    'google': 'https://www.google.com/',
    'github': 'https://github.com/',
    'facebook': 'https://www.facebook.com/',
}

print url_dict.get('facebook', 'https://www.google.com/')
print url_dict.get('google', 'https://www.google.com/')
print url_dict.get('github', 'https://www.google.com/')
print url_dict.get('baidu', 'https://www.google.com/')

# https://www.facebook.com/
# https://www.google.com/
# https://github.com/
# https://www.google.com/
```

前一种方式读取一个不存在的key时，会导致KeyError，例如print url_dict['baidu']，因为字典中不存在baidu，所以会导致KeyError。后一种方式使用字典的get方法，如果key不存在，不会产生KeyError，如果给了默认值，会返回默认值，否则返回None。

### 3 如何排序字典

- 推荐方式

```
unordered_dict = {'c': 1, 'b': 2, 'a': 3}

print sorted(unordered_dict.items(), key=lambda e: e[1])
# [('c', 1), ('b', 2), ('a', 3)]

print sorted(unordered_dict.items(), key=lambda e: e[0])
# [('a', 3), ('b', 2), ('c', 1)]

print sorted(unordered_dict.items(), key=lambda e: e[1], reverse=True)
# [('a', 3), ('b', 2), ('c', 1)]
```

前一种方式是按字典的value升序排序，第二种方式是按字典的key升序排序，第三种方式是按字典的value降序排序，和前一种方式相反，因为指定了参数reverse为True。sorted函数功能挺强大，不止可以排序字典，任何iterable对象都可以排序，如果想深入了解请戳https://docs.python.org/2.7/howto/sorting.html#sortinghowto。