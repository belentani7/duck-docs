# Checklist de aceitação

Marcar somente com evidência fresca. Cada item registra comando/teste, data, ambiente e resultado.

## Produto

- [ ] Instalador Windows abre sem permissões administrativas.
- [ ] Funções principais operam sem internet e sem chave de API.
- [ ] Estado `não detectado` não aparece como `instalado` ou `testado`.
- [ ] Nenhuma função de coding, terminal ou geração de código aparece ao produtor.
- [ ] Projeto novo, abrir, salvar, autosave e recuperação foram testados.
- [ ] Export MIDI e WAV foram abertos em ferramenta independente.

## HTML offline prioritário

- [ ] Todas as páginas abrem por `file://` sem servidor.
- [ ] Navegação mantém contexto do projeto entre páginas.
- [ ] Base PT-BR funciona sem Ollama.
- [ ] Ollama nunca inicia, baixa ou recebe prompt automaticamente.
- [ ] IA local aparece somente após base insuficiente ou ativação explícita.
- [ ] A resposta identifica `Base local` ou o nome real do modelo.
- [ ] `Limpar temporários` remove somente chaves `duck.temp.*` de `localStorage` e `sessionStorage`.
- [ ] Limpeza temporária preserva base embutida, projeto, mixer, pattern e `duck.userMemory.v1`.
- [ ] Limpeza de memória persistente possui ação separada, confirmação e resumo.
- [ ] Exportação de memória mostra exatamente quais camadas serão incluídas.

## Mixer e áudio

- [ ] Existe um único `AudioContext` por sessão.
- [ ] Mixer possui 16 canais, retornos A/B e master.
- [ ] Fader, pan, mute, solo, arm, sends e medidores respondem.
- [ ] Fader e pan são operáveis por teclado e anunciados por leitor de tela.
- [ ] Mudança rápida de ganho não cria zipper noise mensurável/perceptível no teste.
- [ ] Mute/solo não perdem valores anteriores.
- [ ] Gravação exige permissão e produz arquivo não vazio.
- [ ] Microfone e monitoração permanecem desligados no boot.
- [ ] Teste longo não mostra crescimento de contexts, listeners ou nodes.

## Agente musical

- [ ] Prompt integral em PT-BR e escopo exclusivo de produção musical.
- [ ] Qwen2.5 7B selecionável como produtor principal.
- [ ] Granite 3.3 2B selecionável como modo leve.
- [ ] Contexto padrão limitado a 4.096 tokens.
- [ ] Modelo pode ser cancelado e descarregado para liberar memória.
- [ ] Sem Ollama, a base determinística continua utilizável.
- [ ] Ações são declarativas, validadas e confirmadas.
- [ ] O agente não inventa plugin instalado nem medição de áudio.

## FL Studio

- [ ] FL Studio foi detectado por confirmação do usuário e path válido.
- [ ] Script MIDI usa somente API oficial documentada.
- [ ] Instalação/atualização do script cria backup reversível.
- [ ] Handshake real identifica versão de protocolo.
- [ ] Transporte, seleção, fader, pan, mute e solo foram testados individualmente.
- [ ] Feedback bidirecional não cria loop MIDI.
- [ ] MIDI não é descrito como transporte de áudio.
- [ ] Compatibilidade fica `não verificada` enquanto não houver FL instalado.

## Recursos e licenças

- [ ] Cada plugin aponta à fonte oficial e declara regime/licença.
- [ ] Recurso proprietário não foi clonado nem redistribuído.
- [ ] Cada repositório GitHub registra remote, commit e licença.
- [ ] Cada sample registra hash, URL, autor, licença, atribuição e data.
- [ ] CC BY-NC fica fora de catálogo comercial.
- [ ] Exportação de pacote bloqueia sample sem permissão de redistribuição.
- [ ] Nenhum instrumental de terceiro é apresentado como ativo próprio.

## UI e acessibilidade

- [ ] 1366×768, 1920×1080 e janela compacta sem overflow involuntário.
- [ ] Contraste WCAG AA medido.
- [ ] Foco visível, ordem lógica e restauração após modal.
- [ ] Alvos de interação de pelo menos 44×44 px onde aplicável.
- [ ] `prefers-reduced-motion` elimina movimento não essencial.
- [ ] Lista de 1.000 itens continua responsiva e virtualizada.
- [ ] 60 fps foi medido no PC alvo ou o relatório registra a limitação.

## Segurança e privacidade

- [ ] Secret scan sem credenciais.
- [ ] Auditoria de rede offline mostra zero destinos externos.
- [ ] CSP permite somente assets locais e Ollama opt-in em loopback.
- [ ] Window capabilities mínimas e separadas.
- [ ] Renderer não possui shell nem filesystem amplo.
- [ ] Projeto malformado, path traversal e symlink externo são recusados.
- [ ] Histórico off não escreve conversa.
- [ ] Processo e portas próprios fecham ao sair.

## Gates

- [ ] Typecheck: comando, exit 0.
- [ ] Lint: comando, exit 0.
- [ ] Testes unitários: contagem e zero falhas.
- [ ] Rust fmt/clippy/test: exit 0.
- [ ] Build frontend e Tauri: exit 0.
- [ ] Playwright: contagem, zero falhas relevantes.
- [ ] Smoke do instalador: exit 0.
- [ ] `npm audit --omit=dev`: resultado registrado.
- [ ] `git diff --check`: exit 0.
- [ ] Nenhuma afirmação de publicação sem URL e HTTP verificados.
