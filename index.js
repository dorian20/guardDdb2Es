/**
 * Author: @yangjs
 * Date 2018.6.29
 */

const log = require('./lib/log');
const saveToES = require('./lib/saveToES');

let callback = null;

function success() {
    callback(null, 'success');
}

function fail(e) {
    callback(e);
}

const execute = (event, context, cb) => {
    callback = cb;
    log.debug('Received event:', JSON.stringify(event, null, 2));

    saveToES(event)
        .then(success)
        .catch(fail);
};

process.on('unhandledRejection', (reason, p) => {
    log.debug('reason: ', reason);
    log.debug('p: ', p);
    throw reason;
});

process.on('uncaughtException', (e) => {
    log.debug('uncaughtException: ', e);
    log.error(e);
});

exports.handler = execute;