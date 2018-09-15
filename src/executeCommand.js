"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const extension_1 = require("./extension");
function executeCommandInTerminal(args) {
    let cmd = "dotnet " + args.join(" ");
    extension_1.outputTerminal.show(true);
    extension_1.outputTerminal.sendText(cmd);
}
exports.executeCommandInTerminal = executeCommandInTerminal;
function executeCommandInOutputChannel(args, showOutputChannel, showInformationMessage) {
    let cmd = "dotnet " + args.join(" ");
    var childProcess = cp.exec(cmd, {
        cwd: vscode.workspace.rootPath,
        env: process.env
    });
    showOutput(childProcess, cmd, showOutputChannel, showInformationMessage);
    return {
        stderr: childProcess.stderr,
        stdout: childProcess.stdout
    };
}
exports.executeCommandInOutputChannel = executeCommandInOutputChannel;
function showOutput(childProcess, cmd, showOutputChannel, showInformationMessage) {
    extension_1.outputChannel.show(vscode.ViewColumn.Three);
    if (showOutputChannel) {
        extension_1.outputChannel.append("Command: " + cmd + "\n");
        extension_1.outputChannel.append("-----------------------------------------------\n");
    }
    childProcess.stderr.on("data", (data) => {
        if (showOutputChannel) {
            extension_1.outputChannel.append(data);
        }
    });
    childProcess.stdout.on("data", (data) => {
        if (showOutputChannel) {
            extension_1.outputChannel.append(data);
        }
        if (showInformationMessage) {
            vscode.window.showInformationMessage(data);
        }
    });
}
//# sourceMappingURL=executeCommand.js.map