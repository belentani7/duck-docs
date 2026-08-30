# Clones GitHub oficiais

Somente código aberto oficial entra em `github-clones/`. Repositórios são referências de engenharia, não dependências aprovadas automaticamente. Cada clone é shallow (`--depth 1`) para reduzir disco e registra remote, commit e licença.

## Clonar agora

- `tauri-apps/tauri`: shell desktop; Apache-2.0/MIT. https://github.com/tauri-apps/tauri
- `tauri-apps/plugins-workspace`: plugins oficiais Tauri; Apache-2.0/MIT. https://github.com/tauri-apps/plugins-workspace
- `Tonejs/Tone.js`: transporte e áudio musical Web Audio; MIT. https://github.com/Tonejs/Tone.js
- `Tonejs/Midi`: parser/escrita MIDI; MIT. https://github.com/Tonejs/Midi
- `katspaugh/wavesurfer.js`: waveform, regions, timeline e record UI; BSD-3-Clause. https://github.com/katspaugh/wavesurfer.js
- `sdatkinson/NeuralAmpModelerPlugin`: plugin e referência de modelagem de amplificadores; licença do source e do instalador/modelos tratadas separadamente. https://github.com/sdatkinson/NeuralAmpModelerPlugin
- `Chowdhury-DSP/BYOD`: pedalboard/DSP GPL-3.0; referência isolada. https://github.com/Chowdhury-DSP/BYOD
- `asb2m10/dexed`: sintetizador FM GPL-3.0; bancos e cartuchos continuam sob licença própria. https://github.com/asb2m10/dexed
- `steinbergmedia/vst3sdk`: SDK oficial VST3; clone sem submódulos, somente referência para fase futura. https://github.com/steinbergmedia/vst3sdk

## Referência sem clone inicial

- `RustAudio/cpal`: I/O nativo; aumenta complexidade e só entra se Web Audio/FL-first não cobrir a necessidade. https://github.com/RustAudio/cpal
- `FFmpeg/FFmpeg`: codebase grande e licenças GPL/LGPL dependentes do build/linking. https://github.com/FFmpeg/FFmpeg
- `audacity/audacity`: referência GPLv3, não dependência; branch principal passa por mudança estrutural. https://github.com/audacity/audacity
- Surge XT permanece referência por tamanho/escopo; não será incorporado ao app sem revisão separada de licença, build e necessidade.

## Regra

Clonar não autoriza copiar código entre licenças. Antes de importar qualquer trecho:

- localizar `LICENSE`/`COPYING`;
- registrar arquivo e commit de origem;
- confirmar compatibilidade com a distribuição DUCK;
- escrever teste próprio;
- preservar avisos e oferecer código-fonte quando o copyleft exigir;
- preferir pacote oficial versionado quando a biblioteca virar dependência.
