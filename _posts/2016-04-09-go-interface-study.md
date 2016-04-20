---
layout: post
title: go语言接口学习
date: 2016-04-09 23:40:32
---

刚开始学习go语言的时候，看代码中某个类型实现了Error()方法，然后就可以将该类型赋值给error类型。当时还没学习接口，不懂为什么可以这样赋值。学习接口以后，才明白怎么回事。查看go源码，发现内置类型error其实是一个接口类型，并实现了Error()方法，如下：

```go
type error interface {
    Error() string
}
```

所以任何类型，只要实现了Error()方法，就可以将该类型的值赋值给error类型。

go语言提供了一种接口类型interface，通过接口可以实现面向对象中一些特性，例如多态。go的接口只是一组方法的声明，抽象的定了对象的行为，并不具体实现。例如：

```go
type Shaper interface {
    Area() int
    Perimeter() int
}
```

go语言中的接口都很简短，通常它们会包含0个、最多3个方法。这里定义了一个接口类型Shaper，并声明了2个方法Area()和Perimeter()，但是未给出Area()和Perimeter()方法的具体实现。如果某个类型实现了Area()和Perimeter()方法，就可以说该类型实现了Shaper接口，于是可以将该类型的实例赋值给Shaper类型变量。例如：

```go
type Square struct {
    a int
}

func (s *Square) Area() int {
    return s.a * s.a
}

func (s *Square) Perimeter() int {
    return s.a * 4
}

square := new(Square)
square.a = 3

var shape Shaper
shape = square
```

这里定义了一个结构体Square，并实现了Area()和Perimeter()方法。然后就可以将Shaper类型的值赋给接口shape。即任何类型，只要实现了Area()和Perimeter()方法，都可以将值赋值给Shaper类型变量。然后通过该接口类型，就可以调用相应类型的Area()和Perimeter()方法。即实现了同一种类型在不同的实例上表现不同的行为。go通过接口实现了duck-typing。如果一个对象走路像鸭子，游泳也像鸭子，叫声也像鸭子，那么该对象就可以被称作为鸭子。这里的Square类型实现了Area()和Perimeter()方法，所以它也可以称作是Shaper类型。

特别需要指出的是，go提供了一种类似c语言中的void*类型，即空接口。空接口不包含任何方法。可以存储任意类型的数值，当我们需要存储任意类型的值时很有用。例如：

```go
type AnyShape interface{}
var anyShape AnyShape
anyShape = square
```

声明了一个空接口类型anyShape，可以将Square类型的square赋值给它。但是在使用过程中需要进行类型断言，主要有2中方式，一个是使用switch，另外一种方式是使用if语句。

下面给出一个完整的示例，该示例定义了三个类型Square、Rectangle和RightTriangle。分别对应正方形、矩形和直角三角形。并在相应的类型上实现了求面积和求周长的方法：Area()和Perimeter()。然后定义了一个接口类型Shaper，并声明了方法Area()和Perimeter()。即三个类型Square、Rectangle和RightTriangle都实现了接口Shaper。然后定义了一个空接口AnyShape类型。通过switch和if简单实现了接口的类型断言。最后使用结构体实例、接口Shaper和空接口AnyShape调用Area()方法实现了计算不同图形的面积。

```go
package main

import (
    "fmt"
)

type Square struct {
    a int
}

func (s *Square) Area() int {
    return s.a * s.a
}

func (s *Square) Perimeter() int {
    return s.a * 4
}

type Rectangle struct {
    a int
    b int
}

func (r *Rectangle) Area() int {
    return r.a * r.b
}

func (r *Rectangle) Perimeter() int {
    return (r.a + r.b) * 2
}

type RightTriangle struct {
    a int
    b int
    // c is hypotenuse
    c int
}

func (r *RightTriangle) Area() int {
    return r.a * r.b / 2
}

func (r *RightTriangle) Perimeter() int {
    return r.a + r.b + r.c
}

type Shaper interface {
    Area() int
    Perimeter() int
}

type AnyShape interface{}

func main() {

    square := new(Square)
    square.a = 12

    rectangle := new(Rectangle)
    rectangle.a = 12
    rectangle.b = 5

    rightTriangle := new(RightTriangle)
    rightTriangle.a = 3
    rightTriangle.b = 4
    rightTriangle.c = 5

    fmt.Println("(1) call struct method:")
    fmt.Println("square area is: ", square.Area())
    fmt.Println("rectangle area is: ", rectangle.Area())
    fmt.Println("right triangle area is: ", rightTriangle.Area())

    fmt.Println("\n(2) via interface:")
    var shape Shaper
    shape = square
    fmt.Println("square area is: ", shape.Area())
    shape = rectangle
    fmt.Println("rectangle area is: ", shape.Area())
    shape = rightTriangle
    fmt.Println("right triangle area is: ", shape.Area())

    fmt.Println("\n(3) via empty interface:")
    var anyShape AnyShape
    anyShape = square
    fmt.Println("square area is: ", anyShape.(*Square).Area())
    anyShape = rectangle
    fmt.Println("rectangle area is: ", anyShape.(*Rectangle).Area())
    anyShape = rightTriangle
    fmt.Println("right triangle area is: ", anyShape.(*RightTriangle).Area())

    fmt.Println("\n(4) type assertions via switch:")
    switch shape := anyShape.(type) {
    case *RightTriangle:
        fmt.Printf("shape type is: %T\n", shape)
        fmt.Println("rectangle area is: ", shape.Area())
    default:
        fmt.Printf("unknown type %T\n", shape)
    }

    fmt.Println("\n(5) type assertions via comma, ok pattern:")
    anyShape = rectangle
    if shape, ok := anyShape.(*Rectangle); ok {
        fmt.Printf("shape type is: %T\n", shape)
        fmt.Println("rectangle area is: ", shape.Area())
    } else {
        fmt.Printf("unknown type %T\n", shape)
    }
}
```

输出：

```go
(1) call struct method:
square area is:  144
rectangle area is:  60
right triangle area is:  6

(2) via interface:
square area is:  144
rectangle area is:  60
right triangle area is:  6

(3) via empty interface:
square area is:  144
rectangle area is:  60
right triangle area is:  6

(4) type assertions via switch:
shape type is: *main.RightTriangle
rectangle area is:  6

(5) type assertions via comma, ok pattern:
shape type is: *main.Rectangle
rectangle area is:  60
```

## 参考

《the way to go》

