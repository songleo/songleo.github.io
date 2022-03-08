
1 string to slice

```golang
b := []byte("ABC€")
fmt.Println(b) // [65 66 67 226 130 172]

s := string([]byte{65, 66, 67, 226, 130, 172})
fmt.Println(s) // ABC€
```


2

```
	timer := time.NewTicker(6*time.Minute)
	for range timer.C {
		go func1()
		go func2()
	}
```

3

```
// Go program to illustrate the
// concept of the promoted fields
package main

import "fmt"

// Structure
type details struct {

	// Fields of the
	// details structure
	name string
	age int
	gender string
}

// Nested structure
type student struct {
	branch string
	year int
	details
}

func main() {

	// Initializing the fields of
	// the student structure
	values := student{
		branch: "CSE",
		year: 2010,
		details: details{

			name: "Sumit",
			age: 28,
			gender: "Male",
		},
	}

	// Promoted fields of the student structure
	fmt.Println("Name: ", values.name)
	fmt.Println("Age: ", values.age)
	fmt.Println("Gender: ", values.gender)

	// Normal fields of
	// the student structure
	fmt.Println("Year: ", values.year)
	fmt.Println("Branch : ", values.branch)
}

```
- https://yourbasic.org/golang/convert-string-to-byte-slice/


## https://zhwt.github.io/yaml-to-go/
