# Auditoria final — DUCK Studio Local

Data: 2026-08-13. Ambiente: Windows 11, PowerShell 7.6.4, Node 24.19.0, Chrome 151.0.7922.109 e Playwright 1.55.0.

## Escopo entregue

- Especificação executável para a aplicação nativa Tauri/FL Studio.
- Alternativa HTML offline com seis páginas interligadas.
- Base musical determinística em português brasileiro.
- Catálogos de recursos gratuitos e benchmarks premium.
- Nove clones Git oficiais, shallow, limpos e isolados como referência.
- Verificadores de especificação e navegador.

## Gates frescos

### Estrutura e integridade

Comando:

```powershell
& .\scripts\verify-spec.ps1
```

Resultado: `DUCK_STUDIO_SPEC_PASS required=14 resources=28 knowledge=10 clones=9 prompt_words=3382`. Código de saída 0.

O gate validou JSON, arquivos obrigatórios, sintaxe dos quatro JavaScript, ausência de limpeza global de storage, namespaces de memória, fonte Puter opt-in, secrets básicos e, para cada clone, remote, commit e worktree limpo.

Manifesto reproduzível:

```powershell
& .\scripts\verify-manifest.ps1
```

Valida SHA-256, tamanho, ausência de arquivos próprios não listados e presença de cada entrada. `MANIFEST-SHA256.tsv` se exclui a si mesmo; os clones usam commit e remote do manifesto Git separado.

### Links locais

Auditoria dos atributos `href` e `src` relativos em todos os HTML: `HTML_LINKS_PASS files=6 broken=0`. Código de saída 0.

### Navegador real por file://

Comando:

```powershell
$env:DUCK_PLAYWRIGHT='C:\Users\USER\Desktop\BELENTANI-JUDAS-ERA-FULLSTACK\node_modules\playwright'
$env:DUCK_CHROME='C:\Program Files\Google\Chrome\Application\chrome.exe'
node .\scripts\browser-smoke.cjs
```

Resultado: `PASS`. Código de saída 0.

- Seis páginas carregadas diretamente por `file://`.
- Contexto de projeto compartilhado entre páginas.
- Mixer: 16 canais + master, 17 faders, teclado e persistência.
- Áudio: ativação por gesto, teste de tons e stop.
- Instrumentos: cuatro pistas × dieciséis pasos, play/stop y persistencia.
- Agente: respuesta determinística local; opt-in Ollama reiniciado a falso; Puter ausente del DOM y de red en boot.
- Memoria: dos temporales DUCK eliminados; cuatro capas persistentes y dos claves ajenas preservadas.
- Recursos: veinte fichas embarcadas visibles y búsqueda funcional.
- Responsive: 390 y 320 px en las seis páginas, sin overflow de documento.
- Reduced motion detectado.
- Solicitudes externas en boot: 0.
- Errores de consola, página o request: 0.

La prueba no llama Ollama ni Puter: evita iniciar servicios, enviar datos, autenticar cuentas o generar costes.

### Privacidad y memoria

- No existe `localStorage.clear()` ni `sessionStorage.clear()`.
- `Limpar temporários` elimina exclusivamente `duck.temp.*` en ambos storages.
- Proyecto, mixer, pattern, preferencias y `duck.userMemory.v1` permanecen separados.
- La base musical vive en una constante JavaScript congelada y no se guarda en storage.
- Ollama usa loopback solamente después de opt-in de sesión.
- Puter se carga dinámicamente después de opt-in, clic y confirmación de la previa. Su timeout corta la espera local; el SDK no garantiza aborto remoto. Respuestas tardías se ignoran y no se persisten.

### Antivirus

Microsoft Defender activo, protección en tiempo real activa, firma actualizada el 2026-08-12. `Start-MpScan -ScanType CustomScan` sobre la carpeta completó con código 0. Detecciones asociadas a la ruta: 0.

## Tamaño

- Archivos propios antes de este informe/manifiesto: 30; 223.360 bytes.
- Clones de referencia: 9 repositorios; 4.683 archivos incluyendo datos Git; 177.434.108 bytes, 169,21 MiB.
- Espacio libre observado tras los clones: 28,01 GB.

## Estado real

### Implementado y probado localmente

- HTML offline, navegación, persistencia aislada, mixer de práctica, secuenciador procedural, base PT-BR, catálogo, búsqueda y limpieza segura.
- Prompt, arquitectura, criterios, modelo local recomendado, recursos y referencias premium.
- Auditoría reproducible y clones con procedencia.

### Diseñado, no implementado todavía

- Aplicación nativa Tauri, ventana flotante, SQLite, instalador, firma, scanner VST3, exportación MIDI/WAV nativa y script MIDI FL Studio.

### No verificado por ausencia de entorno

- FL Studio, VST3 y handshake MIDI: no detectados en las rutas consultadas.
- Ollama: binario detectado, servicio inactivo y ningún modelo confirmado; no se ejecutó inferencia.
- Puter: integración opt-in inspeccionada, sin login ni llamada online.
- Latencia profesional, ASIO, 60 fps sostenidos, uso prolongado de RAM/CPU y grabación real: requieren la futura aplicación nativa y el puesto de estudio instalado.

No se compró, instaló, descargó ni aceptó licencia de ningún plugin premium. Los precios son referencias oficiales fechadas, no activos incluidos.
