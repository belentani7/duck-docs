# DUCK Studio — alternativa HTML offline

Abrir `html-offline/index.html` directamente en Chrome o Edge. No requiere servidor, npm, CDN, instalación ni descarga.

## Módulos

- `index.html`: contexto del proyecto.
- `mixer.html`: 16 canales, master, pan, mute, solo y persistencia.
- `instrumentos.html`: sequenciador 4 × 16 con síntese Web Audio.
- `agente.html`: base PT-BR determinística; Ollama local e Puter online são opcionais e exigem consentimento.
- `recursos.html`: catálogo local com links oficiais abertos somente por gesto.
- `memoria.html`: inspeção, exportação e limpeza restrita por camada.

## Dados

Chaves persistentes: `duck.project.v1`, `duck.mixer.v1`, `duck.pattern.v1`, `duck.userMemory.v1` e `duck.settings.v1`. Temporários usam somente o prefixo `duck.temp.*` em `localStorage` ou `sessionStorage`. A limpeza remove exclusivamente esse prefixo. A base de conhecimento é uma constante JavaScript imutável e não é persistida.

Ollama usa somente `http://127.0.0.1:11434`, não inicia serviço nem baixa modelos; o consentimento não persiste entre aberturas. Puter.js é carregado de `https://js.puter.com/v2/` apenas depois de clique, opt-in e confirmação da prévia exata. O timeout encerra a espera local, mas não garante aborto remoto no SDK; respostas tardias são ignoradas e nunca persistidas automaticamente. Pollinations não é integrado porque a API atual requer chave.
