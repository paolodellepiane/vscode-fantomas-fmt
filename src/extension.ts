'use strict';
import * as vscode from 'vscode';
import { runOnShell, runOnTerminal, log, logerr } from './runner';
const fs = require('fs');
const path = require('path');

export function activate(context: vscode.ExtensionContext) {
  log('activating fantomas-fmt');

  let disposable = vscode.languages.registerDocumentFormattingEditProvider(
    { scheme: 'file', language: 'fsharp' },
    {
      async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
          return [];
        }
        try {
          let formatted = await runFantomas(editor.document.fileName, getFantomasArgs(), 10000);
          if (formatted) {
            const firstLine = document.lineAt(0);
            const lastLine = document.lineAt(document.lineCount - 1);
            const range = new vscode.Range(firstLine.range.start, lastLine.range.end);
            return [vscode.TextEdit.replace(range, formatted.toString())];
          }
        } catch (err) {
          logerr(err);
          vscode.window.showErrorMessage('[fantomas-fmt] ' + err.message);
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
      ['noSpaceAfterSemiColon']: true
    };
    const cfg = vscode.workspace.getConfiguration('fantomas');
    return Object.keys(keys)
      .filter(k => cfg.get(k, keys[k]) !== false)
      .reduce((arr, k) => {
        const val = cfg.get(k, keys[k]);
        return val === true ? [...arr, '--' + k] : [...arr, '--' + k, val];
      }, []);
  }

  function checkFantomas() {
    let result = runOnShell('dotnet tool list -g');
    return result.output && result.output.includes('fantomas-tool');
  }

  function installFantomas() {
    let result = runOnShell('dotnet tool install fantomas-tool -g');
    return result.output;
  }

  async function runFantomas(input, cfg, timeoutMs): Promise<string> {
    const output = path.join(context.extensionPath, 'fantomas.tmp.fs');
    fs.copyFileSync(input, output);
    let cmd = 'fantomas "' + output + '" ' + cfg.join(' ');
    log(cmd);    
    await runOnTerminal(context, cmd, 'tten', timeoutMs);
    return fs.readFileSync(output);
  }

  let installed = checkFantomas();

  if (installed) {
    log('fantomas-tool found');
  }

  if (!installed && !installFantomas()) {
    logerr("Can't install Fantomas. Please install it manually and restart Visual Studio Code");
    vscode.window.showErrorMessage("[fantomas-fmt] Can't install Fantomas. Please install it manually and restart Visual Studio Code");
    return;
  }
}

export function deactivate() {}
