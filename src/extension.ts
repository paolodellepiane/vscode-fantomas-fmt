'use strict';
import * as vscode from 'vscode';
const cp = require('child_process');
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
          let formatted = await runFantomas(editor.document.fileName, path.join(context.extensionPath, 'fantomas.tmp.fs'), 10000);
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
    let result = run('dotnet tool list -g');
    return result.output && result.output.includes('fantomas-tool');
  }

  function installFantomas() {
    let result = run('dotnet tool install fantomas-tool -g');
    return result.output;
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

  let onData: (data: string) => void;
  function getTerminal(name: string) {
    let term = vscode.window.terminals.find(t => t.name === name);
    if (term) {
      return term;
    }
    term = vscode.window.createTerminal(name);
    context.subscriptions.push(term);
    vscode.window.onDidOpenTerminal(e => {
      if (e.name !== 'fantomas') {
        return;
      }
      (e as any).onDidWriteData(data => {
        console.log('Terminal ' + e.name + ' - data: ', data);
        onData && onData(data);
      });
    });
    return term;
  }

  function run(cmd: any): { output?: string; err?: string } {
    try {
      let output = cp.execSync(cmd);
      log(output.toString());
      return { output: output.toString() };
    } catch (e) {
      logerr(e);
      return { err: e.toString() };
    }
  }

  function runFantomas(input, output, timeoutMs): Promise<string> {
    return new Promise((resolve, reject) => {
      var timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      let term = getTerminal('fantomas');
      let buffer = "";
      onData = data => {
        buffer += data;
        if (buffer.includes('tten')) {
          clearTimeout(timer);
          try {
            resolve(fs.readFileSync(output));
          } catch (ex) {
            vscode.window.showErrorMessage("[fantomas-fmt] can't read formatted output");
            logerr(ex.message);
            reject(ex.message);
          }
        }
      };
      try {
        fs.copyFileSync(input, output);
      } catch (ex) {
        logerr('error copying tmp file: ' + ex.message);
        reject(ex.message);
      }
      let cfg = getFantomasArgs();
      let cmd = 'fantomas "' + output + '" ' + cfg.join(' ');
      log(cmd);
      term.sendText(cmd);
    });
  }

  function log(input) {
    console.log('[fantomas-fmt] ' + input);
  }
  function logerr(input) {
    console.error('[fantomas-fmt] ' + input);
  }
}

export function deactivate() {}
