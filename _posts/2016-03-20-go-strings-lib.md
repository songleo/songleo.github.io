---
layout: post
title: go语言strings库总结
date: 2016-03-20 00:28:32
---

最近由于用go做字符串处理，用到了go的strings库，借此对go strings库做个总结，将go strings中所有函数的功能做一个简单的说明，当然，这是一个重复造轮子的过程，因为go语言标准库已经有中文版了。

详见：https://studygolang.com/pkgdoc

所以写本文主要有以下2个目的，其一，熟悉编程语言字符串处理方法。大多数语言的字符串处理库提供的函数都大同小异，且越高级的语言提供的函数越多，比如c提供的字符串处理函数go基本都有，但是go提供的c未必有。其实定义了基本的字符串处理函数后，更高级字符串处理函数都是通过封装基本的处理函数实现。所以熟悉go strings库后基本就能熟悉大多语言的strings库了。其二，学习标准库的命名方式。命名是计算机科学最难的二件事之一，另外一件事是缓存失效。可见命名在编程中重要性。作为一个刚入门的程序员，熟悉标准库的函数命名方式后，以后可以参考其命名方式，因为写代码很多时候都是在想一个合适的函数名、方法名和变量名等。

## 函数列表

- Compare(a, b string) int

按字典顺序比较a和b字符串大小

- func Contains(s, substr string) bool

判断字符串s是否包含substr字符串

- func ContainsAny(s, chars string) bool

判断字符串s是否包含chars字符串中的任一字符

- func ContainsRune(s string, r rune) bool

判断字符串s是否包含unicode码值r

- func Count(s, sep string) int

返回字符串s包含字符串sep的个数

- func EqualFold(s, t string) bool

判断s和t两个utf8字符串是否相等，忽略大小写

- func Fields(s string) []string

将字符串s以空白字符分割，返回一个切片

- func FieldsFunc(s string, f func(rune) bool) []string

将字符串s以满足f(r)==true的字符分割，返回一个切片

- func HasPrefix(s, prefix string) bool

判断字符串s是否有前缀字符串prefix

- func HasSuffix(s, suffix string) bool

判断字符串s是否有前缀字符串suffix

- func Index(s, sep string) int

返回字符串s中字符串sep首次出现的位置

- func IndexAny(s, chars string) int

返回字符串chars中的任一unicode码值r在s中首次出现的位置

- func IndexByte(s string, c byte) int

返回字符串s中字符c首次出现位置

- func IndexFunc(s string, f func(rune) bool) int

返回字符串s中满足函数f(r)==true字符首次出现的位置

- func IndexRune(s string, r rune) int

返回unicode码值r在字符串中首次出现的位置

- func Join(a []string, sep string) string

将a中的所有字符串连接成一个字符串，使用字符串sep作为分隔符

- func LastIndex(s, sep string) int

返回字符串s中字符串sep最后一次出现的位置

- func LastIndexAny(s, chars string) int

返回字符串s中任意一个unicode码值r最后一次出现的位置

- func LastIndexByte(s string, c byte) int

返回字符串s中字符c最后一次出现的位置

- func LastIndexFunc(s string, f func(rune) bool) int

返回字符串s中满足函数f(r)==true字符最后一次出现的位置

- func Map(mapping func(rune) rune, s string) string

将字符串s中的每个字符r按函数mapping(r)的规则转换并返回

- func Repeat(s string, count int) string

将字符串s重复count次返回

- func Replace(s, old, new string, n int) string

替换字符串s中old字符为new字符并返回，n<0是替换所有old字符串

- func Split(s, sep string) []string

将字符串s以sep作为分隔符进行分割，分割后字符最后去掉sep

- func SplitAfter(s, sep string) []string

将字符串s以sep作为分隔符进行分割，分割后字符最后附上sep

- func SplitAfterN(s, sep string, n int) []string

将字符串s以sep作为分隔符进行分割，分割后字符最后附上sep，n决定返回的切片数

- func SplitN(s, sep string, n int) []string

将字符串s以sep作为分隔符进行分割，分割后字符最后去掉sep，n决定返回的切片数

- func Title(s string) string

将字符串s每个单词首字母大写返回

- func ToLower(s string) string

将字符串s转换成小写返回

- func ToLowerSpecial(_case unicode.SpecialCase, s string) string

将字符串s中所有字符按_case指定的映射转换成小写返回

- func ToTitle(s string) string

将字符串s转换成大写返回

- func ToTitleSpecial(_case unicode.SpecialCase, s string) string

将字符串s中所有字符按_case指定的映射转换成大写返回

- func ToUpper(s string) string

将字符串s转换成大写返回

- func ToUpperSpecial(_case unicode.SpecialCase, s string) string

将字符串s中所有字符按_case指定的映射转换成大写返回

- func Trim(s string, cutset string) string

将字符串s中首尾包含cutset中的任一字符去掉返回

- func TrimFunc(s string, f func(rune) bool) string

将字符串s首尾满足函数f(r)==true的字符去掉返回

- func TrimLeft(s string, cutset string) string

将字符串s左边包含cutset中的任一字符去掉返回

- func TrimLeftFunc(s string, f func(rune) bool) string

将字符串s左边满足函数f(r)==true的字符去掉返回

- func TrimPrefix(s, prefix string) string

将字符串s中前缀字符串prefix去掉返回

- func TrimRight(s string, cutset string) string

将字符串s右边包含cutset中的任一字符去掉返回

- func TrimRightFunc(s string, f func(rune) bool) string

将字符串s右边满足函数f(r)==true的字符去掉返回

- func TrimSpace(s string) string

将字符串s首尾空白去掉返回

- func TrimSuffix(s, suffix string) string

将字符串s中后缀字符串prefix去掉返回

## 参考文献

- http://docs.studygolang.com/pkg/strings/
- https://studygolang.com/pkgdoc
