import {spawn, ChildProcessWithoutNullStreams, execSync} from 'child_process';
import * as fs from 'fs';
import {deepEqual} from "assert";
import {createLogger, format, Logger, transports} from "winston";

interface ProcessConfig {
    command: string;
    args: string[];
    timeout?: number;
}

interface Config {
    processes: ProcessConfig[];
}

export class ProcessManager {
    private processes: ChildProcessWithoutNullStreams[] = [];
    private isRunning: boolean = false;
    private logger: Logger;

    constructor(private configFilePath: string, private path: string) {
        this.logger = createLogger({
            level: 'info',
            format: format.combine(
                format.timestamp(),
                format.errors({ stack: true }),
                format.splat(),
                format.json()
            ),
            transports: [
                new transports.Console({
                    format: format.combine(
                        format.colorize(),
                        format.printf(({ level, message, timestamp }) => {
                            return `[${timestamp}] ${level}: ${message}`;
                        })
                    ),
                }),
                new transports.File({
                    filename: `${path}/app.log`,
                    format: format.combine(
                        format.printf(({ level, message, timestamp }) => {
                            return `[${timestamp}] ${level}: ${message}`;
                        })
                    ),
                }),
            ],
        });
    }

    public start(): void {
        if (this.isRunning) {
            this.logger.info('Processes already running');
            return;
        }

        const config: Config = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));

        config.processes.forEach((processConfig) => {
            try {
                this.startProcess(processConfig);
            } catch (e) {
                this.logger.error(e)
            }
        });

        this.logger.info('All processes started');
        this.isRunning = true;
    }

    public stop(): void {
        if (!this.isRunning) {
            this.logger.info('Processes not running');
            return;
        }

        this.processes.forEach((process) => {
            process.kill();
        });

        this.logger.info('All processes stopped');
        this.isRunning = false;
    }

    private removeProcess(process: ChildProcessWithoutNullStreams): void {
        this.processes = this.processes.filter((p) => p !== process);
    }

    private findProcess(command: string, args?: string[]): number | null {
        const processList = execSync(`pgrep -f "${command}"`).toString().split('\n');
        for (let i = 0; i < processList.length; i++) {
            const pid = parseInt(processList[i]);
            if (!isNaN(pid)) {
                const processArgs = execSync(`ps -p ${pid} -o args=`).toString().split(' ');
                if (processArgs[0] === command && (!args || args.join(' ') === processArgs.slice(1).join(' '))) {
                    return pid;
                }
            }
        }
        return null;
    }

    private startProcess(processConfig: ProcessConfig) {
        if (!processConfig.timeout) {
            processConfig.timeout = 10;
        }
        const existingPid = this.findProcess(processConfig.command, processConfig.args);
        if (existingPid) {
            this.logger.info(`Killing existing process with PID ${existingPid}`);
            process.kill(existingPid);
        }
        this.logger.info(`Starting process with command "${processConfig.command}" and args "${processConfig.args ? processConfig.args.join(' ') : ''}"`);
        const child = spawn(processConfig.command, [...processConfig.args, '--trace']);
        child.stdout.on('data', (data) => {
            this.logger.info(`Received message from process with command "${processConfig.command}": ${data}`);
        });
        child.stderr.on('data', (data) => {
            this.logger.error(`Error message from process with command "${processConfig.command}": ${data}`);
        });
        child.on('close', (code) => {
            this.logger.info(`Process with command "${processConfig.command}" exited with code ${code}`);
            setTimeout(() => {
                this.startProcess(processConfig);
            }, processConfig.timeout! * 1000);
        });
    }
}
