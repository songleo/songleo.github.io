---
layout: post
title: python技巧分享（四）
date: 2018-01-30 12:05:01
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 如何打印更易读的类

- 不推荐方式

```python
class Point(object):
    def __init__(self, x, y):
        self.x = x
        self.y = y


p = Point(3, 4)

print p
# <__main__.Point object at 0x0000000001E1B9E8>
```

- 推荐方式

```python
class Point(object):
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return 'Point({self.x}, {self.y})'.format(self=self)


p = Point(3, 4)

print p
# Point(3, 4)
```

前一种方式打印的类不易读，不能获取更多的信息。通过类的__repr__方法可以将类打印得更易读。或者不定义__repr__方法，直接使用下面方式打印：

```python
print p.__dict__
# {'y': 4, 'x': 3}
```

使用__dict__方法，将类以字典形式打印出来，也比较易读。

### 2 如何将类打印成json字符串

- 推荐方式

```python
import json


class User(object):
    def __init__(self, name, id):
        self.name = name
        self.id = id


u = User('user1', 1)
print json.dumps(u.__dict__, indent=4)

'''
{
    "name": "user1",
    "id": 1
}
'''
```

通过json模块的dumps方法，可以轻易将类打印成json字符串。

### 3 如何排序类列表

- 推荐方式

```python
class User:
    def __init__(self, name, key):
        self.name = name
        self.key = key

    def __repr__(self):
        return 'User({self.name}, {self.key})'.format(self=self)


user_list = [
    User('user1', 3),
    User('user2', 2),
    User('user3', 1),
]

print sorted(user_list, key=lambda user: user.key)
# [User(user3, 1), User(user2, 2), User(user1, 3)]
print sorted(user_list, key=lambda user: user.name)
# [User(user1, 3), User(user2, 2), User(user3, 1)]
```

这里排序的方法和字典排序类似，第一种是按user的key升序排序，第二种是按user的name升序排序。其实还支持名字相同，再按key进行排序，如下：

```python
user_list = [
    User('user1', 3),
    User('user1', 2),
    User('user1', 1),
]

print sorted(user_list, key=lambda user: (user.name, user.key))
# [User(user1, 1), User(user1, 2), User(user1, 3)]
```
