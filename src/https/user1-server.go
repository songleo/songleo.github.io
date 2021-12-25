package main

import (
	"fmt"
	"net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "I am user1\n")
}

func main() {
	http.HandleFunc("/", handler)
	http.ListenAndServeTLS(
		":8080",
		"user1.crt",
		"user1.key",
		nil)
}
