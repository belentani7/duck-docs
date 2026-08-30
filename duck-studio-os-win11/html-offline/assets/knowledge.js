(function () {
  'use strict';

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.getOwnPropertyNames(value).forEach(function (name) { deepFreeze(value[name]); });
    return Object.freeze(value);
  }

  var THEORY = {
    revision: '2026-08-13',
    pitchClasses: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
    intervals: {
      '0': 'uníssono', '1': 'segunda menor', '2': 'segunda maior', '3': 'terça menor',
      '4': 'terça maior', '5': 'quarta justa', '6': 'trítono', '7': 'quinta justa',
      '8': 'sexta menor', '9': 'sexta maior', '10': 'sétima menor', '11': 'sétima maior', '12': 'oitava'
    },
    scales: {
      maior: [0, 2, 4, 5, 7, 9, 11],
      menor_natural: [0, 2, 3, 5, 7, 8, 10],
      menor_harmonica: [0, 2, 3, 5, 7, 8, 11],
      pentatonica_menor: [0, 3, 5, 7, 10],
      dorico: [0, 2, 3, 5, 7, 9, 10],
      mixolidio: [0, 2, 4, 5, 7, 9, 10]
    },
    chordFormulas: {
      maior: [0, 4, 7], menor: [0, 3, 7], diminuto: [0, 3, 6], aumentado: [0, 4, 8],
      maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], dominante7: [0, 4, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7]
    },
    producerVariables: [
      { id: 'intent', label: 'intenção', prompt: 'Que sensação e função a faixa precisa cumprir?' },
      { id: 'reference', label: 'referência', prompt: 'Qual faixa orienta timbre, energia ou estrutura sem ser copiada?' },
      { id: 'tempo', label: 'BPM', prompt: 'Qual pulso sustenta a entrega vocal e o groove?' },
      { id: 'key', label: 'tonalidade', prompt: 'Qual região respeita a voz e o instrumento principal?' },
      { id: 'meter', label: 'compasso', prompt: 'A acentuação é binária, ternária ou híbrida?' },
      { id: 'stage', label: 'etapa', prompt: 'Ideia, arranjo, gravação, edição, mix ou entrega?' },
      { id: 'palette', label: 'paleta', prompt: 'Quais três a cinco fontes dominam a identidade?' },
      { id: 'density', label: 'densidade', prompt: 'Quantos elementos disputam cada faixa de frequência?' },
      { id: 'dynamics', label: 'dinâmica', prompt: 'Onde a música cresce, respira e contrasta?' },
      { id: 'space', label: 'espaço', prompt: 'O que fica perto, longe, estreito ou largo?' },
      { id: 'translation', label: 'tradução', prompt: 'Funciona baixo, mono, fone e caixa comum?' },
      { id: 'delivery', label: 'entrega', prompt: 'Qual formato, sample rate, bit depth e headroom são exigidos?' }
    ]
  };

  var GUIDES = [
    { id: 'audio-buffer', category: 'configuração', title: 'Áudio, driver e buffer', intents: ['latência', 'estalo', 'buffer', 'driver', 'audio'], tags: ['windows', 'interface', 'gravação'], answer: 'Escolha a interface correta e o driver dedicado. Comece em 256 samples; use 64–128 para gravar se o sistema ficar estável e 512–1024 para mix pesada. Pare a reprodução antes de trocar dispositivo.', listen: 'Toque sem atraso incômodo e sem estalos durante dois minutos.', risk: 'Buffer pequeno demais causa underrun; volume alto causa risco auditivo.', undo: 'Volte ao buffer anterior e reinicie somente o motor de áudio.' },
    { id: 'gain-staging', category: 'mix', title: 'Gain staging', intents: ['ganho', 'clip', 'clipping', 'volume baixo', 'headroom'], tags: ['nível', 'fader', 'entrada'], answer: 'Ajuste a fonte e o trim antes do fader. Em gravação de 24-bit, procure picos aproximados entre -18 e -10 dBFS e deixe margem. Equilibre canais com o master protegido de clipping.', listen: 'O sinal fica limpo e o balanço continua convincente em volume baixo.', risk: 'Não persiga volume visual; números são ponto inicial.', undo: 'Reponha trim e fader em unidade e compare com bypass em volume equivalente.' },
    { id: 'record-vocal', category: 'voz', title: 'Gravar voz em quarto doméstico', intents: ['gravar voz', 'vocal', 'microfone', 'quarto'], tags: ['voz', 'take', 'ruído'], answer: 'Reduza reflexões próximas com posição e material absorvente seguro. Afaste o microfone de paredes, use pop filter, monitoração em fones e grave teste de 20 segundos antes do take.', listen: 'Consoantes estão claras, graves controlados e ruído não domina pausas.', risk: 'Evite monitoração por caixas para impedir feedback.', undo: 'Mantenha o take original; altere posição e ganho em uma nova tomada.' },
    { id: 'vocal-edit', category: 'voz', title: 'Comping e edição vocal', intents: ['comping', 'editar voz', 'take', 'respiração'], tags: ['voz', 'edição'], answer: 'Escolha frases completas por intenção e afinação, faça cortes longe de transientes e use crossfades curtos. Preserve respirações que sustentam fraseado.', listen: 'A performance soa contínua e sem mudança abrupta de sala ou timbre.', risk: 'Edição excessiva remove identidade e cria cliques.', undo: 'Trabalhe em playlist duplicada e preserve todos os takes.' },
    { id: 'tuning', category: 'voz', title: 'Afinação e formantes', intents: ['afinar', 'autotune', 'formante', 'pitch'], tags: ['voz', 'afinação'], answer: 'Confirme tonalidade e escala, corrija primeiro notas longas problemáticas e ajuste velocidade conforme o estilo. Preserve formantes salvo intenção audível.', listen: 'A nota encaixa na harmonia sem vogais artificiais involuntárias.', risk: 'Escala errada produz correções musicais erradas.', undo: 'Compare o take cru e reduza quantidade ou velocidade da correção.' },
    { id: 'vocal-layers', category: 'voz', title: 'Dobras, adlibs e harmonias', intents: ['dobra', 'adlib', 'harmonia vocal', 'camadas'], tags: ['voz', 'arranjo'], answer: 'Mantenha lead no centro; use dobras para ênfase, adlibs para resposta e harmonias em pontos estruturais. Corte camadas quando competirem com a mensagem.', listen: 'A lead continua inteligível em mono e as camadas ampliam o refrão.', risk: 'Muitas camadas acumulam médios e sibilância.', undo: 'Mute grupos por função e recoloque apenas o que muda a emoção.' },
    { id: 'guitar-di', category: 'guitarra', title: 'Gravar guitarra DI', intents: ['guitarra', 'di', 'instrumento hi-z', 'reamp'], tags: ['entrada', 'gravação'], answer: 'Use entrada instrumento/Hi-Z, cabo curto e ganho com margem. Grave DI limpa e monitore por amp sim leve; mantenha a fonte sem efeitos destrutivos.', listen: 'Ataque definido, sem clipping e ruído estável quando as cordas param.', risk: 'Entrada de linha pode carregar captadores e perder agudos.', undo: 'Preserve a DI e refaça apenas monitoração ou reamp.' },
    { id: 'guitar-noise', category: 'guitarra', title: 'Ruído, aterramento e gate', intents: ['hum', 'ruído guitarra', 'gate', 'aterramento'], tags: ['guitarra', 'diagnóstico'], answer: 'Teste cabo, fonte, posição e entrada um por vez. Use gate somente depois de identificar o ruído; ajuste threshold abaixo das notas fracas e release natural.', listen: 'Pausas ficam limpas sem cortar sustain.', risk: 'Não desmonte rede elétrica; risco físico exige técnico qualificado.', undo: 'Bypass do gate e retorno à cadeia DI mínima.' },
    { id: 'drums', category: 'produção', title: 'Programação de drums', intents: ['drums', 'bateria', 'groove', 'hat', 'kick', 'caixa'], tags: ['ritmo', 'velocity', 'swing'], answer: 'Defina kick e caixa pela função do groove, varie velocity de hats e desloque apenas elementos que precisam de sensação humana. Faça loop de quatro compassos antes de adicionar fills.', listen: 'O corpo acompanha o pulso e a caixa mantém referência mesmo em volume baixo.', risk: 'Aleatoriedade indiscriminada perde intenção.', undo: 'Quantize a base e reintroduza variações uma por vez.' },
    { id: 'bass-808', category: 'produção', title: '808 e baixo', intents: ['808', 'baixo', 'sub', 'grave'], tags: ['afinação', 'mono', 'kick'], answer: 'Afine o fundamental, defina prioridade entre kick e baixo e confira duração das notas. Mantenha sub majoritariamente mono e use saturação leve para tradução em caixas pequenas.', listen: 'Notas são distinguíveis e kick/baixo não desaparecem juntos.', risk: 'Sub inaudível em fones pequenos pode enganar decisões.', undo: 'Remova saturação e sidechain, depois reconstrua pelo balanço.' },
    { id: 'harmony', category: 'teoria', title: 'Acordes e melodia', intents: ['acorde', 'harmonia', 'melodia', 'escala', 'tonalidade'], tags: ['teoria', 'notas'], answer: 'Escolha centro tonal, gere acordes com as fórmulas do índice e teste condução de vozes com movimentos curtos. Faça a melodia alternar notas do acorde e tensões resolvidas.', listen: 'A progressão tem direção e a melodia parece pertencer ao mesmo centro.', risk: 'Teoria descreve opções; a audição decide.', undo: 'Volte a tríades simples e uma melodia de poucas notas.' },
    { id: 'counterpoint', category: 'teoria', title: 'Contraponto básico', intents: ['contraponto', 'segunda melodia', 'vozes'], tags: ['teoria', 'arranjo'], answer: 'Dê ritmos e registros diferentes às linhas. Favoreça movimento contrário ou oblíquo e reserve uníssono para ênfase. Confira colisões em segundos menores.', listen: 'Cada linha é cantável sozinha e o conjunto permanece claro.', risk: 'Movimento constante em blocos reduz independência.', undo: 'Silencie a linha secundária e reescreva somente finais de frase.' },
    { id: 'arrangement', category: 'arranjo', title: 'Estrutura de beat e instrumental', intents: ['arranjo', 'estrutura', 'intro', 'refrão', 'beat'], tags: ['energia', 'seções'], answer: 'Marque seções por função e contraste. A cada 4 ou 8 compassos, mude densidade, registro, ritmo ou textura; preserve um elemento âncora.', listen: 'É possível identificar verso e refrão sem olhar a tela.', risk: 'Adicionar elemento em toda transição reduz impacto.', undo: 'Crie versão mínima com drums, baixo e elemento principal.' },
    { id: 'automation', category: 'arranjo', title: 'Automação e transições', intents: ['automação', 'transição', 'riser', 'filtro'], tags: ['arranjo', 'movimento'], answer: 'Automatize uma causa musical clara: entrada, saída, foco ou tensão. Prefira volume, filtro e envio antes de empilhar efeitos.', listen: 'A transição prepara a próxima seção sem chamar mais atenção que ela.', risk: 'Automação não documentada dificulta reversão.', undo: 'Desative o clip de automação e compare em volume equivalente.' },
    { id: 'eq', category: 'mix', title: 'EQ corretivo', intents: ['eq', 'equalização', 'frequência', 'ressonância'], tags: ['mix', 'filtro'], answer: 'Resolva arranjo e ganho primeiro. Varra somente para localizar suspeita, reduza em contexto com Q moderado e compare com bypass nivelado.', listen: 'A fonte encaixa melhor sem ficar menor ou opaca.', risk: 'Solo prolongado incentiva correções que não servem à mix.', undo: 'Zere bandas e reative uma por vez.' },
    { id: 'compression', category: 'mix', title: 'Compressão e dinâmica', intents: ['compressor', 'compressão', 'dinâmica', 'attack', 'release'], tags: ['mix', 'transiente'], answer: 'Defina objetivo: controlar pico, sustentar corpo ou criar movimento. Comece em ratio 2:1–4:1, ajuste attack para preservar ou domar transiente e release que respire no tempo.', listen: 'A fonte fica estável sem perder ataque nem bombear sem intenção.', risk: 'Mais alto costuma parecer melhor; nivele a saída.', undo: 'Bypass em volume equivalente e reduza a redução de ganho.' },
    { id: 'depth', category: 'mix', title: 'Reverb, delay e profundidade', intents: ['reverb', 'delay', 'profundidade', 'ambiente'], tags: ['mix', 'espaço'], answer: 'Use pre-delay para separar fonte e cauda, filtre o retorno e sincronize delay ao pulso quando útil. Menos envio aproxima; mais envio e menos agudo afastam.', listen: 'A fonte tem espaço sem perder palavras ou ataque.', risk: 'Graves e médios-baixos no retorno mascaram a mix.', undo: 'Mute retornos, reative um por vez e ajuste em contexto.' },
    { id: 'stereo', category: 'mix', title: 'Panorama, mono e fase', intents: ['pan', 'panorama', 'mono', 'fase', 'estéreo'], tags: ['mix', 'correlação'], answer: 'Defina centro para elementos fundamentais, distribua complementares e confira mono frequentemente. Corrija timing/polaridade na origem antes de usar widening.', listen: 'Centro permanece firme e nenhum elemento essencial some em mono.', risk: 'Largura artificial pode criar cancelamento.', undo: 'Remova widening e retorne pans ao centro para novo balanço.' },
    { id: 'reference', category: 'mix', title: 'Referência em volume equivalente', intents: ['referência', 'comparar', 'a/b'], tags: ['mix', 'decisão'], answer: 'Escolha referência por estética e entrega, alinhe o trecho e reduza seu ganho até percepção semelhante. Compare grave, voz, transientes, largura e dinâmica em ciclos curtos.', listen: 'Diferenças orientam uma ação concreta em vez de cópia de loudness.', risk: 'Referência mais alta distorce julgamento.', undo: 'Desligue a referência e confirme a decisão na música inteira.' },
    { id: 'master', category: 'master', title: 'Headroom, loudness e true peak', intents: ['master', 'loudness', 'lufs', 'true peak', 'limiter'], tags: ['entrega', 'headroom'], answer: 'Entregue mix sem clipping e preserve dinâmica coerente. Ajuste limiter pelo material, verifique true peak e plataforma-alvo; não existe LUFS universal para toda música.', listen: 'Impacto permanece em volume equivalente e não surgem distorções nos picos.', risk: 'Perseguir número pode destruir transientes.', undo: 'Retorne à mix pré-limiter e reduza a densidade por etapas.' },
    { id: 'export', category: 'entrega', title: 'Exportar mix, master e stems', intents: ['exportar', 'wav', 'stems', 'bit depth', 'sample rate'], tags: ['entrega', 'arquivo'], answer: 'Confirme início/fim, sample rate do projeto e destino. Para arquivo de trabalho use WAV; exporte stems do mesmo ponto, com nomes e sem normalização surpresa.', listen: 'Reimporte o arquivo e confirme duração, sincronismo, canais e ausência de clip.', risk: 'Não sobrescreva a única versão aprovada.', undo: 'Mantenha exportações versionadas e o projeto-fonte intacto.' },
    { id: 'organization', category: 'fluxo', title: 'Organização e backup', intents: ['organizar', 'backup', 'nome', 'versão', 'projeto'], tags: ['arquivos', 'segurança'], answer: 'Use nome curto, data e versão; salve projeto, gravações e manifesto de recursos. Faça cópia em outro dispositivo e teste restauração.', listen: 'Uma pessoa consegue localizar a versão e suas dependências sem adivinhar.', risk: 'Sincronização não substitui backup versionado.', undo: 'Preserve originais e reorganize por cópia antes de mover.' },
    { id: 'licenses', category: 'direitos', title: 'Licenças de sample, beat e colaboração', intents: ['licença', 'sample', 'beat', 'direito', 'royalty'], tags: ['direitos', 'proveniência'], answer: 'Registre fonte, licença, autor, data e restrições de cada recurso. Confirme por escrito splits e autorização antes de publicar; trate licença por arquivo, não pelo nome do site.', listen: 'O manifesto permite provar origem e condições de uso.', risk: '“Grátis” não significa livre para redistribuir ou usar comercialmente.', undo: 'Substitua o recurso de origem incerta antes da entrega.' }
  ];

  var GLOSSARY = {
    '808': 'baixo/subgrave derivado da estética da TR-808; também usado como nome de bass longo',
    'bater': 'soar forte e convincente no groove, não apenas medir mais alto',
    'beat': 'base instrumental rítmica; no uso brasileiro pode significar a produção inteira',
    'bounce': 'arquivo de áudio renderizado a partir de pistas ou mix',
    'clipar': 'ultrapassar a faixa disponível e gerar clipping',
    'comping': 'montagem de uma performance final a partir de vários takes',
    'DI': 'sinal direto de instrumento, antes de amplificador ou simulação',
    'embolado': 'muitos elementos mascarando uns aos outros, geralmente em médios/graves',
    'headroom': 'margem entre os picos e o limite digital',
    'na cara': 'fonte percebida próxima, presente e direta',
    'punch': 'sensação de impacto definida por transiente e corpo',
    'swing': 'deslocamento rítmico que altera a relação entre subdivisões',
    'take': 'uma tentativa gravada de performance',
    'timbrar': 'escolher e ajustar a identidade sonora de uma fonte',
    'track': 'pista ou faixa; o contexto define se é canal ou música completa',
    'true peak': 'estimativa de pico entre amostras, relevante para codificação e entrega'
  };

  var RESOURCES = [
    ['melda-mfreefxbundle','MFreeFXBundle / MAutoPitch',['voz','mix','efeitos'],'freeware proprietário','sem conta','verificar EULA','https://www.meldaproduction.com/MFreeFxBundle'],
    ['izotope-vocal-doubler','iZotope Vocal Doubler',['voz'],'freeware proprietário','requer conta','verificar EULA','https://www.izotope.com/products/vocal-doubler.html'],
    ['neural-amp-modeler','Neural Amp Modeler',['guitarra','baixo','amp'],'código aberto','sem conta','MIT; modelos têm licença própria','https://github.com/sdatkinson/NeuralAmpModelerPlugin'],
    ['chowdsp-byod','ChowDSP BYOD',['guitarra','baixo','efeitos'],'código aberto','sem conta','GPL-3.0','https://github.com/Chowdhury-DSP/BYOD'],
    ['blue-cat-free-amp','Blue Cat Free Amp',['guitarra','amp'],'freeware proprietário','sem conta','verificar termos do fornecedor','https://www.bluecataudio.com/Products/Product_FreeAmp/'],
    ['amplitube-5-cs','AmpliTube 5 CS',['guitarra','baixo','amp'],'freeware proprietário','requer conta','verificar EULA','https://www.ikmultimedia.com/products/amplitube5cs/index.php?p=info'],
    ['tdr-nova','TDR Nova',['mix','eq','dinâmica'],'freeware proprietário','sem conta','verificar EULA','https://www.tokyodawn.net/tdr-nova/free/'],
    ['voxengo-span','Voxengo SPAN',['análise','mix','master'],'freeware proprietário','sem conta','verificar EULA','https://www.voxengo.com/product/span/'],
    ['loudmax','LoudMax',['limiter','master'],'freeware proprietário','sem conta','verificar EULA','https://loudmax.blogspot.com/'],
    ['youlean-free','Youlean Loudness Meter 2 Free',['análise','master'],'freeware proprietário','sem conta','licença depende do usuário/organização','https://youlean.co/youlean-loudness-meter/'],
    ['surge-xt','Surge XT',['instrumento','synth'],'código aberto','sem conta','GPL-3.0; conteúdo separado','https://surge-synthesizer.github.io/'],
    ['dexed','Dexed',['instrumento','synth FM'],'código aberto','sem conta','GPL-3.0; bancos separados','https://github.com/asb2m10/dexed'],
    ['vital-basic','Vital Basic',['instrumento','wavetable'],'modelo misto','requer conta','verificar EULA e conteúdo','https://vital.audio/'],
    ['decent-sampler','Decent Sampler',['instrumento','sampler'],'freeware proprietário','sem conta','licença por biblioteca','https://www.decentsamples.com/product/decent-sampler-plugin/'],
    ['komplete-start','Komplete Start',['instrumento','drums','efeitos'],'freeware proprietário','requer conta','verificar EULA','https://www.native-instruments.com/en/products/komplete/bundles/komplete-start/'],
    ['99sounds','99Sounds',['samples','loops'],'biblioteca royalty-free','sem conta','proíbe redistribuir arquivos crus','https://99sounds.org/license/'],
    ['bandlab-sounds','BandLab Sounds',['samples','loops'],'biblioteca royalty-free','requer conta','uso em composição; sem redistribuição isolada','https://help.bandlab.com/hc/en-us/articles/360018942593-BandLab-Sounds'],
    ['freesound','Freesound',['samples','foley'],'licença por arquivo','requer conta','filtrar CC0/CC BY para uso comercial','https://freesound.org/help/faq/'],
    ['ollama-qwen25-7b','Qwen2.5 7B Instruct',['IA local','assistente'],'modelo aberto','sem conta','Apache-2.0; download manual','https://ollama.com/library/qwen2.5%3A7b-instruct'],
    ['ollama-granite33-2b','Granite 3.3 2B',['IA local','assistente leve'],'modelo aberto','sem conta','Apache-2.0; download manual','https://ollama.com/library/granite3.3%3A2b']
  ].map(function (row) {
    return { id: row[0], name: row[1], categories: row[2], kind: row[3], account: row[4], license: row[5], url: row[6], state: 'disponível; instalação não detectada' };
  });

  window.DuckKnowledge = deepFreeze({ theory: THEORY, guides: GUIDES, glossary: GLOSSARY, resources: RESOURCES });
}());
