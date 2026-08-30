# Contrato de execução DUCK Studio

## Ordem obrigatória

1. Ler `PROMPT-MESTRE-DUCK-STUDIO.md` integralmente.
2. Ler `ARQUITETURA-WIN11-FL-STUDIO.md`, `PC-ALVO.md` e `CHECKLIST-ACEITACAO.md`.
3. Inventariar checkout, Git, ferramentas e hardware antes de escrever.
4. Implementar por fases verificáveis, preservando uma aplicação executável ao final de cada fase.
5. Executar os gates completos e registrar comandos, código de saída, número de testes e limitações.

## Prioridade de inteligência

1. HTML offline e base determinística respondem primeiro.
2. Ollama local é ativado somente por insuficiência da base ou escolha explícita.
3. Puter online é terceira via, carregada somente por consentimento e com prévia do contexto.
4. O produtor não recebe menus, prompts ou ferramentas de coding.
5. `duck.temp.*`, projeto, memória persistente e base imutável são camadas separadas; limpeza temporária nunca toca as demais.

## Limites

- Preservar o pack auditado `C:\Users\USER\Desktop\DUCK-EXPERIENCIA-INMERSIVA-PACK-2026-08-13` sem modificações.
- Tratar `REFERENCIAS-LOCAIS.tsv` como índice read-only. Nenhum arquivo com licença pendente pode ser copiado, empacotado ou publicado.
- Git local é obrigatório: inicializar repositório no código e criar commits descritivos por fase após gates verdes. Não criar remoto, push, publicação, email, conta, assinatura, instalação ou aceite de EULA sem autorização literal.
- Não hardcodar chaves, tokens, emails ou caminhos pessoais no produto distribuível.
- Não chamar HTML estático de modelo de linguagem. O modo offline é uma base de conhecimento pesquisável e determinística.
- Não apresentar compatibilidade FL Studio, VST3, ASIO, MIDI virtual ou latência profissional como verificada antes de teste na instalação real.

## Qualidade

- TypeScript estrito e Rust tipado; IPC com comandos declarativos e validação de faixa.
- WCAG 2.2 AA, teclado completo, foco visível, alvos de 44 por 44 px e `prefers-reduced-motion`.
- Fontes locais Archivo Black, Space Grotesk e DM Mono; nenhuma dependência de CDN em runtime.
- GSAP, ScrollTrigger e CustomEase somente para movimento editorial não crítico; `gsap.context()` e cleanup obrigatório.
- Faders, transporte, medidores e áudio independem de animações.
- Listas acima de 100 itens virtualizadas.
- Nenhum `fetch`, WebSocket ou telemetria externa em runtime, salvo ação explícita do usuário em link de recurso.
- Um único `AudioContext`; nenhuma criação por instrumento ou componente.

## Gate de conclusão

Uma fase só muda para concluída após comando fresco completo, saída lida, código zero e evidência compatível com o claim. Build local não equivale a instalação, publicação, teste de FL Studio ou aceitação visual humana.
