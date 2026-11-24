// Varredura local simplificada (sem instalar nada). NÃO substitui gitleaks/Semgrep:
// serve para ver o conceito funcionando e para conferir um projeto rápido.
// Uso: node scripts/scan-local.mjs <pasta-do-projeto>
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const raiz = process.argv[2]
if (!raiz) { console.error('uso: node scripts/scan-local.mjs <pasta>'); process.exit(2) }

const IGNORAR = new Set(['node_modules', 'dist', '.git', '.next', 'public'])
const EXT = new Set(['.js', '.mjs', '.ts', '.html', '.json', '.env', '.yml', '.yaml', '.py'])

const SEGREDOS = [
  ['chave AWS', /AKIA[0-9A-Z]{16}/],
  ['token GitHub', /gh[pousr]_[A-Za-z0-9]{36,}/],
  ['chave privada', /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['chave Stripe live', /sk_live_[0-9a-zA-Z]{20,}/],
  ['JWT', /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ['atribuição de segredo', /(secret|password|senha|api[_-]?key|token)\s*[:=]\s*['"][^'"\s]{12,}['"]/i],
]
const CODIGO = [
  ['eval/new Function', /\beval\s*\(|new Function\s*\(/],
  ['innerHTML com ${} sem esc()', /\.innerHTML\s*=\s*`[^`]*\$\{(?!\s*esc\()/],
  ['handler on*="" inline', /\son(error|click|load)=\\?"[^"]*"/],
  ['document.write', /document\.write\s*\(/],
]

const achados = []
function varrer(dir) {
  for (const nome of readdirSync(dir)) {
    if (IGNORAR.has(nome)) continue
    const caminho = join(dir, nome)
    const st = statSync(caminho)
    if (st.isDirectory()) { varrer(caminho); continue }
    if (!EXT.has(extname(nome)) || st.size > 500_000 || nome === 'package-lock.json') continue
    const linhas = readFileSync(caminho, 'utf8').split('\n')
    linhas.forEach((linha, i) => {
      for (const [tipo, re] of SEGREDOS) if (re.test(linha)) achados.push(['SEGREDO', tipo, caminho, i + 1])
      for (const [tipo, re] of CODIGO) if (re.test(linha)) achados.push(['CODIGO', tipo, caminho, i + 1])
    })
  }
}
varrer(raiz)

const resumo = {}
for (const [grupo, tipo, arq, n] of achados) {
  resumo[`${grupo}: ${tipo}`] = (resumo[`${grupo}: ${tipo}`] || 0) + 1
  console.log(`${grupo.padEnd(7)} ${tipo.padEnd(30)} ${arq.replace(raiz, '.')}:${n}`)
}
console.log('\nResumo:', Object.keys(resumo).length ? resumo : 'nada encontrado')
process.exitCode = achados.some(([g]) => g === 'SEGREDO') ? 1 : 0
