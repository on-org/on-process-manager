const { ProcessManager } = require('../dist/process');
const { expect } = require('chai');
require('mocha');
const sinon = require('sinon');

const configFilePath = './test/fixtures/config.json';

describe('ProcessManager', () => {
    let processManager;

    before(() => {
        processManager = new ProcessManager(configFilePath, './test/fixtures');
    });

    it('should start all processes from config', () => {
        const startSpy = sinon.spy(processManager, 'startProcess');
        processManager.start();
        expect(startSpy.callCount).to.equal(2);
        startSpy.restore();
    });

    it('should stop all processes', () => {
        const stopSpy = sinon.spy(processManager, 'stop');
        processManager.stop();
        expect(stopSpy.callCount).to.equal(1);
        stopSpy.restore();
    });

    it('should find a process by command and args', () => {
        const pid = processManager.findProcess('node', ['fixtures/server.js']);
        expect(pid).to.be.a('number');
    });

    it('should not find a non-existent process', () => {
        const pid = processManager.findProcess('node', ['fixtures/foo.js']);
        expect(pid).to.equal(null);
    });

    it('should start a process and add it to the list', () => {
        processManager.startProcess({
            command: 'node',
            args: ['fixtures/server.js'],
        });
        expect(processManager.processes.length).to.equal(1);
    });

    it('should remove a process from the list when it exits', () => {
        processManager.startProcess({
            command: 'node',
            args: ['fixtures/server.js'],
        });
        const process = processManager.processes[0];
        process.emit('exit');
        expect(processManager.processes.length).to.equal(0);
    });
});
