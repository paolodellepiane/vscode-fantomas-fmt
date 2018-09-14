'use strict';
import * as vscode from 'vscode';
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

export function activate(context: vscode.ExtensionContext) {
  console.log('activating fantomas-fmt');

  let disposable = vscode.languages.registerDocumentFormattingEditProvider(
    { scheme: 'file', language: 'fsharp' },
    {
      provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
          return [];
        }
        let formatted = runFantomas(editor.document.fileName, path.join(context.extensionPath, 'fantomas.tmp'));
        if (formatted) {
          const firstLine = document.lineAt(0);
          const lastLine = document.lineAt(document.lineCount - 1);
          const range = new vscode.Range(firstLine.range.start, lastLine.range.end);
          return [vscode.TextEdit.replace(range, formatted.toString())];
        }
      }
    }
  );

  context.subscriptions.push(disposable);

  function getFantomasArgs() {
    const keys = { 
        ['indent']: 4, 
        ['pageWidth']: 80, 
        ['preserveEOL']: false, 
        ['semicolonEOL']: false, 
        ['noSpaceBeforeArgument']: true, 
        ['noSpaceBeforeColon']: true, 
        ['noSpaceAfterComma']: true, 
        ['noSpaceAfterSemiColon']: true };
    const cfg = vscode.workspace.getConfiguration('fantomas');
    return Object.keys(keys)
        .filter(k => cfg.get(k, keys[k]) !== false)
        .reduce(
            (arr, k) => {
                const val = cfg.get(k, keys[k]);
                return val === true ? [...arr, '--' + k] : [...arr, '--' + k, val];
            },
            []);
  }

  function checkFantomas() {
    let result = run('dotnet tool list -g');
    return result.output && result.output.includes('fantomas-tool');
  }

  function installFantomas() {
    let result = run('dotnet tool install fantomas-tool -g');
    return result.output;
  }

  let installed = checkFantomas();

  if (installed) {
    console.log('fantomas-tool found');
  }

  if (!installed && !installFantomas()) {
    console.error("Can't install Fantomas. Please install it manually and restart Visual Studio Code");
    vscode.window.showErrorMessage("Can't install Fantomas. Please install it manually and restart Visual Studio Code");
    return;
  }

  function run(cmd: any): { output?: string; err?: string } {
    try {
      let output = cp.execSync(cmd);
      console.log(output.toString());
      return { output: output.toString() };
    } catch (e) {
      console.log(e);
      return { err: e.toString() };
    }
  }

  function runFantomas(input: string, output: string) {
    try {
      fs.unlinkSync(output);
    } catch {
      console.error('error deleting tmp file');
    }
    let cfg = getFantomasArgs();
    cp.spawnSync('fantomas', [input, '--out ' + output, ...cfg], { shell: true, hideWindows: true, detached: true });
    try {
      return fs.readFileSync(output);
    } catch (ex) {
      vscode.window.showErrorMessage("can't read formatted output");
      console.error(ex.message);
      return null;
    }
  }
}

export function deactivate() {}
