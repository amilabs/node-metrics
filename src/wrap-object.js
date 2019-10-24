const { wrapAsyncFunction } = require('./metric');

function getWrapBefore(path, funcName) {
    return (args) => `${path}.${funcName.toLowerCase()}`
}

function getWrapAfter(path, funcName) {
    return (args, res) => {
        if (res instanceof Error) {
            return 'err';
        }
        return 'ok';
    }
}

function objectWrapMetric(object, wrapMethodList, path) {
    const construct = function () {};
    construct.prototype = object;
    const resObject = new construct();
    return wrapMethodList.reduce((obj, methodName) => {
        obj[methodName] = wrapAsyncFunction(
            async (...args) => object[methodName](...args),
            getWrapBefore(path, methodName),
            getWrapAfter(path, methodName)
        );
        return obj;
    }, resObject);
}

module.exports = { objectWrapMetric };
