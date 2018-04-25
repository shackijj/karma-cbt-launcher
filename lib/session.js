/* 
This code was originally taken and modified from Actano/Marcus Mennemeier's karma-cbt-launcher. 
The original code can be found at http://github.com/actano/karma-cbt-launcher
*/


const consoleLogger = require('./console-logger');
const cbtTunnel = require('./tunnel');

const activeSessions = [];

const remoteHub = 'http://hub.crossbrowsertesting.com:80/wd/hub';

let log = consoleLogger('cbt-session');

module.exports = {
    setLogger: (logger) => {
        log = logger.create('cbt-session');
        cbtTunnel.setLogger(logger);
    },
    create: async (id) => {
        log.debug('Starting session %s', id);
        if (activeSessions.includes(id)) throw new Error(`Session ${id} already active`);
        activeSessions.push(id);
        try {
            await cbtTunnel.start();
        } catch(err) {
            console.error(err);
            process.exit(1);
        }
        return {
            stop() {
                const index = activeSessions.indexOf(id);
                if (index < 0) throw new Error(`Session ${id} not active`);
                log.debug('Closing session %s', id);
                activeSessions.splice(index, 1);
                if (activeSessions.length === 0) {
                    log.info('Last session, stopping tunnel');
                    cbtTunnel.stop();
                }
            },
            configureBuilder(builder) {
                log.debug('Configuring selenium builder for %s', JSON.stringify(builder.getCapabilities()));
                const caps = builder.usingServer(remoteHub).getCapabilities();
                caps.set('username', cbtTunnel.username);
                caps.set('password', cbtTunnel.authkey);
                caps.set('tunnel_name', cbtTunnel.name);
                return builder;
            },
        }
    }
};