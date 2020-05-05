const { initMetric, getMetric, getStartedTimer, writeSingleMetric, wrapAsyncFunction, writeTime, wrapAsyncOrCallbackFunction } = require('./src/metric')
const { objectWrapMetric } = require('./src/wrap-object');

module.exports = {
    initMetric,
    getMetric,
    getStartedTimer,
    writeSingleMetric,
    wrapAsyncFunction,
    wrapAsyncOrCallbackFunction,
    writeTime,
    objectWrapMetric
};
