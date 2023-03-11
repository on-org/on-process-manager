#!/usr/bin/env node

import { resolve } from "path";

import commander from 'commander';

import {ProcessManager} from "./process";
import {Autostart} from "./demonize";

const program = commander.program;

program
    .command('install')
    .description('Install the process manager as a systemd service')
    .action(() => {
        const currentFolderName = __dirname.split('/').pop();
        const autostart = new Autostart(currentFolderName!, 'opm', {
            config: 'config.process.json',
            path: process.cwd()
        });
        autostart.addToAutostart().then(() => {
            console.log('Script added to autostart');
        }).catch((error: Error) => {
            console.error(error);
        });
    });

// Добавляем команду "remove"
program
    .command('remove')
    .description('Remove the process manager systemd service')
    .action(() => {
        const currentFolderName = __dirname.split('/').pop();
        const autostart = new Autostart(currentFolderName!, 'opm', {
            config: 'config.process.json',
            path: process.cwd()
        });
        autostart.removeFromAutostart().then(() => {
            console.log('Script removed to autostart');
        }).catch((error: Error) => {
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
        const configFullPath = resolve(process.cwd(), configPath);
        const processManager = new ProcessManager(configFullPath, path);

        processManager.start();
    });

program.parse(process.argv);




