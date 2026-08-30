# Arquitetura Windows 11 e FL Studio

## Escolha

Aplicativo desktop local em Tauri 2, frontend Vite + TypeScript e núcleo Rust. Duas janelas nativas: estação principal e assistente flutuante. FL Studio permanece responsável por projeto, plugins, áudio profissional e renderização.

```text
Janela principal Tauri                 Janela agente Tauri
browser, pads, sequencer, mixer        conversa e ações propostas
             |                                    |
             +--------- IPC tipado ----------------+
                              |
                        núcleo Rust local
                     /          |          \
          projetos locais   Ollama local   MIDI virtual
          e catálogo SQLite  127.0.0.1     e script FL
                                                |
                                            FL Studio
                                     áudio, VST3 e render
```

## Camadas

### Frontend

- Vite, TypeScript estrito, HTML semântico e CSS com custom properties.
- Componentes pequenos e explícitos; estado central tipado para transporte, mixer, projeto e assistente.
- GSAP + ScrollTrigger + CustomEase para entrada de painéis, onboarding e narrativa visual. Nenhuma animação decide estado funcional.
- Canvas 2D para medidores e scopes. WebGL fica reservado a visualizações opcionais, desligadas por padrão nesta GPU.
- Virtualização no browser de samples/plugins quando houver mais de 100 itens.

### Áudio de laboratório

Um único grafo Web Audio:

```text
fonte -> trim -> filtro/EQ simples -> pan -> fader -> envios A/B -> master
                                                    |             |
                                                    +-- retorno --+
master -> dinâmica de proteção -> analyser -> saída/gravador
```

- `GainNode`, `StereoPannerNode`, `BiquadFilterNode`, `DynamicsCompressorNode` e `AnalyserNode`.
- Mudanças de fader com `AudioParam` e rampas curtas para evitar cliques.
- `AudioWorklet` para medição/DSP que não deve bloquear UI.
- `MediaRecorder` somente para captura de demonstração quando suportado.
- Seleção de dispositivo e permissões explícitas; nenhum microfone inicia automaticamente.
- Web Audio é laboratório, sequenciador e preview. Não recebe claim de motor DAW/ASIO.

### Núcleo Rust

- Abrir/salvar projetos `.duckstudio` em diretório escolhido pelo usuário.
- Indexar metadados de samples autorizados sem duplicar os arquivos.
- Persistir catálogo e preferências em SQLite local.
- Validar todos os comandos da UI.
- Controlar janela flutuante, tray, atalhos e ciclo do processo Ollama.
- Nunca oferecer um endpoint de shell arbitrário ao renderer.

### Integração FL Studio

Fase principal de integração:

1. DUCK publica ou seleciona um porto MIDI app-to-app.
2. Usuário habilita esse porto em FL Studio MIDI Settings.
3. Script oficial fica em `%USERPROFILE%\Documents\Image-Line\FL Studio\Settings\Hardware\DUCK Studio\device_DUCK.py`.
4. Script usa apenas módulos documentados: `transport`, `mixer`, `channels`, `patterns`, `playlist`, `plugins`, `ui` e `device`.
5. Mensagens de feedback mantêm faders, mute, solo, seleção e transporte sincronizados.

MIDI transmite controle, não áudio. DUCK não lê nem reescreve `.flp`. A integração não usa automação de mouse, scraping visual ou injeção de DLL.

### Plugins VST3

MVP: scanner read-only dos caminhos oficiais, catálogo, compatibilidade informativa e botão para orientar uso no FL. O app não carrega binários.

Evolução opcional:

- Plugin DUCK VST3 dentro do FL Studio: caminho recomendado para processar áudio mantendo o host profissional.
- Host autônomo: processo x64 separado por plugin, SDK Steinberg, timeout de scan, quarentena, crash recovery, buffers e automação. Nunca dentro do processo Tauri.

## Agente flutuante

- Janela Tauri separada, compacta, redimensionável e sempre no topo quando solicitado.
- Alternância entre modo interativo e click-through.
- Atalho global e ícone de bandeja para mostrar/ocultar.
- Modo focável com teclado, leitor de tela e contraste AA.
- Estados visíveis: `offline`, `base local`, `Ollama iniciando`, `modelo pronto`, `erro recuperável`.
- Ações propostas como estruturas declarativas: `play`, `stop`, `set_track_volume`, `toggle_mute`, `select_track`, `set_tempo`, `open_guide`.
- Pré-visualização e confirmação antes de alterar projeto, arquivo, configuração MIDI ou plugin.

## Segurança

- Assets, scripts, fontes e documentação embarcados localmente.
- CSP estrita; `connect-src` limitado a `http://127.0.0.1:11434` quando Ollama estiver habilitado.
- Capabilities Tauri distintas para `main` e `agent`; permissões mínimas por janela.
- Renderer sem shell, spawn genérico, leitura ampla de filesystem ou acesso a credenciais.
- Dados do projeto e prompts ficam locais. Histórico do assistente é opt-in e apagável.
- Se houver token futuro, usar armazenamento do sistema protegido por usuário; nunca `localStorage`.
- Canal nativo por named pipe recebe DACL explícita do usuário atual.
- Serviço HTTP local, caso necessário, usa `127.0.0.1`, porta aleatória, token de sessão e validação de origem.
- Instalador não exige administrador; binários e atualizações precisam de assinatura antes de distribuição.

## Fontes técnicas primárias

- Tauri capabilities: https://v2.tauri.app/security/capabilities/
- Tauri Window API: https://v2.tauri.app/reference/javascript/api/namespacewindow/
- Tauri CSP: https://v2.tauri.app/security/csp/
- Web Audio: https://www.w3.org/TR/webaudio/
- AudioWorklet: https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet
- Áudio de baixa latência Windows: https://learn.microsoft.com/en-us/windows-hardware/drivers/audio/low-latency-audio
- FL Studio MIDI scripting: https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/midi_scripting.htm
- FL Studio MIDI settings: https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/envsettings_midi.htm
- Linking de controladores FL: https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/automation_linking.htm
- Windows virtual MIDI: https://microsoft.github.io/MIDI/sdk-reference/Transports/Virtual/
- VST3 Developer Portal: https://steinbergmedia.github.io/vst3_dev_portal/
- VST3 SDK: https://github.com/steinbergmedia/vst3sdk
- Localizações VST3: https://steinbergmedia.github.io/vst3_dev_portal/pages/Technical%2BDocumentation/Locations%2BFormat/Plugin%2BLocations.html
