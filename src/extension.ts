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
        try {
          let formatted = await runFantomas(document.getText(), getFantomasArgs(), 10000);
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
      ['noSpaceAfterSemiColon']: true,
      ['indentOnTryWith']: false,
      ['reorderOpenDeclaration']: false,
      ['noSpaceAroundDelimiter']: true,
      ['strictMode']: false
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

  async function runFantomas(data, cfg, timeoutMs): Promise<string> {
    const output = path.join(context.extensionPath, 'fantomas.tmp.fs');
    fs.writeFileSync(output, data);
    let cmd = 'fantomas "' + output + '" ' + cfg.join(' ');
    log(cmd);
    try {
      await runOnTerminal(context, cmd, 'tten', 'failed', timeoutMs);
      return fs.readFileSync(output);
    } catch (ex) {
      logerr(ex.message);
      vscode.window.showErrorMessage("[fantomas-fmt] format failed");
    }
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
