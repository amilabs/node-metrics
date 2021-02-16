const _ = require('lodash');

const StatsD = require('hot-shots');

let metric;

let metricPrefix = '';

let IS_DEBUG_MODE = false;

function initMetric(options, onError) {
    metric = new StatsD(options || {});
    metric.socket.unref();
    if (options.metricPrefix) {
        metricPrefix = options.metricPrefix;
    }
    if (options.isDebug) {
        IS_DEBUG_MODE = true;
    }
    if (typeof onError === 'function') {
        metric.socket.on('error', (error) => {
            console.error('Error in socket: ', error);
        });
    }
    return metric;
}

function getMetric() {
    return metric;
}

function getStartedTimer(path) {
    return {
        startTime: Date.now(),
        send(subPath) {
            const time = Date.now() - this.startTime;
            IS_DEBUG_MODE && console.debug('Metric [getStartedTimer.send]', _.trim(`${metricPrefix}.${path}.${subPath}`, '.'), time);
            getMetric().timing(_.trim(`${metricPrefix}.${path}.${subPath}`, '.'), time);
            return time;
        }
    };
}

function incrementSingleMetric(path, value) {
    IS_DEBUG_MODE && console.debug('Metric [writeSingleMetric]', _.trim(`${metricPrefix}.${path}`, '.'), value);
    getMetric().increment(_.trim(`${metricPrefix}.${path}`, '.'), value)
}

function writeSingleMetric(path, value) {
    IS_DEBUG_MODE && console.debug('Metric [writeSingleMetric]', _.trim(`${metricPrefix}.${path}`, '.'), value);
    getMetric().gauge(_.trim(`${metricPrefix}.${path}`, '.'), value)
}

function writeTime(path, time) {
    IS_DEBUG_MODE && console.debug('Metric [writeTime]', _.trim(`${metricPrefix}.${path}`, '.'), time);
    getMetric().timing(_.trim(`${metricPrefix}.${path}`, '.'), time);
}

function wrapAsyncFunction(func, startWrapper, endWrapper) {
    return async (...args) => {
        const timer = getStartedTimer(startWrapper(args))
        try {
            const res = await func(...args);
            timer.send(endWrapper(args, res));
            return res;
        } catch (e) {
            timer.send(endWrapper(args, e));
            throw e;
        }
    }
}

function wrapAsyncOrCallbackFunction(func, startWrapper, endWrapper) {
    return async (...args) => {
        if (typeof args[args.length -1] === 'function') {
            const originalCallback = args[args.length -1];
            const timer = getStartedTimer(startWrapper(args))
            args[args.length -1] = (err, res) => {
                if (err) {
                    timer.send(endWrapper(args, err));
                } else {
                    timer.send(endWrapper(args, res));
                }
                return originalCallback(err, res);
            }
        }
    }
}

module.exports = { initMetric, getMetric, getStartedTimer, writeSingleMetric, wrapAsyncFunction, writeTime, wrapAsyncOrCallbackFunction, incrementSingleMetric };


