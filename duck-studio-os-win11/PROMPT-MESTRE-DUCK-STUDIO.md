# PROMPT MESTRE — construir DUCK Studio Local para Windows 11

## Papel

Atue como arquiteto principal, engenheiro de áudio, desenvolvedor Tauri/Rust/TypeScript, designer de produto musical, especialista em integração MIDI com FL Studio, pesquisador de licenças e responsável por QA. Produza código executável, local-first e verificável. Tome decisões simples e robustas. Leia o repositório e a documentação desta pasta antes de escrever. Preserve materiais existentes e registre proveniência.

## Missão

Construir **DUCK Studio Local**, uma estação complementar ao FL Studio para Windows 11. O produto deve encaixar no posto de trabalho real de DUCK: iniciar rápido, operar sem chave de API, continuar útil sem internet, oferecer mixer com faders, instrumentos de rascunho, sequenciador, gravação rápida, catálogo de plugins e recursos, integração MIDI com FL Studio e um agente flutuante em português brasileiro.

O resultado não é uma página promocional nem um mockup. É um aplicativo desktop instalável, com áudio funcional, persistência local, controles acessíveis, testes automatizados e documentação de uso. A interface deve transmitir produto premium de estúdio, mantendo desempenho no HP EliteBook 850 G6 descrito em `PC-ALVO.md`.

## Resultado de produto

Ao abrir DUCK Studio, o usuário encontra:

1. uma estação principal com transporte, browser de recursos, rack de criação e mixer;
2. uma janela flutuante DUCK que fica sobre o FL Studio quando solicitada;
3. funcionamento offline imediato com base de conhecimento PT-BR;
4. opção de ativar Ollama local, sem chave e sem envio de dados;
5. orientação concreta para voz, guitarra, drums, instrumentais, arranjo, mix e master;
6. integração FL Studio por MIDI e script oficial quando FL estiver instalado;
7. catálogo de plugins e sons com estado real: instalado, disponível, requer conta, licença pendente ou incompatível;
8. gravação e exportação local controladas pelo usuário.

## Princípios obrigatórios

- **Local-first**: áudio, projeto, catálogo, histórico e IA permanecem no computador.
- **Sem chave**: nenhuma função central depende de API paga, token ou conta cloud.
- **Verdade de estado**: diferenciar detectado, instalado, testado, configurado, disponível para download e somente recomendado.
- **FL-first**: FL Studio continua DAW, host VST3 e renderizador profissional. DUCK Studio controla, ensina, cataloga e cria rascunhos.
- **Áudio primeiro**: transporte, faders, metrônomo e gravação funcionam mesmo se animações e IA forem desativadas.
- **Consentimento**: microfone, filesystem, downloads, instalação, MIDI, gravação e alterações persistentes exigem gesto explícito.
- **Procedência**: nenhum sample, instrumental, preset, captura de amp ou plugin é redistribuído sem licença comprovada.
- **Acessibilidade**: WCAG 2.2 AA, teclado completo, foco claro, leitor de tela, contraste e movimento reduzido.
- **Desempenho medido**: metas são verificadas no PC alvo e registradas; não inventar 60 fps, latência ou uso de RAM.

## Direção visual

Crie uma única linguagem coerente derivada da identidade DUCK já auditada: **console de estúdio industrial, preto profundo, creme técnico e verde elétrico controlado**. A sensação é hardware profissional, não dashboard SaaS.

- Fundo carvão quase preto, superfícies em camadas com diferença real de luminância e hairlines metálicas.
- Creme para texto primário e marcações de escala; verde para estados ativos, sinal e foco, nunca como brilho ornamental generalizado.
- Vermelho somente para gravação, clipping e ação destrutiva; âmbar para atenção.
- Tipografia local: Archivo Black em títulos de impacto, Space Grotesk em interface, DM Mono em valores, BPM, dB, tempo e diagnósticos.
- Faders verticais com trilho preciso, escala em dB, cap tátil e medidor adjacente. O valor deve continuar legível durante drag.
- Botões de hardware com estados pressionado, focado, desabilitado e latched distintos.
- Profundidade por material, sombra curta, borda e contraste; sem gradiente roxo sobre branco.
- Movimento com GSAP + CustomEase apenas em abertura, troca de módulo e feedback editorial. Criar em `gsap.context()` e limpar em unmount.
- Nenhuma animação contínua pesada. `will-change` é aplicado durante a animação e removido ao terminar.
- Layout responsivo para notebook 1366×768, desktop 1920×1080 e janela compacta. Em largura estreita, o mixer rola horizontalmente e preserva faders utilizáveis.

## Arquitetura fixa

Use:

- Tauri 2 para desktop Windows.
- Rust estável no núcleo.
- Vite + TypeScript estrito no frontend.
- HTML semântico e CSS organizado por tokens, layout, componentes e estados.
- SQLite local para índice de recursos, preferências e histórico opt-in.
- JSON versionado para projetos `.duckstudio`.
- Web Audio para laboratório musical e preview.
- `AudioWorklet` para DSP/medição que precisa sair da thread de UI.
- Ollama em `127.0.0.1:11434` como motor generativo opcional.
- Puter.js como via online opt-in sem chave própria, carregada dinamicamente após consentimento e nunca necessária ao produto.
- FTS5 ou busca textual local para a base especialista offline.
- MIDI virtual + script oficial do FL Studio para controle bidirecional.

Crie o código em `app/` e mantenha os documentos da raiz como contrato. Estrutura mínima:

```text
app/
  package.json
  vite.config.ts
  tsconfig.json
  src/
    main.ts
    styles/
    ui/
    audio/
    mixer/
    sequencer/
    instruments/
    resources/
    assistant/
    flstudio/
    project/
    accessibility/
  public/
    fonts/
    icons/
  src-tauri/
    Cargo.toml
    tauri.conf.json
    capabilities/
    src/
      main.rs
      commands/
      projects/
      catalog/
      ollama/
      midi/
  tests/
  scripts/
```

Dependências precisam de versão fixada no lockfile, licença registrada e justificativa funcional. Use APIs nativas quando resolvem o caso. Não crie wrappers que apenas renomeiam uma chamada.

## Janela principal

### Barra superior

- Marca DUCK Studio e nome do projeto.
- Transporte: voltar, play/pause, stop, record, loop.
- BPM editável entre 30 e 300, tap tempo e swing entre 0 e 75%.
- Compasso e posição musical.
- Estado de áudio, dispositivo, MIDI, FL Studio e agente.
- Indicadores de CPU de áudio, underrun detectado, memória do modelo e bateria quando disponíveis.
- Ações de projeto: novo, abrir, salvar, salvar como e exportar.

Atalhos de transporte funcionam fora de campos de texto. Espaço alterna play/pause; Escape cancela gravação pendente ou fecha modal; atalhos aparecem em ajuda e são configuráveis.

### Browser esquerdo

Abas:

- **Meus sons**: pastas autorizadas pelo usuário, sem varredura ampla automática.
- **Plugins**: inventário read-only por formato e caminho.
- **Kits**: agrupamentos locais com licença.
- **Guias**: voz, guitarra, beat, arranjo, mix, master e exportação.
- **Recursos**: links oficiais de `CATALOGO-RECURSOS.json`.

Filtros por categoria, formato, BPM, tonalidade, licença, favorito e instalado. Mostrar origem e licença em cada detalhe. Listas acima de 100 itens são virtualizadas. Preview de sample possui volume próprio, stop imediato e nunca atravessa o master sem proteção.

### Área central

Três modos:

1. **Sketch**: sequenciador de 16/32 passos, drum rack, piano roll compacto e pads de acordes.
2. **Studio**: instrumentos, gravação e cadeia ativa do canal selecionado.
3. **Learn**: guia contextual sincronizado com a tarefa, sem ocultar os controles principais.

A troca preserva áudio e estado. O usuário consegue recolher o browser e ampliar o mixer.

### Mixer

Implementar 16 canais mais retornos A/B e master.

Cada canal contém:

- nome, cor e número;
- source selector;
- trim de entrada;
- medidor peak/RMS com hold de clipping;
- pan de -100 a +100;
- fader vertical de silêncio a +6 dB com escala e valor numérico;
- mute, solo e arm;
- sends A/B pre/post configuráveis;
- três slots de efeito interno seguro;
- botão de reset e histórico da última alteração;
- indicador de controle FL quando mapeado.

Requisitos de interação:

- ponteiro, toque e teclado;
- setas alteram passo fino, Shift altera passo amplo, Home/End usam limites seguros;
- duplo clique repõe 0 dB no fader e centro no pan, após configuração clara;
- valor anunciado por leitor de tela;
- movimento logarítmico coerente com ganho percebido;
- automação de `AudioParam` elimina zipper noise;
- mute/solo preservam o valor do fader;
- master inclui proteção contra clipping, medição e bypass de efeitos, nunca auto-master opaco.

### Sequenciador e instrumentais

- 8 pistas iniciais, 16/32 passos, velocity, probability, microtiming, ratchet simples, swing e comprimento por pista.
- Pattern bank A–H e encadeamento para criar uma estrutura curta.
- Pads de acordes configuráveis por tonalidade e escala, com inversões legíveis.
- Bassline monofônica, arpejador e synth subtrativo leve.
- Drum rack aceita samples licenciados do usuário e inclui kit demonstrativo sintetizado em tempo real, sem arquivos de terceiros.
- Piano roll compacto com snap configurável e edição de velocity.
- Exportar MIDI para continuar no FL Studio.
- Exportar bounce WAV do laboratório, com sample rate e bit depth declarados e validação de clipping.
- Gerador de ideia cria padrões originais por regras musicais locais; mostra seed, tonalidade e BPM. Não imita artista vivo nem afirma autoria humana.

### Instrumentos internos

- Synth polifônico: osciladores, envelope ADSR, filtro, LFO, unison moderado e medidor.
- Sampler: one-shot e loop, trim, start/end, reverse, pitch, envelope e choke group.
- Drum synth: kick, snare/clap, hat e percussion por síntese procedural.
- Guitar utility: afinador, noise gate leve, EQ, cabinet/IR somente quando o arquivo possui licença, delay e reverb de prática.
- Vocal utility: gain staging, filtro passa-altas, de-esser simples, compressor leve, delay/reverb de monitoração e guia de take.
- Scope: waveform, espectro e correlação, desligáveis para economizar GPU/CPU.

Rotular esses módulos como ferramentas de criação/monitoramento. Não prometer equivalência a plugins profissionais externos.

## Gravação

- Permissão de microfone solicitada somente ao pressionar preparar/gravar.
- Escolha de entrada e teste de nível antes de gravar.
- Contagem de 1 ou 2 compassos e metrônomo configurável.
- Gravação em pista armada, nome automático com data, projeto e take.
- Take nunca sobrescrito; comping simples por seleção de regiões pode entrar após o fluxo básico estar estável.
- Monitoramento desligado por padrão para evitar feedback.
- Aviso claro quando latência do navegador não é adequada.
- Arquivo gravado permanece local e recebe metadados de origem `recorded_by_user`.

## Agente flutuante DUCK

Construir uma segunda janela nativa independente da janela principal.

### Comportamento

- Sempre no topo opcional.
- Modo compacto de uma linha, modo conversa e modo guia passo a passo.
- Click-through alternável por atalho; estado visível na borda e no tray.
- Arrastar por área dedicada sem interceptar faders do FL Studio.
- Lembrar posição por monitor e recuperar posição quando a tela muda.
- Atalho global para mostrar/ocultar e outro para ativar escuta por texto; nenhuma escuta de microfone permanente.
- Fechar a janela não encerra a estação; sair pelo tray encerra processos próprios de forma limpa.

### Motores

Ao iniciar:

1. carregar `BASE-CONHECIMENTO-PTBR.json` e habilitar resposta determinística;
2. testar conexão local ao Ollama sem iniciar download;
3. detectar modelos instalados;
4. oferecer Qwen2.5 7B Instruct como produtor principal e Granite 3.3 2B como modo estúdio leve, mostrando licença, download, RAM estimada e impacto antes de qualquer descarga;
5. usar o modelo somente após seleção explícita;
6. voltar à base local após timeout, cancelamento ou memória insuficiente;
7. descarregar o modelo quando o usuário escolher `Liberar memória` ou quando uma sessão de áudio crítica começar.
8. oferecer Puter online somente após insuficiência local e consentimento, com login/user-pays, prévia do prompt e contexto minimizado.

### Capacidades

- Explicar um procedimento em etapas curtas.
- Diagnosticar configuração a partir de dados que o usuário fornece.
- Propor cadeia vocal/guitarra/mix usando apenas plugins registrados como instalados.
- Converter intenção em BPM, tonalidade, estrutura e pattern inicial com justificativa.
- Abrir um guia interno.
- Preparar ações de transporte/mixer/tempo para confirmação.
- Gerar checklist de gravação e exportação.
- Pesquisar catálogo local por função, licença e requisito.
- Responder em PT-BR; aceitar consulta ES/EN e devolver PT-BR quando configurado.
- Trabalhar somente em produção musical, performance, organização de estúdio e uso da própria ferramenta; nenhum modo de coding, terminal ou programação é exposto ao usuário.

### Limites

- Nenhuma execução de shell livre.
- Nenhum download ou instalação automática.
- Nenhuma alteração de muitos canais sem resumo e confirmação.
- Nenhum acesso ao conteúdo inteiro do disco.
- Nenhum envio de áudio, projeto ou conversa à internet.
- Na opção Puter consentida, enviar exclusivamente o texto mostrado na prévia; nunca áudio, arquivos, paths ou memória persistente por padrão.
- Nenhuma invenção de medição: se não analisou o sinal, pede teste ou declara hipótese.

## Integração FL Studio

Implemente uma página `Conectar ao FL Studio` com verificação por etapas:

1. detectar caminho escolhido do FL sem afirmar instalação por heurística única;
2. mostrar local exato do script MIDI;
3. gerar `device_DUCK.py` usando somente API oficial documentada;
4. permitir que o usuário copie após pré-visualização e confirmação;
5. orientar criação/seleção do porto MIDI virtual;
6. detectar handshake e mostrar versão de protocolo;
7. mapear play, stop, record, tempo, seleção, volume, pan, mute e solo apenas quando suportados;
8. testar feedback e impedir loop MIDI;
9. oferecer diagnóstico que separa `porta ausente`, `script não carregado`, `sem feedback`, `comando incompatível` e `FL fechado`;
10. fornecer remoção reversível do script DUCK.

Não modificar outros scripts de hardware. Fazer backup do arquivo DUCK anterior quando o usuário autorizar atualização.

## Catálogo de plugins

O scanner:

- examina somente pastas padrão ou selecionadas;
- identifica extensão, caminho, tamanho, hash e data;
- não executa DLL/VST3 no processo principal;
- marca duplicatas por hash e nome sem apagar;
- cruza com `CATALOGO-RECURSOS.json`;
- mostra `detectado`, `não testado`, `testado no FL`, `incompatível` e `quarentena`;
- registra manualmente versão, arquitetura e observações;
- nunca confunde página oficial disponível com instalação local.

MVP não instala plugins. Cada ficha mostra origem oficial, licença, conta necessária, requisitos e instrução de uso. Um botão externo exige gesto e abre navegador padrão.

## Projetos e dados

Formato `.duckstudio` em JSON versionado:

```json
{
  "schemaVersion": 1,
  "projectId": "uuid",
  "title": "Sem título",
  "tempo": 120,
  "timeSignature": [4, 4],
  "tracks": [],
  "patterns": [],
  "resources": [],
  "flMappings": [],
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

- Validar schema antes de abrir.
- Migrações explícitas e testadas.
- Autosave atômico em arquivo separado; recuperação após crash sem sobrescrever o original.
- Histórico limitado de versões locais com tamanho visível.
- Exportação de projeto não inclui samples externos por padrão; cria manifesto de dependências e licenças.
- Função `Coletar projeto` inclui somente arquivos autorizados e mostra o que ficará de fora.

## Conteúdo PT-BR obrigatório

Expandir a base local com o escopo integral de `MAPA-CONHECIMENTO-PRODUTOR-PTBR.md` e guias revisáveis:

- configurar áudio e buffer;
- gain staging;
- gravar voz em quarto doméstico;
- comping e edição vocal;
- afinação e formantes com respeito à voz;
- dobra, adlibs e harmonia;
- gravar guitarra DI;
- reamp e amp simulation;
- ruído, aterramento e gate;
- programação de drums;
- 808 e baixo;
- acordes, melodia e contraponto básico;
- estrutura de beat/instrumental;
- automação e transições;
- EQ corretivo;
- compressão e dinâmica;
- reverb, delay e profundidade;
- panorama, mono e fase;
- referência e volume equivalente;
- headroom, clipping, loudness e true peak;
- exportar stems, mix e master;
- organização, nomes e backups;
- licença de sample, beat e colaboração.

Cada guia contém: objetivo, quando usar, preparação, sequência, valores iniciais, como ouvir, erros comuns, reversão, glossário, fonte interna e revisão.

## Recursos externos

Importar os metadados de `CATALOGO-RECURSOS.json`. Priorizar conjunto pequeno e seguro:

- Voz: MAutoPitch e Vocal Doubler.
- Guitarra: Neural Amp Modeler, BYOD e Blue Cat Free Amp.
- Mix/master: TDR Nova, Voxengo SPAN e LoudMax.
- Instrumentos: Surge XT e Dexed.
- Samples: 99Sounds, BandLab Sounds, MusicRadar e Freesound com filtro de licença.

Recursos que exigem conta ficam rotulados. Graillon fica bloqueado para pipeline comercial até esclarecimento. Youlean fica condicionado ao tipo de posto/licença. Bibliotecas e modelos NAM mantêm licença individual.

## Fases de implementação

### Fase 0 — inventário e prova mínima

- Confirmar paths, Git, Node, Rust, WebView2, Ollama e ausência/presença de FL/VST.
- Ler referências locais sem modificar.
- Criar app Tauri mínimo com duas janelas e CSP.
- Reproduzir tom sintetizado por gesto e fechar `AudioContext` corretamente.
- Registrar baseline de CPU, RAM, cold start e tamanho do build.

### Fase 1 — estação funcional

- Shell visual, transporte, mixer 16+2+master e grafo Web Audio único.
- Sequenciador, drum synth, synth e sampler local.
- Projeto, autosave, recuperação e exportação MIDI/WAV.
- Browser autorizado e catálogo de recursos.
- Testes unitários e Playwright da interface.

### Fase 2 — agente local

- Janela flutuante, tray, atalhos, always-on-top e click-through.
- Busca FTS5 sobre base PT-BR.
- Integração Ollama com Qwen2.5 7B principal, Granite 3.3 2B leve e fallback determinístico.
- Ferramentas declarativas, confirmação e auditoria de ações.
- Testes de ausência do Ollama, timeout, JSON inválido e liberação de memória.

### Fase 3 — FL Studio

- MIDI virtual, script oficial, handshake, transporte e mixer.
- Feedback bidirecional e prevenção de loop.
- Instalação/remoção reversível do script após confirmação.
- Matriz de versão FL/Windows/MIDI medida no computador real.

### Fase 4 — endurecimento e entrega

- Revisão de segurança Tauri/IPC/CSP/filesystem.
- Auditoria de licenças, secrets, rede e dependências.
- Testes de áudio longos, suspensão/retorno, troca de dispositivo e crash recovery.
- Instalador Windows sem privilégios administrativos.
- Assinatura necessária antes de distribuição pública.
- Manual PT-BR, onboarding e relatório de limitações.

Hosting VST3 autônomo não entra nessas fases. Ele exige decisão separada, SDK, processo isolado e testes profissionais.

## Testes obrigatórios

### Unidade

- conversões dB/ganho e pan;
- faixa de BPM/swing/fader;
- solo/mute e sends;
- scheduling do sequenciador;
- migração e validação de projeto;
- busca da base PT-BR;
- parser de resposta do agente;
- validação de `DuckAction`;
- regras de licença e coleta de projeto;
- mensagens MIDI e prevenção de loop.

### Integração

- abrir/salvar/autosave/recuperar sem perder original;
- fluxo Web Audio com um único contexto;
- gravar somente após permissão;
- agente sem Ollama retorna base local;
- agente com Ollama cancelável e sem cloud;
- scanner não executa plugin;
- links externos dependem de gesto;
- janela flutuante recupera foco e posição;
- shutdown encerra processos próprios e fecha handles.

### Navegador/UI

- 1366×768, 1920×1080 e janela compacta;
- sem overflow involuntário;
- teclado completo em fader, knobs, browser, dialogs e chat;
- foco preso e restaurado em modal;
- reduced motion;
- contraste AA;
- leitor de tela recebe nome, estado e valor;
- lista com 1.000 recursos continua responsiva;
- zero erro de console e page error.

### Segurança e privacidade

- secret scan;
- dependências de produção sem vulnerabilidade crítica/alta aceita silenciosamente;
- CSP bloqueia origem não autorizada;
- janela `agent` não possui capability de filesystem ampla;
- histórico off não escreve conversa;
- nenhum request externo durante smoke offline;
- projeto malformado não executa conteúdo;
- path traversal e symlink fora do diretório autorizado são recusados;
- downloads e instalações continuam impossíveis sem confirmação.

### Áudio

- 30 minutos de transporte/mixer sem crescimento contínuo de contexts, nodes ou listeners;
- mudanças rápidas de fader sem clique perceptível e com automação correta;
- clipping detectado e resetável;
- troca de dispositivo recuperável;
- suspensão/resume Windows preserva projeto;
- gravação produz arquivo reproduzível e nunca vazio;
- export MIDI abre em ferramenta independente;
- medir underruns e latência; reportar números e ambiente, sem claim universal.

## Gates

Executar e registrar:

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run build
cargo fmt --check --manifest-path .\src-tauri\Cargo.toml
cargo clippy --manifest-path .\src-tauri\Cargo.toml -- -D warnings
cargo test --manifest-path .\src-tauri\Cargo.toml
npm run test:e2e
npm audit --omit=dev
```

Depois, executar smoke no binário instalado, não apenas no servidor dev. Registrar versão do Windows, hardware, driver, buffer, WebView2, FL Studio e modelo. Se um comando não existe, criar o script real antes de declarar o gate.

## Entregáveis finais

- Código fonte e lockfiles.
- Binário/instalador local verificado.
- Manual PT-BR com screenshots próprias do produto.
- Guia de FL Studio e script MIDI versionado.
- Base PT-BR com schema e data de revisão.
- Catálogo de recursos e licenças.
- SBOM e avisos de terceiros.
- Relatório de rede/privacy e secret scan.
- Relatório de testes com comandos, exit codes e contagens.
- Métricas do PC alvo: cold start, RAM, CPU, fps e estabilidade de áudio.
- Lista explícita de limitações e fases não construídas.

## Definição de pronto

DUCK Studio está pronto somente quando o instalador abre no Windows 11 sem API key; o laboratório musical funciona offline; o mixer 16+2+master responde a mouse e teclado; projeto salva e recupera; gravação e exportação geram arquivos válidos; agente funciona em base local e com Ollama; a janela flutuante opera sem capturar cliques involuntários; nenhum dado sai na auditoria offline; licenças estão registradas; testes completos passam; integração FL é chamada de verificada somente após handshake real com uma instalação de FL Studio.

Entregar estado real. Separar `implementado`, `testado localmente`, `testado com FL`, `empacotado`, `assinado` e `publicado`.
