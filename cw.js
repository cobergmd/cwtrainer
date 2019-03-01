window.onload = function () {
    var audio = new (window.AudioContext || window.webkitAudioContext)();
    var cwtester = new cw(audio);

    document.querySelector('#learn_button').addEventListener('click', function () {
        document.querySelector('#learn_button').setAttribute('disabled', 'disabled');
        document.querySelector('#listen_button').removeAttribute('disabled');
        document.onkeypress = function (evt) {
            var e = evt || window.event;
            var charCode = e.keyCode || e.which;
            var charStr = String.fromCharCode(charCode);
            var charDisplay = document.querySelector('.learn_display');
            charDisplay.innerHTML = charStr;
            if (charStr === cwtester.currentString) {
                charDisplay.classList.remove('incorrect');
                charDisplay.classList.add('correct');
            } else {
                charDisplay.classList.remove('correct');
                charDisplay.classList.add('incorrect');
            }
        };
    });
    document.querySelector('#listen_button').addEventListener('click', function () {
        document.querySelector('#listen_button').setAttribute('disabled', 'disabled');
        document.querySelector('#learn_button').removeAttribute('disabled');
        document.onkeypress = null;
    });

    document.querySelector('#listen_start_button').addEventListener('mousedown', function () {
        audio.resume().then(() => {
            cwtester.start();
            cwtester.load('the cat in the hat');
        });
    });
    document.querySelector('#listen_stop_button').addEventListener('mousedown', function () {
        cwtester.stop();
    });

    document.querySelector('#learn_replay_button').addEventListener('click', function () {
        cwtester.replay();
    });
    document.querySelector('#learn_next_button').addEventListener('click', function () {
        var charDisplay = document.querySelector('.learn_display');
        charDisplay.innerHTML = '';
        charDisplay.classList.remove('incorrect');
        charDisplay.classList.remove('correct');

        var testChar = cwtester.generateChar();
        audio.resume().then(() => {
            cwtester.start();
            cwtester.load(testChar);
        });
    });
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
    start: function() {
        this.timerWorker.postMessage('start');
    },
    stop: function() {
        this.timerWorker.postMessage('stop');
    },
    replay: function() {
        this.load(this.currentString);
    },
    load: function(string) {
        this.bufferEndTime = this.context.currentTime;
        this.currentChar = 0;
        this.currentString = string;
    },
    schedule: function() {
        var time = this.context.currentTime;
        var buffer = '';
        while (this.bufferEndTime < time + this.lookahead && this.currentChar < this.currentString.length) {
            for (var i = 0; i < 5 && this.currentString.length > this.currentChar; i++) {
                buffer += this.currentString[this.currentChar++];
            }
            this.buffer(440, buffer);
            buffer = '';
        }
    },
    buffer: function(freq, buffer) {
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
                //console.log('play ' + buffer[j] + ' at ' + starttime);
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
        osc.stop(starttime + 0.0023);
        this.bufferEndTime = starttime;
    },
    draw: function() {
        var code = this.codes[this.currentString[this.currentChar]];

        var t = document.getElementById('decodeDisplay').innerText;
        document.getElementById('decodeDisplay').innerText = t + code +  ' ';
    },
    generateChar: function() {
        var len = Object.keys(this.codes).length;
        var idx = Math.floor(Math.random() * len) + 1;
        return Object.keys(this.codes)[idx];
    }
};



