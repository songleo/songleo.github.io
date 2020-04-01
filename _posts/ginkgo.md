
```
$ go get github.com/onsi/ginkgo/ginkgo
$ go get github.com/onsi/gomega/...

$ cd /Users/ssli/share/git/go_practice/ginkgo-demo/books
ssli@sslis-MacBook-Pro-4:books$ ginkgo bootstrap
Generating ginkgo test suite bootstrap for books in:
	books_suite_test.go
ssli@sslis-MacBook-Pro-4:books$ cat books.go
package books

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

ssli@sslis-MacBook-Pro-4:books$ ginkgo
Running Suite: Books Suite
==========================
Random Seed: 1585724103
Will run 0 of 0 specs


Ran 0 of 0 Specs in 0.000 seconds
SUCCESS! -- 0 Passed | 0 Failed | 0 Pending | 0 Skipped
PASS

Ginkgo ran 1 suite in 2.861956292s
Test Suite Passed

ssli@sslis-MacBook-Pro-4:books$ ginkgo generate book
Generating ginkgo test for Book in:
  book_test.go

ssli@sslis-MacBook-Pro-4:books$ cat book_test.go
package books_test

import (
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"

	. "github.com/songleo/go_practice/ginkgo-demo/books"
)

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

ssli@sslis-MacBook-Pro-4:books$ ginkgo
Running Suite: Books Suite
==========================
Random Seed: 1585724693
Will run 2 of 2 specs

••
Ran 2 of 2 Specs in 0.000 seconds
SUCCESS! -- 2 Passed | 0 Failed | 0 Pending | 0 Skipped
PASS

Ginkgo ran 1 suite in 1.192859137s
Test Suite Passed
```




### ref

https://www.ginkgo.wiki/
