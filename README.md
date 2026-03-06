# ADSPRO — Meta Ads Command Center

Dashboard profissional para gerenciar campanhas Meta Ads.

## Deploy no Vercel (2 minutos)

### Opção 1 — Via GitHub (recomendado)
1. Crie conta em github.com
2. Crie repositório novo chamado "adspro"
3. Faça upload de todos os arquivos desta pasta
4. Acesse vercel.com → "Add New Project"
5. Conecte o repositório → clique Deploy
6. Pronto! Sua URL será https://adspro-xxx.vercel.app

### Opção 2 — Via Vercel CLI
```bash
npm i -g vercel
cd adspro
vercel
```

## Estrutura
- `pages/index.js` — Dashboard principal
- `pages/api/fb.js` — Proxy server-side para API do Facebook (resolve CORS)
- `styles/globals.css` — Estilos globais
