# Pipeline DevSecOps (GitHub Actions)

Esteira de segurança para projetos Node/Vite: segredos, dependências, código e configuração, a cada push, PR e semanalmente.

| Job | Ferramenta | Procura |
| --- | --- | --- |
| segredos | gitleaks | Credenciais no código e no histórico |
| dependencias | npm audit | CVEs em bibliotecas |
| codigo | Semgrep | XSS, injeção, eval (+ regras próprias em `.semgrep/`) |
| trivy | Trivy | Vulnerabilidades, segredos, misconfig |

Práticas aplicadas: token somente leitura, `persist-credentials: false`, `npm ci --ignore-scripts`, execução semanal, Dependabot para npm e para as próprias actions.

## Usar

Copie `template/.github/`, `template/.semgrep/` e `template/.gitleaks.toml` para a raiz do seu repositório (ficam em `template/` para a esteira não rodar neste repositório).

`node scripts/scan-local.mjs <pasta>` faz uma varredura simplificada sem instalar nada.

`vercel.sugerido.json` traz headers de segurança (CSP em Report-Only) como ponto de partida.

Veja `ESTUDO.md` para resultados reais e limitações.
