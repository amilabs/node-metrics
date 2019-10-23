const assert = require('assert');
const net = require('net');
const { initMetric, getStartedTimer, wrapAsyncFunction, getMetric, writeSingleMetric } = require('../src/metric')

const metricPrefix = 'test';
let server;
let port;
let socketOnDataCallback = () => {

};
server = net.createServer((socket) => {
    console.log('connected');
    socket.on('data', (...args) => {
        socketOnDataCallback(...args)
    });
}).on('error', (err) => {
    // handle errors here
    throw err;
});
server.listen({
    host: 'localhost',
    port: 0,
}, () => {
    port = server.address().port;
    console.log('opened server on', server.address().port);
});

describe('Metrics', function() {
    before(() => {
        initMetric({
            protocol: 'tcp',
            metricPrefix,
            port: port
        });
    });
    after((done) => {
        getMetric().close();
        server.close(() => {
            done();
        });
    });

    describe('writeSingleMetric', function() {
        it('should send metric', (done) => {
            const path = 'ololo';
            const value = 1;
            socketOnDataCallback = ((data) => {
                assert.equal(data.toString(), `${metricPrefix}.${path}:${value}|g\n`);
                done();
            });
            writeSingleMetric(path, 1);
        });
    });

    describe('getStartedTimer', () => {
        let timer;
        const path = 'path';
        const subPath = 'subPath';
        it('should make started timer with methods send and field startTime', () => {
            timer = getStartedTimer(path);
            assert.equal(Math.round(Date.now() / 10), Math.round(timer.startTime / 10));
            assert.equal(typeof timer.send, 'function');
        });
        it('should make send time when call send', (done) => {
            timer = getStartedTimer(path);
            const start = Date.now();
            let end;
            socketOnDataCallback = ((data) => {
                const [,path, time] = data.toString().match(/^(.*):(.*)\|ms/)
                assert.equal(Math.round((end - start) / 10), Math.round(time / 10));
                done();
            });
            setTimeout(() => {
                end = Date.now();
                timer.send(subPath)
            }, 1000);
        });
    });

    describe('wrapAsyncFunction', async () => {
        const path = 'path';
        const subPath = 'subPath';
        let startWrapperCount = 0;
        let endWrapperCount = 0;
        let onDataCount = 0;
        function someFunc(delay) {
            return  new Promise((resolve) => {
                setTimeout(() => resolve(123), delay)
            });
        }
        let wrappedFunction;
        it('should return wrapped function', () => {
            wrappedFunction = wrapAsyncFunction(
                someFunc,
                ([delay]) => {
                    startWrapperCount++;
                    return `${path}.${delay}`;
                },
                ([delay], result) => {
                    endWrapperCount++;
                    return `${subPath}.${result}`;
                }
            );
            assert.equal(typeof wrappedFunction, 'function');
        });
        // NOT DETERMINE. Hope 100ms is enough for local tcp request
        it('should make send time when call send', (done) => {
            wrappedFunction(1000);
            wrappedFunction(200);

            socketOnDataCallback = ((data) => {
                const rows = data.toString().split('\n');
                rows.forEach((row) => {
                    const match = row.match(/^(.*):(.*)\|ms/);
                    if (!match) {
                        return;
                    }
                    const [,metricPath, time] = match;
                    onDataCount++;
                    if (metricPath.indexOf('.200.') !== -1) {
                        assert.equal(metricPath, `${metricPrefix}.${path}.200.${subPath}.123`);
                        assert.equal(Math.round(time / 100), 2);
                    } else if (metricPath.indexOf('.1000.') !== -1) {
                        assert.equal(metricPath, `${metricPrefix}.${path}.1000.${subPath}.123`);
                        assert.equal(Math.round(time / 100), 10);
                    } else {
                        assert('path should exist delay')
                    }
                    if (onDataCount === 2) {
                        assert.equal(startWrapperCount, 2);
                        assert.equal(endWrapperCount, 2);
                        done();
                    }
                });
            });
        });
    });
});
