# Modelo local e base offline PT-BR

## Contrato

DUCK Studio funciona sem chave de API, conta cloud ou internet. Existem dois motores locais claramente identificados e uma terceira via online opcional:

1. **Ollama local**: modelo generativo real executado no computador.
2. **Base especializada offline**: busca, filtros, árvores de decisão e respostas compostas a partir de conteúdo aprovado. Não é apresentada como LLM.
3. **Puter.js online**: somente após consentimento, sem chave do desenvolvedor, com conta e modelo user-pays do próprio usuário. Nunca é carregado no boot.

Se Ollama estiver indisponível, a UI muda para `Base local`. Nunca simula que um modelo respondeu. Ordem: base offline primeiro; Ollama quando a base for insuficiente ou o usuário o escolher; Puter online somente após decisão explícita. Uma IA online sempre usa protocolo/API internamente. `Sem API` significa sem chave fornecida por DUCK, não ausência de comunicação remota.

## Modelo recomendado para produtor musical, não para coding

- Principal quando FL Studio não está sob carga crítica: `qwen2.5:7b-instruct`, Apache-2.0, 4,7 GB no artefato Ollama oficial, português entre os idiomas suportados e boa aderência a instruções extensas.
- Modo estúdio leve durante gravação/mix: `granite3.3:2b`, Apache-2.0, 1,5 GB no artefato Ollama oficial, português suportado e integração RAG/function calling documentada.
- Emergência: base determinística sem modelo. Responde mais rápido e não disputa RAM/CPU com áudio.
- Opção especializada PT-BR: `Tucano-2b4-Instruct`; habilitar somente por Transformers ou GGUF de procedência e licença auditadas.

O produto não expõe recursos de programação, coding agent, terminal ou geração de código. O modelo recebe somente base musical, estado autorizado do projeto e ferramentas declarativas de áudio.

Usar contexto padrão de 4.096 tokens e no máximo a informação musical necessária. O suporte teórico a 128K não é um alvo nesta máquina.

O instalador do aplicativo não baixa modelos. O onboarding explica tamanho, licença, consumo e pede confirmação antes de cada download.

Comandos manuais documentados:

```powershell
ollama serve
ollama pull qwen2.5:7b-instruct
ollama pull granite3.3:2b
ollama run qwen2.5:7b-instruct
```

O app consulta `GET http://127.0.0.1:11434/api/tags` para detectar modelos e usa `POST /api/chat` apenas após opt-in. Timeout curto, cancelamento e fallback local são obrigatórios.

## Prompt de sistema do agente

```text
Você é DUCK, assistente local de produção musical em português brasileiro. Atua como produtor parceiro, professor prático e operador por confirmação. Não é assistente de programação e nunca orienta coding, terminal ou desenvolvimento de software. Conhece somente as capacidades instaladas e os recursos registrados no catálogo local. Distingue fato medido, recomendação, hipótese e preferência artística.

Objetivos: transformar intenção musical em passos curtos; explicar FL Studio, gravação, arranjo, guitarra, voz, síntese, edição, mix e exportação; propor cadeias usando apenas plugins instalados ou opções gratuitas oficiais; proteger audição, arquivos, projetos e privacidade; manter a identidade artística de DUCK.

Antes de uma orientação dependente de contexto, pergunte no máximo os dados indispensáveis: objetivo, gênero/referência, BPM, tonalidade, etapa do projeto, equipamento e plugins disponíveis. Quando houver dados suficientes, execute o raciocínio e entregue uma sequência numerada.

Formato padrão: diagnóstico em uma frase; ação imediata; valores iniciais com unidade e faixa segura; como ouvir se melhorou; como desfazer; próxima decisão. Explique termos técnicos na primeira ocorrência. Use português brasileiro natural, direto e respeitoso.

Para mix: priorize ganho, balanço, panorama e arranjo antes de plugins. Trate números como ponto de partida, nunca receita universal. Não prometa master competitivo, LUFS fixo ou eliminação total de ruído sem medir o áudio. Recomende comparação com bypass em volume equivalente.

Para voz e guitarra: verificar entrada correta, driver, buffer, ganho sem clipping, monitoração e ruído antes de efeitos. Alertar sobre feedback acústico e volume de fones. Nunca iniciar microfone ou gravação sem comando explícito.

Para ações no aplicativo: produza somente comandos declarativos permitidos. Mostre resumo da alteração e espere confirmação para salvar, sobrescrever, mover, excluir, instalar, baixar, configurar MIDI ou mudar vários canais. Nunca produza comandos de shell arbitrários.

Privacidade: conteúdo, caminhos e histórico permanecem locais. Não sugira upload automático. Links externos são opções, não execução. Não invente plugin instalado, arquivo existente, função do FL Studio, compatibilidade ou licença.

Se o usuário pedir algo fora da base: diga exatamente qual dado falta e ofereça um teste local ou uma fonte oficial. Se Ollama não estiver ativo, declare que a resposta veio da base determinística.
```

## Base offline

`BASE-CONHECIMENTO-PTBR.json` é carregada localmente. O motor:

- normaliza consulta sem enviar dados;
- busca título, intenções, tags e conteúdo;
- combina no máximo três registros compatíveis;
- mostra a origem interna e a data de revisão;
- oferece passos, sinais auditivos, riscos e reversão;
- nunca fabrica resposta fora do índice.

Busca mínima: BM25 ou FTS5. A primeira versão não precisa de embeddings. Se embeddings locais forem adicionados, ficam opcionais e nunca bloqueiam o produto.

## Ferramentas do agente

Todas tipadas e restritas:

```ts
type DuckAction =
  | { type: 'transport.play' }
  | { type: 'transport.stop' }
  | { type: 'transport.tempo'; bpm: number }
  | { type: 'mixer.volume'; trackId: string; db: number }
  | { type: 'mixer.pan'; trackId: string; value: number }
  | { type: 'mixer.mute'; trackId: string; enabled: boolean }
  | { type: 'mixer.solo'; trackId: string; enabled: boolean }
  | { type: 'guide.open'; guideId: string };
```

Faixas são validadas no Rust. Qualquer JSON inválido vira texto e nenhuma ação é executada.

## Privacidade e rede

- Nenhum endpoint cloud configurado por padrão.
- Nenhuma telemetria.
- Conversa não persiste por padrão.
- Botão `Apagar sessão` remove histórico em memória e arquivo opt-in.
- Prompts nunca incluem árvore completa de arquivos; somente metadados escolhidos.
- Links de recursos abrem no navegador após gesto do usuário.

## Online sem chave própria

Puter.js pode ser oferecido como terceira opção, nunca como dependência:

- carregar `https://js.puter.com/v2/` dinamicamente somente após clique;
- explicar que exige autenticação Puter e opera em modelo user-pays, com franquia inicial sujeita a limites;
- mostrar a prévia exata do prompt antes do envio;
- enviar somente pergunta, contexto musical resumido e trechos da base escolhidos;
- excluir caminhos locais, nomes pessoais, histórico completo e `duck.userMemory.v1` por padrão;
- permitir encerrar a espera local e definir timeout; documentar que o SDK Puter não garante aborto da solicitação remota, ignorar qualquer resposta tardia e nunca persistir a resposta automaticamente;
- rotular toda resposta como `Puter online` e registrar somente se o usuário escolher;
- manter o aplicativo funcional se script, login, quota ou rede falhar.

Pollinations não entra como opção sem chave: a documentação oficial atual exige autenticação nas gerações. Consumer chats não podem ser raspados ou automatizados.

## Fontes oficiais

- Ollama API: https://docs.ollama.com/api/introduction
- Ollama Windows: https://docs.ollama.com/windows
- Qwen2.5 3B: https://ollama.com/library/qwen2.5%3A3b-instruct
- Qwen2.5 7B Instruct: https://ollama.com/library/qwen2.5%3A7b-instruct
- Qwen2 e idiomas/licença: https://ollama.com/library/qwen2
- Llama 3.2 e português: https://ollama.com/library/llama3.2
- Granite 3.3: https://ollama.com/library/granite3.3
- Tucano 2b4 Instruct: https://huggingface.co/TucanoBR/Tucano-2b4-Instruct
- WebLLM opcional: https://github.com/mlc-ai/web-llm
- Puter.js user-pays: https://docs.puter.com/user-pays-model/
- Puter AI: https://developer.puter.com/ai/
