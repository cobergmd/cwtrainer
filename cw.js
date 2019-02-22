window.onload = function () {
    var volume = 1;

    var context = new (window.AudioContext || window.webkitAudioContext)();

    var envelope = context.createGain();
    envelope.gain.setValueAtTime(volume, context.currentTime);
    envelope.connect(context.destination);

    document.querySelector('button').addEventListener('mousedown', function () {
        context.resume().then(() => {
            playString(context, 440, 'the cat in the hat');
        });
    });

    document.onkeypress = function (evt) {
        var e = evt || window.event;
        var charCode = e.keyCode || e.which;
        var charStr = String.fromCharCode(charCode);
        playChar(context, 440, charStr);
    };
}

var codes = {
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
}

function playString(context, freq, char) {
    var osc = context.createOscillator();
    osc.type = "sine";
    var unit = .07;  // .05 - .06 = 20wpm
    var starttime = context.currentTime;  // maybe push out a small amount?

    for (var j = 0; j < char.length; j++) {
        var code = codes[char[j]];
        if (code) {
            for (var i = 0; i < code.length; i++) {
                var c = code[i];
                if (c === '.') {
                    osc.frequency.setValueAtTime(freq, starttime);
                    starttime += unit;
                    osc.frequency.setValueAtTime(0, starttime);
                    starttime += unit;
                } else if (c === '-') {
                    osc.frequency.setValueAtTime(freq, starttime);
                    starttime += unit * 3;
                    osc.frequency.setValueAtTime(0, starttime);
                    starttime += unit;
                } else if (c === '*') {
                    osc.frequency.setValueAtTime(0, starttime);
                    starttime += unit * 7;
                }
            }
            osc.frequency.setValueAtTime(0, starttime);
            starttime += unit * 3;
        }
    }

    var amp = context.createGain();
    amp.gain.setValueAtTime(1, context.currentTime);

    osc.connect(amp);
    amp.connect(context.destination);

    osc.start();
    osc.stop(starttime);
}


