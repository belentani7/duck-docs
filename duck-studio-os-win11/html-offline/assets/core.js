(function () {
  'use strict';

  var KEYS = Object.freeze({
    project: 'duck.project.v1',
    mixer: 'duck.mixer.v1',
    pattern: 'duck.pattern.v1',
    userMemory: 'duck.userMemory.v1',
    settings: 'duck.settings.v1',
    tempPrefix: 'duck.temp.'
  });

  var DEFAULT_PROJECT = Object.freeze({
    schemaVersion: 1,
    title: 'Sessão offline',
    bpm: 120,
    key: 'Am',
    stage: 'rascunho',
    updatedAt: null
  });

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value)));
  }

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? copy(fallback) : JSON.parse(raw);
    } catch (error) {
      console.warn('DUCK: leitura local inválida para ' + key, error);
      return copy(fallback);
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      announce('Não foi possível salvar no armazenamento local.');
      console.error('DUCK: falha ao salvar ' + key, error);
      return false;
    }
  }

  function removeKey(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('DUCK: falha ao remover ' + key, error);
      return false;
    }
  }

  function announce(message) {
    var live = document.getElementById('duck-live');
    if (!live) {
      live = document.createElement('div');
      live.id = 'duck-live';
      live.className = 'sr-only';
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      document.body.appendChild(live);
    }
    live.textContent = '';
    window.setTimeout(function () { live.textContent = message; }, 20);
  }

  function setStatus(target, message, tone) {
    var element = typeof target === 'string' ? document.getElementById(target) : target;
    if (!element) return;
    element.textContent = message;
    element.classList.remove('ok', 'warn', 'danger');
    if (tone) element.classList.add(tone);
    announce(message);
  }

  function formatBytes(value) {
    var bytes = Number(value) || 0;
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  function downloadJSON(filename, value) {
    try {
      var blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
      announce('Exportação preparada: ' + filename);
      return true;
    } catch (error) {
      console.error('DUCK: exportação falhou', error);
      announce('A exportação falhou neste navegador.');
      return false;
    }
  }

  function storageSnapshot() {
    var rows = [];
    try {
      for (var i = 0; i < localStorage.length; i += 1) {
        var key = localStorage.key(i);
        if (key && key.indexOf('duck.') === 0) {
          var value = localStorage.getItem(key) || '';
          rows.push({ scope: 'localStorage', key: key, bytes: new Blob([value]).size, value: value });
        }
      }
      for (var j = 0; j < sessionStorage.length; j += 1) {
        var sessionKey = sessionStorage.key(j);
        if (sessionKey && sessionKey.indexOf('duck.') === 0) {
          var sessionValue = sessionStorage.getItem(sessionKey) || '';
          rows.push({ scope: 'sessionStorage', key: sessionKey, bytes: new Blob([sessionValue]).size, value: sessionValue });
        }
      }
    } catch (error) {
      rows.push({ scope: 'erro', key: 'armazenamento indisponível', bytes: 0, value: String(error.message || error) });
    }
    return rows.sort(function (a, b) { return a.key.localeCompare(b.key); });
  }

  function cleanTemporary() {
    var removed = [];
    try {
      var keys = [];
      for (var i = 0; i < localStorage.length; i += 1) keys.push(localStorage.key(i));
      keys.forEach(function (key) {
        if (key && key.indexOf(KEYS.tempPrefix) === 0) {
          localStorage.removeItem(key);
          removed.push(key);
        }
      });
      var sessionKeys = [];
      for (var j = 0; j < sessionStorage.length; j += 1) sessionKeys.push(sessionStorage.key(j));
      sessionKeys.forEach(function (sessionKey) {
        if (sessionKey && sessionKey.indexOf(KEYS.tempPrefix) === 0) {
          sessionStorage.removeItem(sessionKey);
          removed.push('session:' + sessionKey);
        }
      });
    } catch (error) {
      console.error('DUCK: limpeza temporária falhou', error);
      return { ok: false, removed: removed };
    }
    return { ok: true, removed: removed };
  }

  function initPage(pageName) {
    document.documentElement.dataset.page = pageName || '';
    Array.prototype.forEach.call(document.querySelectorAll('.main-nav a'), function (link) {
      var href = link.getAttribute('href') || '';
      if (href === pageName + '.html' || (pageName === 'index' && href === 'index.html')) {
        link.setAttribute('aria-current', 'page');
      }
    });
    var project = readJSON(KEYS.project, DEFAULT_PROJECT);
    Array.prototype.forEach.call(document.querySelectorAll('[data-project-title]'), function (node) {
      node.textContent = project.title || DEFAULT_PROJECT.title;
    });
  }

  window.DuckCore = Object.freeze({
    KEYS: KEYS,
    DEFAULT_PROJECT: DEFAULT_PROJECT,
    clamp: clamp,
    copy: copy,
    readJSON: readJSON,
    writeJSON: writeJSON,
    removeKey: removeKey,
    announce: announce,
    setStatus: setStatus,
    formatBytes: formatBytes,
    downloadJSON: downloadJSON,
    storageSnapshot: storageSnapshot,
    cleanTemporary: cleanTemporary,
    initPage: initPage
  });
}());
