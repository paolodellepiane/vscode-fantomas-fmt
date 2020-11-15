"use strict";
import * as vscode from "vscode";
import { log, logerr, runShell } from "./runner";
const fs = require("fs");
const path = require("path");
const FANTOMAS_DOTNET_INSTALL_COMMAND =
  "dotnet tool install --global fantomas-tool";

export function activate(context: vscode.ExtensionContext) {
  log("activating fantomas-fmt");

  let formatting = false;
  let disposable = vscode.languages.registerDocumentFormattingEditProvider(
    { scheme: "file", language: "fsharp" },
    {
      async provideDocumentFormattingEdits(
        document: vscode.TextDocument
      ): Promise<vscode.TextEdit[]> {
        if (formatting) {
          return null;
        }
        try {
          formatting = true;
          let formatted = await runFantomas(
            document.getText(),
            getFantomasArgs(document)
          );
          if (formatted) {
            const firstLine = document.lineAt(0);
            const lastLine = document.lineAt(document.lineCount - 1);
            const range = new vscode.Range(
              firstLine.range.start,
              lastLine.range.end
            );
            return [vscode.TextEdit.replace(range, formatted.toString())];
          }
        } catch (err) {
          logerr(err);
          vscode.window.showErrorMessage("[fantomas-fmt] " + err.message);
        } finally {
          formatting = false;
        }
      }
    }
  );

  context.subscriptions.push(disposable);

  function adaptApiParamToCli(key: string, value) {
    return ["--" + key.toLowerCase(), value];
  }

  function getFantomasArgs(document: vscode.TextDocument) {
    const keys = {
      ["indent"]: 4,
      ["pageWidth"]: 80,
      ["semicolonEOL"]: false,
      ["noSpaceBeforeArgument"]: true,
      ["spaceBeforeColon"]: false,
      ["noSpaceAfterComma"]: true,
      ["noSpaceAfterSemiColon"]: true,
      ["indentOnTryWith"]: false,
      ["noSpaceAroundDelimiter"]: true,
      ["keepNewlineAfter"]: false,
      ["maxIfThenElseShortWidth"]: 40,      
      ["strictMode"]: false
    };

    const cfg = vscode.workspace.getConfiguration("fantomas");
    let res = Object.keys(keys)
      .filter(k => cfg.get(k, keys[k]) !== keys[k])
      .reduce((arr, k) => {
        const [cliKey, cliValue] = adaptApiParamToCli(k, cfg.get(k, keys[k]));
        return typeof cliValue === "boolean"
          ? [...arr, cliKey]
          : [...arr, cliKey, cliValue];
      }, []);
    
    if (document.fileName.endsWith(".fsi")) res.push("--fsi");
    return res;
  }

  let os = require("os").platform() === "win32" ? "win32" : "others";
  let fantomasPath = path.join(require("os").homedir(), ".dotnet/tools/");
  let fantomasExeNames = {
    win32: "fantomas.exe",
    others: "fantomas"
  };
  let fantomasExeName = () => fantomasExeNames[os];
  let tmpFilePath = path.join(context.extensionPath, "fantomas.tmp.fs");
  let cmd = exe => (data, cfg) => {
    fs.writeFileSync(tmpFilePath, data);
    return `${exe} "${tmpFilePath}" ${cfg.join(" ")}`;
  };
  let cmdWithExe = cmd(fantomasExeName());

  function ensureFantomasInstalled() {
    log(`check path ${fantomasPath} cmd ${fantomasExeName()}`);
    return fs.existsSync(path.join(fantomasPath, fantomasExeName()));
  }

  async function tryInstallFantomas(): Promise<boolean> {
    try {
      let { stdout } = await runShell(FANTOMAS_DOTNET_INSTALL_COMMAND);
      log(stdout);
      return stdout !== null;
    } catch (error) {
      logerr(error.toString());
      return false;
    }
  }

  async function runFantomas(text, cfg): Promise<string> {
    let cmd = cmdWithExe(text, cfg);
    log(cmd);

    try {
      await runShell(cmd);
      return fs.readFileSync(tmpFilePath);
    } catch (error) {
      logerr(error.message);
      vscode.window.showErrorMessage("[fantomas-fmt] format failed");
      return null;
    }
  }

  let installed = ensureFantomasInstalled();

  if (installed) {
    log("fantomas-tool found");
  }

  if (!installed && !tryInstallFantomas() && !ensureFantomasInstalled()) {
    logerr(
      "Can't install Fantomas. Please install it manually and restart Visual Studio Code"
    );
    vscode.window.showErrorMessage(
      "[fantomas-fmt] Can't install Fantomas. Please install it manually and restart Visual Studio Code"
    );
  }
}

export function deactivate() {}
