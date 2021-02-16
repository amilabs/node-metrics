const { initMetric, getMetric, getStartedTimer, writeSingleMetric, wrapAsyncFunction, writeTime, wrapAsyncOrCallbackFunction, incrementSingleMetric } = require('./src/metric')
const { objectWrapMetric } = require('./src/wrap-object');

module.exports = {
    initMetric,
    getMetric,
    getStartedTimer,
    writeSingleMetric,
    incrementSingleMetric,
    wrapAsyncFunction,
    wrapAsyncOrCallbackFunction,
    writeTime,
    objectWrapMetric
};
