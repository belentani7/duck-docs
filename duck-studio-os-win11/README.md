# DUCK Studio Local — pacote de construção

Especificação executável para construir uma ferramenta musical local de nível profissional em Windows 11, integrada ao posto de trabalho de DUCK e complementar ao FL Studio.

## Entrega desta pasta

- `PROMPT-MESTRE-DUCK-STUDIO.md`: contrato integral para o agente de desenvolvimento.
- `AGENTS.md`: regras de execução, preservação, segurança e verificação.
- `ARQUITETURA-WIN11-FL-STUDIO.md`: decisões técnicas e limites reais.
- `MODELO-LOCAL-E-BASE-OFFLINE.md`: IA local sem chave e fallback determinístico em português.
- `MAPA-CONHECIMENTO-PRODUTOR-PTBR.md`: teoria, produção, variáveis e dialeto de estúdio.
- `RECURSOS-AUDIO-PLUGINS.md`: catálogo curado de ferramentas externas oficiais.
- `CATALOGO-PREMIUM-BENCHMARK.md`: referências profissionais de alto valor e alternativas.
- `BASE-CONHECIMENTO-PTBR.json`: conhecimento inicial estruturado para o assistente offline.
- `CATALOGO-RECURSOS.json`: recursos com licença, requisito e estado de instalação separados.
- `REFERENCIAS-LOCAIS.tsv`: materiais DUCK já existentes; somente referência, sem cópia automática.
- `CHECKLIST-ACEITACAO.md`: critérios objetivos de produto, áudio, UX, segurança e integração.
- `PC-ALVO.md`: perfil medido do computador e decisões de desempenho.
- `scripts/verify-spec.ps1`: auditoria local do pacote.
- `scripts/verify-manifest.ps1`: valida tamanho e SHA-256 de cada arquivo próprio.
- `scripts/browser-smoke.cjs`: smoke funcional em Chrome por `file://`.
- `MANIFEST-SHA256.tsv`: integridade dos arquivos próprios; clones possuem commit/remote no manifesto separado.
- `github-clones/`: nove clones oficiais shallow, isolados como referência.
- `html-offline/`: estação HTML prioritária, interligada e utilizável por `file://`.

## Decisão central

FL Studio continua sendo DAW, host de plugins e renderizador. DUCK Studio é superfície de controle, mixer de prática, laboratório de som, catálogo, gravador rápido e assistente musical local. O MVP não tenta carregar VST3 dentro do processo principal.

## Como usar

1. Abrir esta pasta no VS Code.
2. Entregar `PROMPT-MESTRE-DUCK-STUDIO.md` ao agente que implementará o produto.
3. Abrir `html-offline/index.html` para usar a alternativa offline antes da IA.
4. Manter todos os arquivos desta pasta como especificação de referência.
5. Executar `powershell -ExecutionPolicy Bypass -File .\scripts\verify-spec.ps1` antes de aceitar alterações da especificação.
6. Executar `powershell -ExecutionPolicy Bypass -File .\scripts\verify-manifest.ps1` para validar a integridade.
7. Com Playwright e Chrome disponíveis, configurar `DUCK_PLAYWRIGHT` e `DUCK_CHROME` e executar `node .\scripts\browser-smoke.cjs`.
8. Aplicar `CHECKLIST-ACEITACAO.md` ao código gerado.

## Estado real

- Pacote de prompt/especificação: local.
- Estação HTML offline: protótipo funcional incluído; o estado verificado fica registrado após executar os gates locais.
- Aplicativo nativo Tauri/FL Studio: ainda não implementado nesta pasta.
- Modelo Ollama: executável detectado, serviço inativo e nenhum modelo confirmado.
- FL Studio e diretórios VST3 padrão: não detectados no inventário desta máquina.
- APIs pagas ou chaves: nenhuma necessária e nenhuma incluída.
- Plugins e sons externos: links oficiais; não foram baixados nem redistribuídos.
