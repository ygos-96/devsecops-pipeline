# Estudo: Pipeline DevSecOps no portfólio

## 1. O que é e por que existe

Uma **esteira automática** que roda checagens de segurança a cada `git push`, pull request e toda segunda-feira. Você não precisa lembrar. Se algo grave aparecer, o GitHub marca ❌ antes de o código ir para produção.

Para a carreira, é prova pública de que você pensa em segurança **durante** o desenvolvimento.

## 2. O que foi construído

| Arquivo | Função |
| --- | --- |
| `template/.github/workflows/security.yml` | A esteira, com 4 jobs |
| `template/.gitleaks.toml` | Configuração da busca por segredos |
| `template/.semgrep/regras-locais.yml` | 3 regras próprias de código (XSS, handler inline, eval) |
| `template/.github/dependabot.yml` | Abre PR sozinho quando uma dependência fica desatualizada |
| `vercel.sugerido.json` | Headers de segurança que o portfólio ainda não tem |
| `scripts/scan-local.mjs` | Varredura simplificada que roda sem instalar nada |

## 3. Os 4 jobs

| Job | Ferramenta | Procura | Falha quando |
| --- | --- | --- | --- |
| segredos | gitleaks | Senhas, tokens e chaves no código **e no histórico** | Achar qualquer um |
| dependencias | `npm audit` | Bibliotecas com CVE conhecido | Severidade alta ou crítica |
| codigo | Semgrep | Falhas no seu código (XSS, injeção, eval) | Achar problema (`--error`) |
| trivy | Trivy | Vulnerabilidades, segredos e configs erradas | Alta ou crítica com correção disponível |

## 4. Boas práticas embutidas no próprio YAML

- `permissions: contents: read`: o token do workflow só lê. Se uma action for comprometida, o estrago é menor.
- `persist-credentials: false`: o token do Git não fica gravado no disco do runner.
- `fetch-depth: 0` no gitleaks: um segredo apagado num commit antigo continua vazado, então precisa olhar o histórico todo.
- `npm ci --ignore-scripts`: um pacote malicioso não roda código na instalação.
- `schedule` semanal: CVE novo aparece mesmo sem commit seu.
- `concurrency`: cancela execuções antigas da mesma branch.
- Dependabot também atualiza as **actions** do pipeline.

## 5. Resultado real no portfólio

Rodei contra `portfolio-2026`:

- **`npm audit`: 0 vulnerabilidades** (nenhuma, em nenhuma severidade).
- **Segredos: nenhum encontrado** na varredura local.
- **Código: 10 alertas, 9 deles falsos positivos.** São `innerHTML` com `${}` em `main.js` e `game3d.js`, mas todos recebem constantes internas (ícones, textos do próprio site), nunca dado externo. Um scanner genérico não sabe disso. É exatamente por isso que alerta precisa de **triagem humana**.
- **Achado real 1:** `nextgames.js:45` monta HTML com `onerror="this.remove()"` inline. Funciona, mas impede um CSP estrito. Troque por `addEventListener('error', ...)` na imagem.
- **Achado real 2 (o mais importante):** o site **não tem nenhum header de segurança** (sem `vercel.json`). Faltam CSP, `X-Frame-Options`, `X-Content-Type-Options`, HSTS, etc. O arquivo `vercel.sugerido.json` traz uma proposta, com o CSP em modo **Report-Only** (só reporta, não bloqueia) para você testar sem quebrar o site.
- Em `nextgames.js`, os dados da API da ESPN passam por `esc()` antes de entrar no HTML. Está correto. O campo `logo` não valida o esquema da URL (só `https:`), risco baixo porque vai em `<img src>`.

## 6. Limites (seja honesto numa entrevista)

- **Não rodei a esteira de verdade.** Ela só executa no GitHub Actions. O que verifiquei: os YAML são válidos (parse ok) e a varredura local roda. O primeiro run real pode precisar de ajuste.
- **Semgrep, gitleaks e Trivy não foram executados localmente** (não instalei binários). `scan-local.mjs` é uma aproximação por regex, não substitui.
- **Actions fixadas por tag, não por SHA** (`@v4`, `@v0.36.0`). O mais seguro é fixar o hash do commit, porque uma tag pode ser reescrita (já houve ataque à cadeia de suprimentos assim). Eu não consegui confirmar os hashes sem acesso ao GitHub, então fica como melhoria. O Dependabot ajuda a manter atualizado.
- O gitleaks usa Docker (`zricethezav/gitleaks`), disponível nos runners do GitHub.

## 7. Como aplicar no portfólio

```powershell
cd C:\Users\telwa\Desktop\Meus\portfolio-2026
Copy-Item -Recurse ..\devsecops-pipeline\template\.github .
Copy-Item -Recurse ..\devsecops-pipeline\template\.semgrep .
Copy-Item ..\devsecops-pipeline\template\.gitleaks.toml .
Copy-Item ..\devsecops-pipeline\vercel.sugerido.json .\vercel.json   # revise antes
```

Depois `git push` e veja a aba **Actions** do repositório. Adicione o selo ao README:
`![security](https://github.com/ygos-96/portfolio/actions/workflows/security.yml/badge.svg)`

Rodar a varredura local:

```powershell
node scripts\scan-local.mjs C:\Users\telwa\Desktop\Meus\portfolio-2026
```

## 8. Glossário

- **CI/CD**: automação que testa e publica código.
- **SAST**: análise estática do código-fonte (Semgrep).
- **SCA**: análise das dependências (npm audit, Trivy).
- **CVE**: ID público de uma vulnerabilidade conhecida.
- **CSP**: header que diz ao navegador de onde pode carregar scripts; mitiga XSS.
- **Falso positivo**: alerta sem risco real.
- **Shift left**: encontrar o problema o mais cedo possível.

## 9. Perguntas de entrevista

1. Qual a diferença entre SAST e SCA?
2. Por que o gitleaks olha o histórico inteiro?
3. Por que `permissions: contents: read`?
4. O que fazer com um falso positivo?
5. Por que fixar actions por SHA?

## 10. Próximos passos

- Fazer o primeiro push e corrigir o que o GitHub reclamar.
- Aplicar o `vercel.json` em Report-Only, observar, depois ativar CSP de verdade.
- Corrigir o `onerror` inline.
- Fixar actions por SHA.
