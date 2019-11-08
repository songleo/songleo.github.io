
1 string to slice

```golang
b := []byte("ABC€")
fmt.Println(b) // [65 66 67 226 130 172]

s := string([]byte{65, 66, 67, 226, 130, 172})
fmt.Println(s) // ABC€
```

- https://yourbasic.org/golang/convert-string-to-byte-slice/
