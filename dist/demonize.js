"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Autostart = void 0;
const child_process_1 = require("child_process");
const os_1 = require("os");
class Autostart {
    constructor(programName, scriptPath, options = {}) {
        this.programName = programName;
        this.scriptPath = scriptPath;
        this.options = options;
    }
    addToAutostart() {
        switch ((0, os_1.platform)()) {
            case 'win32':
                return this.addToAutostartWindows();
            case 'darwin':
                return this.addToAutostartMac();
            case 'linux':
                return this.addToAutostartLinux();
            default:
                throw new Error('Unsupported platform');
        }
    }
    removeFromAutostart() {
        switch ((0, os_1.platform)()) {
            case 'win32':
                return this.removeFromAutostartWindows();
            case 'darwin':
                return this.removeFromAutostartMac();
            case 'linux':
                return this.removeFromAutostartLinux();
            default:
                throw new Error('Unsupported platform');
        }
    }
    addToAutostartWindows() {
        const command = `REG ADD "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${this.programName}" /t REG_SZ /d "${this.scriptPath}"`;
        return this.execCommandWithArgs(command);
    }
    addToAutostartMac() {
        const command = `osascript -e 'tell application "System Events" to make login item at end with properties {path:"${this.scriptPath}", hidden:false, name:"${this.programName}"}'`;
        return this.execCommandWithArgs(command);
    }
    addToAutostartLinux() {
        const command = `echo "[Desktop Entry]\nType=Application\nName=${this.programName}\nExec=${this.scriptPath}" > ~/.config/autostart/${this.programName}.desktop`;
        return this.execCommandWithArgs(command);
    }
    removeFromAutostartWindows() {
        const command = `REG DELETE "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${this.programName}" /f`;
        return this.execCommandWithArgs(command);
    }
    removeFromAutostartMac() {
        const command = `osascript -e 'tell application "System Events" to delete login item "${this.programName}"'`;
        return this.execCommandWithArgs(command);
    }
    removeFromAutostartLinux() {
        const command = `rm -f ~/.config/autostart/${this.programName}.desktop`;
        return this.execCommandWithArgs(command);
    }
    execCommandWithArgs(command) {
        const args = this.buildArgs();
        if (args.length > 0) {
            command += ' ' + args.join(' ');
        }
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(command, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    buildArgs() {
        const args = [];
        if (this.options.config) {
            args.push(`--config="${this.options.config}"`);
        }
        if (this.options.path) {
            args.push(`--path="${this.options.path}"`);
        }
        return args;
    }
}
exports.Autostart = Autostart;
//# sourceMappingURL=demonize.js.map