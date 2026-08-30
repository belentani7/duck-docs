(function () {
  'use strict';

  var activeController = null;
  var puterPromise = null;
  var state = { messages: [], lastQuery: '', lastLocal: null };

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9#]+/g, ' ').trim();
  }

  function tokens(value) {
    return normalize(value).split(/\s+/).filter(function (word) { return word.length > 1; });
  }

  function scoreGuide(guide, queryTokens) {
    var title = normalize(guide.title);
    var intents = normalize(guide.intents.join(' '));
    var tags = normalize(guide.tags.join(' '));
    var content = normalize(guide.answer + ' ' + guide.listen + ' ' + guide.risk);
    return queryTokens.reduce(function (score, token) {
      if (title.indexOf(token) >= 0) score += 6;
      if (intents.indexOf(token) >= 0) score += 5;
      if (tags.indexOf(token) >= 0) score += 3;
      if (content.indexOf(token) >= 0) score += 1;
      return score;
    }, 0);
  }

  function theoryNotes(root, scaleName) {
    var theory = DuckKnowledge.theory;
    var rootIndex = theory.pitchClasses.map(normalize).indexOf(normalize(root));
    var scale = theory.scales[scaleName];
    if (rootIndex < 0 || !scale) return '';
    return scale.map(function (step) { return theory.pitchClasses[(rootIndex + step) % 12]; }).join(' – ');
  }

  function theoryAnswer(query) {
    var clean = normalize(query);
    var glossaryKey = Object.keys(DuckKnowledge.glossary).find(function (key) { return clean.indexOf(normalize(key)) >= 0; });
    if (glossaryKey && /o que|significa|glossario|defin/.test(clean)) {
      return 'Glossário — ' + glossaryKey + ': ' + DuckKnowledge.glossary[glossaryKey] + '.';
    }
    var scaleMatch = /(?:escala|notas)\s+(?:de\s+)?([a-g](?:#|b)?)\s*(maior|menor natural|menor harmonica|pentatonica menor|dorico|mixolidio)/i.exec(query);
    if (scaleMatch) {
      var names = { 'menor natural': 'menor_natural', 'menor harmonica': 'menor_harmonica', 'pentatonica menor': 'pentatonica_menor' };
      var scaleName = names[normalize(scaleMatch[2])] || normalize(scaleMatch[2]);
      var notes = theoryNotes(scaleMatch[1], scaleName);
      if (notes) return 'Teoria — ' + scaleMatch[1].toUpperCase() + ' ' + scaleMatch[2] + ': ' + notes + '. Use como mapa de alturas e confirme pela audição e pela harmonia real.';
    }
    if (/variaveis|briefing|comecar uma (faixa|musica)|planejar producao/.test(clean)) {
      return 'Variáveis de produtor:\n' + DuckKnowledge.theory.producerVariables.map(function (item, index) {
        return (index + 1) + '. ' + item.label + ': ' + item.prompt;
      }).join('\n');
    }
    return '';
  }

  function localSearch(query) {
    var queryTokens = tokens(query);
    var ranked = DuckKnowledge.guides.map(function (guide) {
      return { guide: guide, score: scoreGuide(guide, queryTokens) };
    }).filter(function (item) { return item.score > 0; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 3);
    var theory = theoryAnswer(query);
    var sufficient = Boolean(theory) || (ranked.length > 0 && ranked[0].score >= 5);
    return { results: ranked, theory: theory, sufficient: sufficient };
  }

  function composeLocal(result) {
    if (result.theory) return result.theory + '\n\nOrigem: índice teórico local, revisão ' + DuckKnowledge.theory.revision + '.';
    if (!result.results.length) {
      return 'Base local: não encontrei correspondência suficiente. Informe objetivo, etapa, BPM/tonalidade quando relevantes, fonte e o que você já tentou.';
    }
    return result.results.map(function (item, index) {
      var guide = item.guide;
      return (index + 1) + '. ' + guide.title + '\nAção: ' + guide.answer + '\nComo ouvir: ' + guide.listen + '\nRisco: ' + guide.risk + '\nComo desfazer: ' + guide.undo;
    }).join('\n\n') + '\n\nOrigem: base determinística local; guias ' + result.results.map(function (item) { return item.guide.id; }).join(', ') + '.';
  }

  function addMessage(role, text, source) {
    state.messages.push({ role: role, text: text, source: source || '' });
    var log = document.getElementById('chat-log');
    if (!log) return;
    var article = document.createElement('article');
    article.className = 'message ' + role;
    article.textContent = text;
    if (source) {
      var meta = document.createElement('small');
      meta.textContent = source;
      article.appendChild(meta);
    }
    log.appendChild(article);
    log.scrollTop = log.scrollHeight;
  }

  function projectContext() {
    var project = DuckCore.readJSON(DuckCore.KEYS.project, DuckCore.DEFAULT_PROJECT);
    return { title: project.title, bpm: project.bpm, key: project.key, stage: project.stage };
  }

  function buildContext() {
    var payload = {
      task: state.lastQuery || (document.getElementById('agent-query') || {}).value || '',
      project: document.getElementById('include-project').checked ? projectContext() : undefined,
      persistentPreference: undefined,
      constraints: ['produção musical somente', 'resposta em português brasileiro', 'contexto máximo 4096 tokens']
    };
    if (document.getElementById('include-memory').checked) {
      var memory = DuckCore.readJSON(DuckCore.KEYS.userMemory, { text: '' });
      payload.persistentPreference = memory.text || undefined;
    }
    Object.keys(payload).forEach(function (key) { if (payload[key] === undefined) delete payload[key]; });
    return payload;
  }

  function refreshPreview() {
    var preview = document.getElementById('context-preview');
    if (preview) preview.value = JSON.stringify(buildContext(), null, 2);
  }

  function timeoutController(ms) {
    activeController = new AbortController();
    var timer = window.setTimeout(function () { activeController.abort('timeout'); }, ms);
    return { signal: activeController.signal, clear: function () { window.clearTimeout(timer); activeController = null; } };
  }

  function ollamaEnabled() {
    return document.getElementById('ollama-optin').checked;
  }

  function askOllama(explicit) {
    if (!explicit && !ollamaEnabled()) return Promise.reject(new Error('Ollama sem opt-in.'));
    if (!ollamaEnabled()) return Promise.reject(new Error('Marque o consentimento do Ollama local.'));
    var model = document.getElementById('ollama-model').value;
    if (['qwen2.5:7b-instruct', 'granite3.3:2b'].indexOf(model) < 0) return Promise.reject(new Error('Modelo local não permitido.'));
    var timeout = timeoutController(15000);
    DuckCore.setStatus('engine-status', 'Ollama local: consultando…', 'warn');
    return fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: timeout.signal,
      body: JSON.stringify({
        model: model,
        stream: false,
        options: { num_ctx: 4096 },
        messages: [
          { role: 'system', content: 'Você é DUCK, produtor musical local. Responda em PT-BR, somente sobre produção musical, sem programação, terminal ou código. Diferencie fato, hipótese e preferência. Use passos curtos e valores como ponto de partida.' },
          { role: 'user', content: JSON.stringify(buildContext()) }
        ]
      })
    }).then(function (response) {
      if (!response.ok) throw new Error('Ollama respondeu HTTP ' + response.status + '.');
      return response.json();
    }).then(function (data) {
      var text = data && data.message && data.message.content;
      if (!text) throw new Error('Resposta local vazia.');
      addMessage('duck', text, 'Ollama local · ' + model);
      DuckCore.setStatus('engine-status', 'Ollama local respondeu.', 'ok');
      return text;
    }).finally(timeout.clear);
  }

  function loadPuter() {
    if (window.puter && window.puter.ai) return Promise.resolve(window.puter);
    if (puterPromise) return puterPromise;
    puterPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.dataset.duckOptional = 'puter';
      var timer = window.setTimeout(function () {
        script.remove();
        reject(new Error('Tempo de carregamento do Puter esgotado.'));
      }, 12000);
      script.onload = function () {
        window.clearTimeout(timer);
        if (window.puter && window.puter.ai) resolve(window.puter);
        else reject(new Error('Puter.js carregou sem API de IA.'));
      };
      script.onerror = function () {
        window.clearTimeout(timer);
        reject(new Error('Não foi possível carregar Puter.js.'));
      };
      document.head.appendChild(script);
    }).catch(function (error) { puterPromise = null; throw error; });
    return puterPromise;
  }

  function askPuter() {
    if (!document.getElementById('puter-consent').checked) return Promise.reject(new Error('Confirme conta Puter e cobrança ao usuário antes de conectar.'));
    if (!state.lastQuery.trim()) return Promise.reject(new Error('Escreva uma pergunta primeiro.'));
    refreshPreview();
    if (!window.confirm('Enviar exatamente o contexto mostrado na prévia para Puter? A conta e eventuais custos são do usuário.')) {
      return Promise.reject(new Error('Envio online cancelado.'));
    }
    DuckCore.setStatus('engine-status', 'Puter online: carregando por consentimento…', 'warn');
    var timeout = timeoutController(25000);
    return Promise.race([
      loadPuter().then(function (puter) {
        return puter.ai.chat('Responda em português brasileiro, somente sobre produção musical. Contexto mínimo: ' + JSON.stringify(buildContext()));
      }),
      new Promise(function (_, reject) {
        timeout.signal.addEventListener('abort', function () { reject(new Error('Consulta Puter cancelada ou expirada.')); }, { once: true });
      })
    ]).then(function (response) {
      var text = typeof response === 'string' ? response : response && response.message && (response.message.content || response.message);
      if (!text) throw new Error('Resposta Puter vazia.');
      addMessage('duck', String(text), 'Puter online · conta/custo do usuário');
      DuckCore.setStatus('engine-status', 'Puter respondeu.', 'ok');
      return text;
    }).finally(timeout.clear);
  }

  function submitLocal(event) {
    event.preventDefault();
    var input = document.getElementById('agent-query');
    var query = input.value.trim();
    if (!query) return;
    state.lastQuery = query;
    addMessage('user', query, 'local');
    var local = localSearch(query);
    state.lastLocal = local;
    addMessage('duck', composeLocal(local), local.sufficient ? 'Base local · correspondência suficiente' : 'Base local · contexto insuficiente');
    refreshPreview();
    if (!local.sufficient && ollamaEnabled()) {
      askOllama(false).catch(function (error) {
        DuckCore.setStatus('engine-status', 'Base local ativa; Ollama indisponível: ' + error.message, 'warn');
      });
    } else {
      DuckCore.setStatus('engine-status', local.sufficient ? 'Base local respondeu.' : 'Base local precisa de mais contexto.', local.sufficient ? 'ok' : 'warn');
    }
    input.select();
  }

  function saveModelSetting() {
    var settings = DuckCore.readJSON(DuckCore.KEYS.settings, {});
    delete settings.ollamaOptIn;
    settings.ollamaModel = document.getElementById('ollama-model').value;
    DuckCore.writeJSON(DuckCore.KEYS.settings, settings);
  }

  function init() {
    DuckCore.initPage('agente');
    var settings = DuckCore.readJSON(DuckCore.KEYS.settings, { ollamaModel: 'granite3.3:2b' });
    document.getElementById('ollama-optin').checked = false;
    document.getElementById('ollama-model').value = ['qwen2.5:7b-instruct', 'granite3.3:2b'].indexOf(settings.ollamaModel) >= 0 ? settings.ollamaModel : 'granite3.3:2b';
    if (Object.prototype.hasOwnProperty.call(settings, 'ollamaOptIn')) saveModelSetting();
    var memory = DuckCore.readJSON(DuckCore.KEYS.userMemory, { text: '' });
    document.getElementById('memory-text').value = memory.text || '';
    document.getElementById('agent-form').addEventListener('submit', submitLocal);
    ['agent-query', 'include-project', 'include-memory'].forEach(function (id) { document.getElementById(id).addEventListener('input', refreshPreview); });
    document.getElementById('ollama-model').addEventListener('change', saveModelSetting);
    document.getElementById('ask-ollama').addEventListener('click', function () {
      var query = document.getElementById('agent-query').value.trim();
      if (query) state.lastQuery = query;
      if (!state.lastQuery) return DuckCore.setStatus('engine-status', 'Escreva uma pergunta primeiro.', 'warn');
      var local = localSearch(state.lastQuery);
      addMessage('duck', composeLocal(local), 'Base local consultada primeiro');
      askOllama(true).catch(function (error) { DuckCore.setStatus('engine-status', error.message, 'danger'); });
    });
    document.getElementById('ask-puter').addEventListener('click', function () {
      var query = document.getElementById('agent-query').value.trim();
      if (query) state.lastQuery = query;
      var local = localSearch(state.lastQuery);
      if (state.lastQuery) addMessage('duck', composeLocal(local), 'Base local consultada primeiro');
      var first = ollamaEnabled() && !local.sufficient ? askOllama(false).catch(function () { return null; }) : Promise.resolve(null);
      first.then(askPuter).catch(function (error) { DuckCore.setStatus('engine-status', error.message, 'danger'); });
    });
    document.getElementById('cancel-agent').addEventListener('click', function () {
      if (activeController) activeController.abort('cancelado pelo usuário');
      DuckCore.setStatus('engine-status', 'Consulta cancelada. Base local continua ativa.', 'warn');
    });
    document.getElementById('save-memory').addEventListener('click', function () {
      if (!window.confirm('Salvar estas preferências em duck.userMemory.v1 neste navegador?')) return;
      DuckCore.writeJSON(DuckCore.KEYS.userMemory, { text: document.getElementById('memory-text').value.trim(), updatedAt: new Date().toISOString() });
      DuckCore.setStatus('memory-status', 'Memória persistente salva por confirmação.', 'ok');
    });
    document.getElementById('delete-memory').addEventListener('click', function () {
      if (!window.confirm('Apagar somente duck.userMemory.v1? Projeto, mixer, padrão e base local serão preservados.')) return;
      DuckCore.removeKey(DuckCore.KEYS.userMemory);
      document.getElementById('memory-text').value = '';
      document.getElementById('include-memory').checked = false;
      refreshPreview();
      DuckCore.setStatus('memory-status', 'Memória persistente apagada.', 'ok');
    });
    addMessage('duck', 'Base especializada pronta. Descreva uma decisão de produção musical; a busca local responde primeiro.', 'Base determinística local · offline');
    refreshPreview();
  }

  document.addEventListener('DOMContentLoaded', init);
}());
