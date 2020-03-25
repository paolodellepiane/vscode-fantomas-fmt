# fantomas-fmt README

vscode extension that uses the awesome [fantomas](https://github.com/fsprojects/fantomas) to format fsharp files.

## Requirements

- [dotnet core 2.1](https://www.microsoft.com/net/download)
- [fantomas-tool](https://github.com/fsprojects/fantomas)  
  If missing, the extension will try to install it automatically.
  In case of problem, try to install it manually by running the following command:
  ```
  dotnet tool install fantomas-tool -g
  ```

## Extension Settings

This extension contributes the following settings:

- `fantomas.indent`: set number of spaces for indentation (default = 4). The value should be between 1 and 10.
- `fantomas.pageWidth`: set the column where we break to new lines (default = 80). The value should be at least 60.
- `fantomas.semicolonEOL`: enable semicolons at the end of line (default = false).
- `fantomas.noSpaceBeforeArgument`: disable spaces before the first argument of functions when there are parenthesis (default = true). For methods and constructors, there are never spaces regardless of this option.
- `fantomas.spaceBeforeColon`: enable spaces before colons (default = false).
- `fantomas.noSpaceAfterComma`: disable spaces after commas (default = true).
- `fantomas.noSpaceAfterSemiColon`: disable spaces after semicolons (default = true).
- `fantomas.indentOnTryWith`: enable indentation on try/with block (default = false).
- `fantomas.noSpaceAroundDelimiter`: disable spaces after starting and before ending of lists, arrays, sequences and records (default = true).
- `fantomas.keepNewlineAfter`: set the max length of any expression in an if expression before formatting on multiple lines (default = 40).
- `fantomas.maxIfThenElseShortWidth`: set the max length of any expression in an if expression before formatting on multiple lines (default = 40).
- `fantomas.strictMode`: enable strict mode (ignoring directives and comments and printing literals in canonical forms) (default = false).

## Troubleshooting

1. **Format on save is not working**  
   Try to change setting "editor.formatOnSaveTimeout" to a higher value than 750 (e.g. 3000)

## License

MIT © Paolo Dellepiane
