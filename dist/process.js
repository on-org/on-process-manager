"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessManager = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const winston_1 = require("winston");
class ProcessManager {
    constructor(configFilePath, path) {
        this.configFilePath = configFilePath;
        this.path = path;
        this.processes = [];
        this.isRunning = false;
        this.logger = (0, winston_1.createLogger)({
            level: 'info',
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), winston_1.format.splat(), winston_1.format.json()),
            transports: [
                new winston_1.transports.Console({
                    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.printf(({ level, message, timestamp }) => {
                        return `[${timestamp}] ${level}: ${message}`;
                    })),
                }),
                new winston_1.transports.File({
                    filename: `${path}/app.log`,
                    format: winston_1.format.combine(winston_1.format.printf(({ level, message, timestamp }) => {
                        return `[${timestamp}] ${level}: ${message}`;
                    })),
                }),
            ],
        });
    }
    start() {
        if (this.isRunning) {
            this.logger.info('Processes already running');
            return;
        }
        const config = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));
        config.processes.forEach((processConfig) => {
            try {
                this.startProcess(processConfig);
            }
            catch (e) {
                this.logger.error(e);
            }
        });
        this.logger.info('All processes started');
        this.isRunning = true;
    }
    stop() {
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
    removeProcess(process) {
        this.processes = this.processes.filter((p) => p !== process);
    }
    findProcess(command, args) {
        const processList = (0, child_process_1.execSync)(`pgrep -f "${command}"`).toString().split('\n');
        for (let i = 0; i < processList.length; i++) {
            const pid = parseInt(processList[i]);
            if (!isNaN(pid)) {
                const processArgs = (0, child_process_1.execSync)(`ps -p ${pid} -o args=`).toString().split(' ');
                if (processArgs[0] === command && (!args || args.join(' ') === processArgs.slice(1).join(' '))) {
                    return pid;
                }
            }
        }
        return null;
    }
    startProcess(processConfig) {
        if (!processConfig.timeout) {
            processConfig.timeout = 10;
        }
        const existingPid = this.findProcess(processConfig.command, processConfig.args);
        if (existingPid) {
            this.logger.info(`Killing existing process with PID ${existingPid}`);
            process.kill(existingPid);
        }
        this.logger.info(`Starting process with command "${processConfig.command}" and args "${processConfig.args ? processConfig.args.join(' ') : ''}"`);
        const child = (0, child_process_1.spawn)(processConfig.command, [...processConfig.args, '--trace']);
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
            }, processConfig.timeout * 1000);
        });
    }
}
exports.ProcessManager = ProcessManager;
//# sourceMappingURL=process.js.map