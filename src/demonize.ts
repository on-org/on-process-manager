import { exec } from 'child_process';
import { platform } from 'os';

interface AutostartOptions {
    config?: string;
    path?: string;
}

export class Autostart {
    private scriptPath: string;
    private options: AutostartOptions;

    constructor(private readonly programName: string, scriptPath: string, options: AutostartOptions = {}) {
        this.scriptPath = scriptPath;
        this.options = options;
    }

    public addToAutostart(): Promise<void> {
        switch (platform()) {
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

    public removeFromAutostart(): Promise<void> {
        switch (platform()) {
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

    private addToAutostartWindows(): Promise<void> {
        const command = `REG ADD "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${this.programName}" /t REG_SZ /d "${this.scriptPath}"`;
        return this.execCommandWithArgs(command);
    }

    private addToAutostartMac(): Promise<void> {
        const command = `osascript -e 'tell application "System Events" to make login item at end with properties {path:"${this.scriptPath}", hidden:false, name:"${this.programName}"}'`;
        return this.execCommandWithArgs(command);
    }

    private addToAutostartLinux(): Promise<void> {
        const command = `echo "[Desktop Entry]\nType=Application\nName=${this.programName}\nExec=${this.scriptPath}" > ~/.config/autostart/${this.programName}.desktop`;
        return this.execCommandWithArgs(command);
    }

    private removeFromAutostartWindows(): Promise<void> {
        const command = `REG DELETE "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${this.programName}" /f`;
        return this.execCommandWithArgs(command);
    }

    private removeFromAutostartMac(): Promise<void> {
        const command = `osascript -e 'tell application "System Events" to delete login item "${this.programName}"'`;
        return this.execCommandWithArgs(command);
    }

    private removeFromAutostartLinux(): Promise<void> {
        const command = `rm -f ~/.config/autostart/${this.programName}.desktop`;
        return this.execCommandWithArgs(command);
    }

    private execCommandWithArgs(command: string): Promise<void> {
        const args = this.buildArgs();
        if (args.length > 0) {
            command += ' ' + args.join(' ');
        }
        return new Promise<void>((resolve, reject) => {
            exec(command, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    private buildArgs(): string[] {
        const args: string[] = [];
        if (this.options.config) {
            args.push(`--config="${this.options.config}"`);
        }
        if (this.options.path) {
            args.push(`--path="${this.options.path}"`);
        }
        return args;
    }
}
