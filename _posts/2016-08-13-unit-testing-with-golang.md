---
layout: post
title: 关于单元测试（golang）
date: 2016-08-13 23:57:32
---

在最近的开发任务中，需要每个模块都写单元测试，由于之前开发没有写单元测试的习惯，突然要求写单元测试，还不知道从何入手，于是花了点时间学习如何写单元测试，收获很多，因此本文算是近期学习单元测试的总结，主要有以下4个方面：

1. 单元测试的定义

首先看看什么是单元测试(unit testing)，单元测试是将开发人员编写的一个完整的类、子程序或者小程序从完整的系统中隔离出来进行的测试。比如正在开发一个计算器，那么实现加法功能的子程序就可以从系统中隔离出来进行单元测试，当然前提是你写的代码具有可测性，我的理解是尽量模块化和函数功能单一。

2. 单元测试的好处

如果开发人员在开发过程中已经做了足够的单元测试，确保了单元测试的覆盖率，那么当这些类和子程序在组合使用或者被其他模块调用时就会确保少出现bug，当然要确保没有任何bug是不可能的。还是以开发计算器为例，如果实现加法、减法、乘法和除法的模块都已经做了充分的单元测试，那么这些模块组合在一起就能确保计算器能正常工作，不会出现很严重的bug，在一定程度上保证了软件的质量。

3. 单元测试应该包含哪些case

这里以一个判断有效机器名的函数为例，函数声明如下：

```
func IsValidHostName(hostName string) bool
```

有效的机器名规定如下如下：

> 机器名只能由小写字母组成，且机器名最短为4个字符，最长为8个字符

那么，根据以上规定，一个完备的单元测试case至少应该包含以下三种：

- 正向case

> 如`hostaa`和`hostbb`都是有效的机器名

- 负向case

> 如`Hostaa`(含有大写字母)、`host123`(含有数字)和`Host!`(包含叹号)都是无效的机器名

- 边界case

> 如`host`(满足最短机器名要求)和`hostabcd`(满足最长机器名要求)都是有效的机器名，但是`hos`(3个字符)和`hostabcde`(9个字符)都是无效的机器名

4. 单元测试怎么写

在写单元测试时，我个人认为至少满足以下2个条件：

- 很容易添加测试case
- 测试失败时，能通过输出信息快速判断失败原因

基于以上2个条件，我们开始构造测试数据，先定义一个测试数据的结构体，该结构体包含2个字段，输入`input`和期待输出`expectedOutput`，这里定义成空接口`interface{}`方便构造任何类型的输入和输出数据。

```
type testData struct {
    input          interface{}
    expectedOutput interface{}
}
```

按照3中列出的case，测试case如下(注：可以看到每行都是是一个完整的测试case，添加测试case极其容易)：

```
    testCaseList := []testData{
        // 正向case,每行是一个case
        {"hostaa", true},
        {"hostbb", true},
        {"host cc", true},

        //负向case,每行是一个case
        {"Hostaa", false},
        {"host123", false},
        {"host!", false},

        // 边界case，每行是一个case
        {"host", true},
        {"hostabcd", true},
        {"hos", false},
        {"hostabcde", false},
    }
```

测试失败时，打印的信息至少需要包含以下内容：

- 第几个测试case
- 输入和期待输出
- 实际输出

基于此，可以构造一个测试失败时的打印函数，例如：

```
func myTestFail(
    t *testing.T,
    testCase testData,
    actualOutput interface{},
    testCaseIndex int) {

    if actualOutput != testCase.expectedOutput.(bool) {
        t.Errorf("\n\ncase %+v:", testCaseIndex)
        t.Errorf("input = %+v", testCase.input)
        t.Errorf("expected output = %+v", testCase.expectedOutput)
        t.Errorf("actual output = %+v", actualOutput)
    }
}
```
当某个测试case失败时，打印如下：

```
--- FAIL: TestIsValidHostName (0.00s)
        demo_test.go:17:

                case 2:
        demo_test.go:18: input = host cc
        demo_test.go:19: expected output = true
        demo_test.go:20: actual output = false
```

从输出可以知道，第2个测试case失败，输入是`host cc`，期待输出是`true`，实际输出是`false`，很容易就能定位出失败原因：因为多输入了一个空格。

#####  附上完整代码：

- demo.go(需要单元测试的代码)

```
package demo

import "unicode"

func IsValidHostName(hostName string) bool {
    const (
        MIN_HOST_NAME_LEN = 4
        MAX_HOST_NAME_LEN = 8
    )

    hostNameLen := len(hostName)
    if hostNameLen < MIN_HOST_NAME_LEN || MAX_HOST_NAME_LEN < hostNameLen {
        return false
    }

    for _, char := range hostName {
        isLower := unicode.IsLower(char)
        if !isLower {
            return false
        }
    }

    return true
}

```

- demo_test.go(单元测试代码)


```
package demo

import "testing"

type testData struct {
    input          interface{}
    expectedOutput interface{}
}

func myTestFail(
    t *testing.T,
    testCase testData,
    actualOutput interface{},
    index int) {

    if actualOutput != testCase.expectedOutput.(bool) {
        t.Errorf("\n\ncase %+v:", index)
        t.Errorf("input = %+v", testCase.input)
        t.Errorf("expected output = %+v", testCase.expectedOutput)
        t.Errorf("actual output = %+v", actualOutput)
    }
}

func TestIsValidHostName(t *testing.T) {
    testCaseList := []testData{
        // 正向case,每行是一个case
        {"hostaa", true},
        {"hostbb", true},
        {"host cc", true},

        //负向case,每行是一个case
        {"Hostaa", false},
        {"host123", false},
        {"host!", false},

        // 边界case，每行是一个case
        {"host", true},
        {"hostabcd", true},
        {"hos", false},
        {"hostabcde", false},
    }

    for index, testCase := range testCaseList {
        actualOutput := IsValidHostName(testCase.input.(string))
        myTestFail(t, testCase, actualOutput, index)
    }
}

```

