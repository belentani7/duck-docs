(function () {
  'use strict';

  var context = null;
  var master = null;
  var limiter = null;
  var channels = [];
  var activeVoices = new Set();

  function createGraph() {
    var AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) throw new Error('Web Audio não é compatível com este navegador.');
    context = new AudioCtor({ latencyHint: 'interactive' });
    master = context.createGain();
    limiter = context.createDynamicsCompressor();
    master.gain.value = 0.78;
    limiter.threshold.value = -3;
    limiter.knee.value = 8;
    limiter.ratio.value = 14;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.18;
    master.connect(limiter).connect(context.destination);
    for (var i = 0; i < 16; i += 1) {
      var gain = context.createGain();
      var pan = context.createStereoPanner();
      gain.connect(pan).connect(master);
      channels.push({ gain: gain, pan: pan });
    }
  }

  function ensure() {
    try {
      if (!context) createGraph();
      if (context.state === 'suspended') return context.resume().then(function () { return context; });
      return Promise.resolve(context);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function dbToGain(db) {
    if (Number(db) <= -60) return 0;
    return Math.pow(10, Number(db) / 20);
  }

  function setChannel(index, state, allStates) {
    if (!context || !channels[index]) return;
    var now = context.currentTime;
    var soloActive = Array.isArray(allStates) && allStates.some(function (item) { return item.solo; });
    var audible = !state.mute && (!soloActive || state.solo);
    channels[index].gain.gain.cancelScheduledValues(now);
    channels[index].gain.gain.setTargetAtTime(audible ? dbToGain(state.db) : 0, now, 0.012);
    channels[index].pan.pan.cancelScheduledValues(now);
    channels[index].pan.pan.setTargetAtTime(DuckCore.clamp(state.pan, -100, 100) / 100, now, 0.012);
  }

  function setMaster(db) {
    if (!context || !master) return;
    master.gain.setTargetAtTime(dbToGain(DuckCore.clamp(db, -60, 6)), context.currentTime, 0.015);
  }

  function disconnectVoice(voice) {
    if (!activeVoices.has(voice)) return;
    activeVoices.delete(voice);
    voice.nodes.forEach(function (node) {
      try { node.disconnect(); } catch (ignore) { /* já desconectado */ }
    });
  }

  function trackVoice(source, nodes) {
    var voice = { source: source, nodes: nodes };
    activeVoices.add(voice);
    source.addEventListener('ended', function () {
      disconnectVoice(voice);
    }, { once: true });
    return voice;
  }

  function tone(options) {
    options = options || {};
    return ensure().then(function () {
      var when = options.when === undefined ? context.currentTime : options.when;
      var duration = DuckCore.clamp(options.duration || 0.16, 0.03, 3);
      var output = options.channel === undefined ? master : channels[DuckCore.clamp(options.channel, 0, 15)].gain;
      var oscillator = context.createOscillator();
      var envelope = context.createGain();
      trackVoice(oscillator, [oscillator, envelope]);
      oscillator.type = options.type || 'triangle';
      oscillator.frequency.setValueAtTime(DuckCore.clamp(options.frequency || 220, 30, 12000), when);
      envelope.gain.setValueAtTime(0.0001, when);
      envelope.gain.exponentialRampToValueAtTime(DuckCore.clamp(options.velocity || 0.38, 0.01, 0.8), when + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      oscillator.connect(envelope).connect(output);
      oscillator.start(when);
      oscillator.stop(when + duration + 0.02);
      return oscillator;
    });
  }

  function drum(voice, when, velocity) {
    return ensure().then(function () {
      var at = when === undefined ? context.currentTime : when;
      var level = DuckCore.clamp(velocity || 0.5, 0.05, 0.8);
      if (voice === 'kick') {
        var kick = context.createOscillator();
        var kickGain = context.createGain();
        trackVoice(kick, [kick, kickGain]);
        kick.frequency.setValueAtTime(145, at);
        kick.frequency.exponentialRampToValueAtTime(43, at + 0.16);
        kickGain.gain.setValueAtTime(level, at);
        kickGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.23);
        kick.connect(kickGain).connect(master);
        kick.start(at); kick.stop(at + 0.25);
        return;
      }
      var length = voice === 'hat' ? 0.06 : 0.16;
      var frameCount = Math.max(1, Math.floor(context.sampleRate * length));
      var buffer = context.createBuffer(1, frameCount, context.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < frameCount; i += 1) data[i] = Math.random() * 2 - 1;
      var noise = context.createBufferSource();
      var filter = context.createBiquadFilter();
      var gain = context.createGain();
      trackVoice(noise, [noise, filter, gain]);
      noise.buffer = buffer;
      filter.type = voice === 'hat' ? 'highpass' : 'bandpass';
      filter.frequency.value = voice === 'hat' ? 6500 : 1700;
      gain.gain.setValueAtTime(level * (voice === 'hat' ? 0.45 : 0.7), at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
      noise.connect(filter).connect(gain).connect(master);
      noise.start(at); noise.stop(at + length + 0.01);
    });
  }

  function noteFrequency(note) {
    var table = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
    var match = /^([A-G]#?)(-?\d)$/.exec(note);
    if (!match) return 220;
    var midi = (Number(match[2]) + 1) * 12 + table[match[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function stopAll() {
    Array.from(activeVoices).forEach(function (voice) {
      try { voice.source.stop(); } catch (ignore) { /* node encerrado */ }
      disconnectVoice(voice);
    });
  }

  function close() {
    stopAll();
    if (!context) return Promise.resolve();
    var current = context;
    context = null;
    master = null;
    limiter = null;
    channels.forEach(function (channel) {
      try { channel.gain.disconnect(); } catch (ignore) { /* contexto encerrado */ }
      try { channel.pan.disconnect(); } catch (ignore) { /* contexto encerrado */ }
    });
    channels = [];
    return current.close().catch(function () {});
  }

  window.addEventListener('pagehide', close);
  window.DuckAudio = Object.freeze({
    ensure: ensure,
    dbToGain: dbToGain,
    setChannel: setChannel,
    setMaster: setMaster,
    tone: tone,
    drum: drum,
    noteFrequency: noteFrequency,
    now: function () { return context ? context.currentTime : 0; },
    stopAll: stopAll,
    close: close,
    state: function () { return context ? context.state : 'não iniciado'; }
  });
}());
