const VALID_COMMANDS = ['help', 'clear', 'exit', 'explode', 'decrypt', 'status', 'echo'];

// avaiable help commands for u to mess around
const HELP_TEXT = [
  '  help      -- list available commands',
  '  clear     -- wipe terminal output',
  '  exit      -- terminate session',
  '  explode   -- initiate self-destruct sequence',
  '  decrypt   -- run cipher-break on hidden payload',
  '  status    -- display system health report',
  '  echo [x]  -- repeat text back to terminal',
];

let audioCtx = null;
let humNode = null;
let humGain = null;
let isBooting = true;
let explodeRunning = false;

const outputArea = document.getElementById('output-area');
const userInput  = document.getElementById('user-input');
const crtWrap    = document.querySelector('.crt-wrap');

console.log('[DEBUG] script loaded -- userInput el:', userInput, '-- disabled:', userInput ? userInput.disabled : 'NOT FOUND');

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  startHum();
}

function startHum() {
  humGain = audioCtx.createGain();
  humGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  humNode = audioCtx.createOscillator();
  humNode.type = 'sawtooth';
  humNode.frequency.setValueAtTime(60, audioCtx.currentTime);
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(120, audioCtx.currentTime);
  humNode.connect(filter);
  filter.connect(humGain);
  humGain.connect(audioCtx.destination);
  humNode.start();
}

function playClick() {
  if (!audioCtx) return;
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.04, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 10);
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
  src.connect(gain);
  gain.connect(audioCtx.destination);
  src.start();
}

function getRandomLetter() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*!?<>';
  return chars[Math.floor(Math.random() * chars.length)];
}

function getRandomNumber() {
  return Math.floor(Math.random() * 9);
}

function addLine(text, cls) {
  cls = cls || '';
  const el = document.createElement('span');
  el.className = 'line' + (cls ? ' ' + cls : '');
  el.textContent = text;
  outputArea.appendChild(el);
  scrollToBottom();
  return el;
}

function addBlank() {
  addLine('', 'blank');
}

function scrollToBottom() {
  outputArea.scrollTop = outputArea.scrollHeight;
}

function addUserCommandToList(cmd) {
  addLine('> ' + cmd, 'cmd-echo');
}

function addCustomLineToList(text, cls) {
  addLine(text, cls);
}

function clearOutput() {
  outputArea.innerHTML = '';
}

function handleCommands(input) {
  const parts = input.trim().split(/\s+/);
  const cmd   = parts[0].toLowerCase();
  const args  = parts.slice(1).join(' ');

  console.log('[DEBUG] handleCommands -- cmd:', cmd, '-- valid:', VALID_COMMANDS.includes(cmd));

  if (!VALID_COMMANDS.includes(cmd)) {
    shakeScreen();
    addLine('ERROR: command not found -- "' + cmd + '"', 'error');
    addLine('       type "help" for available commands', 'dim');
    return;
  }

  switch (cmd) {
    case 'help':    cmdHelp();       break;
    case 'clear':   cmdClear();      break;
    case 'exit':    cmdExit();       break;
    case 'explode': cmdExplode();    break;
    case 'decrypt': cmdDecrypt();    break;
    case 'status':  cmdStatus();     break;
    case 'echo':    cmdEcho(args);   break;
  }
}

function cmdHelp() {
  addBlank();
  addLine('AVAILABLE COMMANDS:', 'warn');
  HELP_TEXT.forEach(function(l) { addLine(l, 'dim'); });
  addBlank();
}

function cmdClear() {
  clearOutput();
}

function cmdExit() {
  addBlank();
  addLine('TERMINATING SESSION...', 'warn');
  setTimeout(function() {
    addLine('CONNECTION CLOSED.', 'error');
    userInput.disabled = true;
  }, 800);
}

function cmdEcho(args) {
  if (!args) {
    addLine('echo: no input provided', 'dim');
  } else {
    addLine(args);
  }
}

function cmdExplode() {
  if (explodeRunning) return;
  explodeRunning = true;
  userInput.disabled = true;
  addBlank();
  addLine('INITIATING SELF-DESTRUCT SEQUENCE', 'error');
  addBlank();

  const counts = ['3...', '2...', '1...', '0'];
  let i = 0;

  function tick() {
    if (i < counts.length) {
      addLine(counts[i], 'big');
      if (i === counts.length - 1) {
        setTimeout(function() {
          crtWrap.classList.add('glitch-active');
          setTimeout(function() {
            crtWrap.classList.remove('glitch-active');
            clearOutput();
            addLine('SYSTEM CORRUPTED.', 'error');
            addLine('REBOOTING...', 'dim');
            explodeRunning = false;
            userInput.disabled = false;
            userInput.focus();
          }, 900);
        }, 400);
      }
      i++;
      setTimeout(tick, 900);
    }
  }
  tick();
}

function cmdDecrypt() {
  addBlank();
  addLine('INITIATING CIPHER BREAK...', 'warn');
  const el = addLine('', 'dim');

  let frame = 0;
  const totalFrames = 40;
  const secret = 'PAYLOAD: XR-9A // ACCESS CODE: 7749-SIGMA';

  const interval = setInterval(function() {
    if (frame < totalFrames) {
      let noise = '';
      for (let i = 0; i < secret.length; i++) {
        noise += secret[i] === ' ' ? ' ' : getRandomLetter();
      }
      el.textContent = noise;
      frame++;
    } else {
      clearInterval(interval);
      el.textContent = secret;
      el.className = 'line warn';
      addBlank();
      addLine('DECRYPTION COMPLETE.', 'dim');
    }
  }, 55);
}

function cmdStatus() {
  addBlank();
  var lines = [
    ['SYSTEM STATUS REPORT', 'warn'],
    ['', 'blank'],
    ['  CORE TEMPERATURE ........ CRITICAL  [!!]', 'error'],
    ['  MEMORY INTEGRITY ........ 23%', 'error'],
    ['  NEURAL LINK .............. DEGRADED', 'warn'],
    ['  FIREWALL STATUS .......... BREACHED', 'error'],
    ['  UPTIME ................... 9d 14h 02m', 'dim'],
    ['  OPERATOR CLEARANCE ....... LEVEL 0', 'dim'],
    ['  ANOMALY DETECTED ......... YES', 'error'],
  ];
  lines.forEach(function(item) { addLine(item[0], item[1]); });
  addBlank();
}

function shakeScreen() {
  crtWrap.classList.remove('shake');
  void crtWrap.offsetWidth;
  crtWrap.classList.add('shake');
  crtWrap.addEventListener('animationend', function() {
    crtWrap.classList.remove('shake');
  }, { once: true });
}

userInput.addEventListener('keydown', function(e) {
  console.log('[DEBUG] keydown -- key:', e.key, '-- disabled:', userInput.disabled, '-- isBooting:', isBooting, '-- explodeRunning:', explodeRunning);
  initAudio();
  playClick();
  if (e.key === 'Enter') {
    const val = userInput.value.trim();
    console.log('[DEBUG] enter -- value: "' + val + '"');
    if (val && !explodeRunning) {
      addUserCommandToList(val);
      handleCommands(val);
    }
    userInput.value = '';
  }
});

function generateDumpLine() {
  let s = '';
  for (let i = 0; i < 64; i++) {
    s += Math.random() > 0.5 ? getRandomLetter() : String(getRandomNumber());
  }
  return s;
}

function bootSequence() {
  const bootLines = [
    { text: 'BIOS v4.7.2 -- INITIALIZING MEMORY SUBSYSTEM', cls: 'boot', delay: 0 },
    { text: null, cls: 'dump', delay: 180 },
    { text: null, cls: 'dump', delay: 260 },
    { text: null, cls: 'dump', delay: 320 },
    { text: 'MEM CHECK: 0xFFFF4A00 ... OK', cls: 'dim', delay: 420 },
    { text: 'LOADING KERNEL MODULES... DONE', cls: 'dim', delay: 560 },
    { text: 'MOUNTING VIRTUAL FILESYSTEM... OK', cls: 'dim', delay: 700 },
    { text: null, cls: 'dump', delay: 800 },
    { text: 'ESTABLISHING SECURE CHANNEL... FAILED', cls: 'error', delay: 950 },
    { text: 'RETRYING... OK', cls: 'dim', delay: 1080 },
    { text: 'CORRUPTION DETECTED IN SECTOR 0x7FF3', cls: 'error', delay: 1200 },
    { text: 'BYPASSING... OK', cls: 'warn', delay: 1350 },
    { text: '', cls: 'blank', delay: 1460 },
    { text: '  SS  YY  SS', cls: 'boot', delay: 1520 },
    { text: '  SYSTEM CORRUPTION v1.0', cls: 'boot', delay: 1580 },
    { text: '', cls: 'blank', delay: 1640 },
    { text: '  SYSTEM CORRUPTION v1.0 -- TERMINAL READY', cls: 'warn', delay: 1720 },
    { text: '  type "help" to list commands', cls: 'dim', delay: 1820 },
    { text: '', cls: 'blank', delay: 1860 },
  ];

  bootLines.forEach(function(item) {
    setTimeout(function() {
      if (item.cls === 'dump') {
        addLine(generateDumpLine(), 'dim');
      } else {
        addLine(item.text, item.cls);
      }
    }, item.delay);
  });

  setTimeout(function() {
    isBooting = false;
    userInput.disabled = false;
    userInput.focus();
    console.log('[DEBUG] boot complete -- disabled:', userInput.disabled, '-- active el:', document.activeElement === userInput);
  }, 2000);
}

bootSequence();