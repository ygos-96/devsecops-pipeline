# Pipeline DevSecOps (GitHub Actions)

[![ci](https://github.com/ygos-96/devsecops-pipeline/actions/workflows/ci.yml/badge.svg)](https://github.com/ygos-96/devsecops-pipeline/actions/workflows/ci.yml)

Esteira de segurança reutilizável para projetos Node e Vite. A cada push, pull request e toda segunda-feira, ela procura **segredos, dependências vulneráveis, falhas no código e erros de configuração**. Se algo grave aparecer, o GitHub marca o commit com ❌ antes de o código ir para produção.

Está em uso no [portfolio-2026](https://github.com/ygos-96/portfolio-2026), onde roda em todo PR.

## Os 4 jobs

| Job | Ferramenta | Procura | Falha quando |
| --- | --- | --- | --- |
| `segredos` | gitleaks | Senhas, tokens e chaves no código **e no histórico** | Achar qualquer um |
| `dependencias` | npm audit | Bibliotecas com CVE conhecido | Severidade alta ou crítica |
| `codigo` | Semgrep, com regras próprias em `.semgrep/` | XSS, `innerHTML` sem escape, `eval`, handlers inline | Achar problema |
| `trivy` | Trivy | Vulnerabilidades, segredos e configuração incorreta | Alta ou crítica com correção disponível |

## Boas práticas embutidas no próprio YAML

- `permissions: contents: read`: o token do workflow só lê. Se uma action for comprometida, o estrago é menor.
- **Actions fixadas por SHA** de commit, não por tag, porque uma tag pode ser reescrita.
- `persist-credentials: false`: o token do Git não fica gravado no disco do runner.
- `fetch-depth: 0` no gitleaks: um segredo apagado num commit antigo continua vazado, então o histórico inteiro precisa ser analisado.
- `npm ci --ignore-scripts`: um pacote malicioso não executa código na instalação.
- Execução **semanal**: CVE novo aparece mesmo sem commit.
- `concurrency`: cancela execuções antigas da mesma branch.
- **Dependabot** para npm e para as próprias actions, com espera de 7 dias para versões recém-publicadas.

## Como usar no seu projeto

Copie a esteira para a raiz do seu repositório. Ela fica em `template/` para não rodar neste repositório.

```bash
cp -r template/.github template/.semgrep template/.gitleaks.toml /caminho/do/seu/projeto/
```

Depois é só dar `git push` e acompanhar a aba **Actions**. Para exibir o status no README do seu projeto:

```markdown
![security](https://github.com/SEU-USUARIO/SEU-REPO/actions/workflows/security.yml/badge.svg)
```

O arquivo `vercel.sugerido.json` traz headers de segurança (CSP em modo `Report-Only`) como ponto de partida para quem publica na Vercel.

### Varredura local sem instalar nada

```bash
node scripts/scan-local.mjs <pasta-do-projeto>
```

É uma aproximação por expressões regulares (segredos comuns, `eval`, `innerHTML` com interpolação, `document.write`). **Não substitui** o gitleaks e o Semgrep: serve para ver o conceito funcionando e conferir um projeto rapidamente. Retorna código de saída 1 se achar segredo.

## Resultado real no portfólio

- `npm audit`: 0 vulnerabilidades.
- Segredos: nenhum encontrado.
- Código: o Semgrep apontou `innerHTML` com `${}` em vários pontos. Todos recebiam apenas constantes internas, nunca dado externo. Foram classificados como falso positivo e **justificados no próprio código** com comentários `nosemgrep`, em vez de desativar a regra. Os dados vindos de API externa passam por uma função de escape antes de entrar no HTML.
- Configuração: o site não tinha headers de segurança. Passou a ter HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e uma CSP em modo de relatório (`vercel.sugerido.json` foi o ponto de partida).

## Estrutura

```
template/.github/workflows/security.yml   a esteira, com os 4 jobs
template/.github/dependabot.yml           atualização automática de dependências e actions
template/.gitleaks.toml                   configuração da busca por segredos
template/.semgrep/regras-locais.yml       3 regras próprias de código
scripts/scan-local.mjs                    varredura simplificada
vercel.sugerido.json                      headers de segurança sugeridos
.github/workflows/ci.yml                  CI deste repositório (gitleaks e varredura local)
```

## Limitações conhecidas

- O gitleaks roda em Docker (`zricethezav/gitleaks`), disponível nos runners do GitHub, mas a imagem usa a tag `latest`.
- A varredura local é por regex e gera falsos positivos e falsos negativos.
- O Trivy só reporta o que tem correção disponível, então vulnerabilidades sem patch não derrubam o job.
- Projetos que não usam npm precisam remover ou adaptar o job de dependências.

## Próximos passos

- Fixar também a imagem do gitleaks por digest.
- Aplicar a CSP de verdade depois de observar o modo `Report-Only`.
- Adicionar uma etapa de análise de infraestrutura como código quando houver Terraform ou Docker no projeto.

## Licença

MIT. Veja [LICENSE](LICENSE).
