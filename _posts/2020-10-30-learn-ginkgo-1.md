---
layout: post
title: ginkgo学习（一）
date: 2020-10-30 00:12:05
---

### 创建测试套件

```
$ mkdir books
$ cd books/
$ ginkgo bootstrap
Generating ginkgo test suite bootstrap for books in:
	books_suite_test.go
$ cat books_suite_test.go
package books_test

import (
	"testing"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

func TestBooks(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Books Suite")
}
```

### 验证测试套件

```
$ go mod init books
go: creating new go.mod: module books
$ ginkgo
go: finding module for package github.com/onsi/ginkgo
go: finding module for package github.com/onsi/gomega
go: found github.com/onsi/ginkgo in github.com/onsi/ginkgo v1.14.2
go: found github.com/onsi/gomega in github.com/onsi/gomega v1.10.3

Running Suite: Books Suite
==========================
Random Seed: 1604039540
Will run 0 of 0 specs


Ran 0 of 0 Specs in 0.000 seconds
SUCCESS! -- 0 Passed | 0 Failed | 0 Pending | 0 Skipped
PASS

Ginkgo ran 1 suite in 5.449229856s
Test Suite Passed
```

### 添加测试用例

```
$ ginkgo generate book
Generating ginkgo test for Book in:
  book_test.go

$ cat book_test.go
package books_test

import (
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

type Book struct {
	Title  string
	Author string
	Pages  int
}

func (b *Book) CategoryByLength() string {

	if b.Pages >= 300 {
		return "NOVEL"
	}

	return "SHORT STORY"
}

var _ = Describe("Book", func() {
	var (
		longBook  Book
		shortBook Book
	)

	BeforeEach(func() {
		longBook = Book{
			Title:  "Les Miserables",
			Author: "Victor Hugo",
			Pages:  1488,
		}

		shortBook = Book{
			Title:  "Fox In Socks",
			Author: "Dr. Seuss",
			Pages:  24,
		}
	})

	Describe("Categorizing book length", func() {
		Context("With more than 300 pages", func() {
			It("should be a novel", func() {
				Expect(longBook.CategoryByLength()).To(Equal("NOVEL"))
			})
		})

		Context("With fewer than 300 pages", func() {
			It("should be a short story", func() {
				Expect(shortBook.CategoryByLength()).To(Equal("SHORT STORY"))
			})
		})
	})
})
```

### 运行测试用例

```
$ ginkgo
Running Suite: Books Suite
==========================
Random Seed: 1604040377
Will run 2 of 2 specs

••
Ran 2 of 2 Specs in 0.000 seconds
SUCCESS! -- 2 Passed | 0 Failed | 0 Pending | 0 Skipped
PASS

Ginkgo ran 1 suite in 1.65225881s
Test Suite Passed
```

### ref

http://onsi.github.io/ginkgo/#getting-started-writing-your-first-test
