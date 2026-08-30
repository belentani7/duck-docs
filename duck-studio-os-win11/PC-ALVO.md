# PC alvo verificado

Inventário local em 2026-08-13.

## Hardware

- Equipamento: HP EliteBook 850 G6.
- Sistema: Windows 11.
- CPU: Intel Core i7-8665U, 4 núcleos e 8 threads.
- RAM: aproximadamente 15,8 GB utilizáveis.
- GPU: Intel UHD Graphics 620 integrada; 1 GB reportado pelo sistema.

## Ferramentas detectadas

- Visual Studio Code.
- Node.js e npm.
- Git.
- Rust e Cargo.
- Ollama em `C:\Users\USER\AppData\Local\Programs\Ollama\ollama.exe`.

## Ausências verificadas

- `winget` não foi localizado no PATH durante o inventário.
- Serviço Ollama não respondia em `127.0.0.1:11434`.
- Nenhum manifesto de modelo Ollama foi confirmado.
- FL Studio não foi localizado em `C:\Program Files\Image-Line`.
- Nenhuma pasta VST foi localizada nos caminhos padrão consultados:
  - `C:\Program Files\VstPlugins`
  - `C:\Program Files\Common Files\VST3`
  - `C:\Program Files\Steinberg\VstPlugins`
  - `%USERPROFILE%\Documents\Image-Line`

## Orçamento de produto

- UI desenhada para GPU integrada e tela de notebook, sem exigir WebGL contínuo.
- Um único `AudioContext` por sessão.
- Medidores desenhados em `requestAnimationFrame`; DSP em `AudioWorklet` quando necessário.
- Modelo produtor principal: `qwen2.5:7b-instruct` (4,7 GB no artefato Ollama oficial); modo estúdio leve: `granite3.3:2b` (1,5 GB); opção PT-BR avançada: Tucano somente após auditar uma distribuição local.
- Contexto padrão limitado a 4.096 tokens para preservar RAM; ampliar somente após medição.
- O aplicativo deve iniciar e manter as funções musicais mesmo sem Ollama.
- O modelo deve ser descarregado da RAM quando o usuário encerrar o assistente.
- Animação reduzida automática em economia de bateria ou preferência do sistema.
- Meta de UI: 60 fps medida; falhas devem gerar relatório, não ser ocultadas.
