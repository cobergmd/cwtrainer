window.onload = function () {
    var audio = new (window.AudioContext || window.webkitAudioContext)();
    var cwtester = new cw(audio);

    document.querySelector('button').addEventListener('mousedown', function () {
        audio.resume().then(() => {
            cwtester.start('the cat in the hat');
        });
    });

    document.onkeypress = function (evt) {
        audio.resume().then(() => {
            var e = evt || window.event;
            var charCode = e.keyCode || e.which;
            var charStr = String.fromCharCode(charCode);
            cwtester.start(charStr);
        });
    };
};

var cw = function(audio) {
    this.timerId = 0;
    this.context = audio;
    this.volume = 1;
    this.currentChar = 0;
    this.currentString = null;
    this.bufferEndTime = 0;
    this.lookahead = 50;
    this.unit = .07;  // .05 - .06 = 20wpm
    this.scheduleAheadTime = 2;

    this.codes = {
        ' ': '*',
        a: '.-',
        b: '-...',
        c: '-.-.',
        d: '-..',
        e: '.',
        f: '..-.',
        g: '--.',
        h: '....',
        i: '..',
        j: '.---',
        k: '-.-',
        l: '.-..',
        m: '--',
        n: '-.',
        o: '---',
        p: '.--.',
        q: '--.-',
        r: '.-.',
        s: '...',
        t: '-',
        u: '..-',
        v: '...-',
        w: '.--',
        x: '-..-',
        y: '-.--',
        z: '--..',
        '1': '.----',
        '2': '..---',
        '3': '...--',
        '4': '....-',
        '5': '.....',
        '6': '-....',
        '7': '--...',
        '8': '---..',
        '9': '----.',
        '0': '-----',
        '.': '.-.-.-'
    };

    this.timerWorker = new Worker('/timerworker.js');
    this.timerWorker.onmessage = function (e) {
        if (e.data == 'tick') {
            console.log('tick!');
            this.schedule();
        }
        else {
            console.log('message: ' + e.data);
        }
    }.bind(this);
    this.timerWorker.postMessage({ 'interval': this.lookahead });

    var envelope = this.context.createGain();
    envelope.gain.setValueAtTime(this.volume, this.context.currentTime);
    envelope.connect(this.context.destination);
};

cw.prototype = {
    start: function(string) {
        this.bufferEndTime = this.context.currentTime;
        this.currentString = string;
        this.currentChar = 0;
        this.timerWorker.postMessage('start');
    },
    stop: function() {
        this.timerWorker.postMessage('stop');
    },
    schedule: function() {
        var time = this.context.currentTime;
        var buffer = '';
        while (this.bufferEndTime < time + this.lookahead && this.currentChar < this.currentString.length) {
            for (var i = 0; i < 5 && this.currentString.length > this.currentChar; i++) {
                buffer += this.currentString[this.currentChar++];
            }
            this.playChar(440, buffer);
            buffer = '';
        }
    },
    playChar: function(freq, buffer) {
        var osc = this.context.createOscillator();
        osc.type = 'sine';
        var starttime = this.bufferEndTime;  // maybe push out a small amount?
        var amp = this.context.createGain();
        amp.gain.setValueAtTime(1, starttime);
        amp.connect(this.context.destination);
        osc.connect(amp);
        osc.start(starttime);

        for (var j = 0; j < buffer.length; j++) {
            var code = this.codes[buffer[j]];
            if (code) {
                console.log('play ' + buffer[j] + ' at ' + starttime);
                for (var i = 0; i < code.length; i++) {
                    var c = code[i];
                    if (c === '.') {
                        osc.frequency.setValueAtTime(freq, starttime);
                        starttime += this.unit;
                        osc.frequency.setValueAtTime(0, starttime);
                        starttime += this.unit;
                    } else if (c === '-') {
                        osc.frequency.setValueAtTime(freq, starttime);
                        starttime += this.unit * 3;
                        osc.frequency.setValueAtTime(0, starttime);
                        starttime += this.unit;
                    } else if (c === '*') {
                        osc.frequency.setValueAtTime(0, starttime);
                        starttime += this.unit * 7;
                    }
                }
                osc.frequency.setValueAtTime(0, starttime);
                starttime += this.unit * 3;
            }
        }
        osc.stop(starttime);
        this.bufferEndTime = starttime;
    },
    draw: function() {
        var code = this.codes[this.currentString[this.currentChar]];

        var t = document.getElementById('decodeDisplay').innerText;
        document.getElementById('decodeDisplay').innerText = t + code +  ' ';
    }
};



