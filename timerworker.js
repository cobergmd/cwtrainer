var timerID = null;
var interval = 100;

self.onmessage = function (e) {
    if (e.data == 'start') {
        console.log('starting timer');
        timerID = setInterval(function () { postMessage('tick'); }, interval);
    }
    else if (e.data.interval) {
        console.log('setting interval to ' + interval);
        interval = e.data.interval;
        if (timerID) {
            clearInterval(timerID);
            timerID = setInterval(function () { postMessage('tick'); }, interval);
        }
    }
    else if (e.data == 'stop') {
        console.log('stopping timer');
        clearInterval(timerID);
        timerID = null;
    }
};
