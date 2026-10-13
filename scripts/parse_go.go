// Run with: GO111MODULE=off go run scripts/parse_go.go -- backend
package main

import (
	"fmt"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	root := "backend"
	if len(os.Args) > 1 {
		root = os.Args[len(os.Args)-1]
	}
	count := 0
	err := filepath.Walk(root, func(path string, info os.FileInfo, e error) error {
		if e != nil {
			return e
		}
		if info.IsDir() || !strings.HasSuffix(path, ".go") {
			return nil
		}
		if _, e := parser.ParseFile(token.NewFileSet(), path, nil, parser.AllErrors); e != nil {
			return fmt.Errorf("%s: %w", path, e)
		}
		count++
		return nil
	})
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if count == 0 {
		fmt.Fprintln(os.Stderr, "no Go source files found")
		os.Exit(1)
	}
	fmt.Printf("PASS: parsed %d Go files (syntax only, not compilation)\n", count)
}
