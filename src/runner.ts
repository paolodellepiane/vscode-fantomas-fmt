'use strict';
import * as vscode from 'vscode';
const cp = require('child_process');
const path = require('path');

let onData: (data: string) => void;
const terminalName = 'fantomas';

vscode.window.onDidOpenTerminal(e => {
  if (e.name !== terminalName) {
    return;
  }
  (e as any).onDidWriteData(data => {
    console.log('Terminal ' + e.name + ' - data: ', data);
    onData && onData(data);
  });
});

let winPath = require('process').env['WINDIR'];

function createCmdOrTerminal(terminalName) {
  if (require('os').platform() === 'win32') {
    return vscode.window.createTerminal(terminalName, path.join(winPath, 'system32/cmd.exe'));  
  }
  return vscode.window.createTerminal(terminalName);
}

function getTerminal(context: vscode.ExtensionContext) {
  let term = vscode.window.terminals.find(t => t.name === terminalName);
  if (term) {
    return term;
  }
  term = createCmdOrTerminal(terminalName);
  context.subscriptions.push(term);
  return term;
}

export function runOnShell(cmd: any): { output?: string; err?: string } {
  try {
    let output = cp.execSync(cmd);
    log(output.toString());
    return { output: output.toString() };
  } catch (e) {
    logerr(e);
    return { err: e.toString() };
  }
}

export function runOnTerminal(context: vscode.ExtensionContext, workingDir: string, cmd: string, successMatch: string, failMatch: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    const term = getTerminal(context);
    let buffer = "";
    onData = data => {
      buffer += data;
      if (buffer.includes(successMatch)) {
        clearTimeout(timer);
        resolve(buffer);
      } else if (buffer.includes(failMatch)) {
        reject(new Error(buffer));
      }
    };
    term.sendText('cd "' + workingDir + '"');
    term.sendText(cmd);
  });
}


export function log(input) {
  console.log('[fantomas-fmt] ' + input);
}

export function logerr(input) {
  console.error('[fantomas-fmt] ' + input);
}

