#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const commander_1 = __importDefault(require("commander"));
const process_1 = require("./process");
const demonize_1 = require("./demonize");
const program = commander_1.default.program;
const serviceName = 'process-manager';
const serviceDescription = 'Process Manager';
const nodeExecutablePath = '/usr/bin/node';
const indexPath = '/path/to/index.ts';
program
    .command('install')
    .description('Install the process manager as a systemd service')
    .action(() => {
    const currentFolderName = __dirname.split('/').pop();
    const autostart = new demonize_1.Autostart(currentFolderName, 'opm', {
        config: 'config.process.json',
        path: process.cwd()
    });
    autostart.addToAutostart().then(() => {
        console.log('Script added to autostart');
    }).catch((error) => {
        console.error(error);
    });
});
// Добавляем команду "remove"
program
    .command('remove')
    .description('Remove the process manager systemd service')
    .action(() => {
    const currentFolderName = __dirname.split('/').pop();
    const autostart = new demonize_1.Autostart(currentFolderName, 'opm', {
        config: 'config.process.json',
        path: process.cwd()
    });
    autostart.removeFromAutostart().then(() => {
        console.log('Script removed to autostart');
    }).catch((error) => {
        console.error(error);
    });
});
program
    .command('run')
    .description('Run process manager')
    .option('-c, --config <file>', 'path to config file')
    .option('-c, --path <file>', 'path to config file')
    .parse(process.argv)
    .action((program) => {
    const configPath = program.config || 'config.process.json';
    const path = program.path || process.cwd();
    const configFullPath = (0, path_1.resolve)(process.cwd(), configPath);
    const processManager = new process_1.ProcessManager(configFullPath, path);
    processManager.start();
});
program.parse(process.argv);
//# sourceMappingURL=index.js.map