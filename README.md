# 🚀 MITM Proxy com Autenticação por UDID

Sistema completo de **MITM Proxy para Free Fire** com autenticação por **UDID** (Unique Device Identifier) do iPhone, hospedado no **Railway**.

---

## ✨ Características

✅ **Autenticação por UDID** - Identifica dispositivos de forma única  
✅ **Planos de Licença** - 1, 3, 7 ou 30 dias  
✅ **Expiração Automática** - Licenças expiram automaticamente  
✅ **Painel de Admin** - API para gerenciar licenças  
✅ **Logs Detalhados** - Rastrear todas as ações  
✅ **Hospedado no Railway** - Sem localhost, funciona em qualquer lugar  
✅ **Banco de Dados SQLite** - Persistência de dados  

---

## 📋 Estrutura

```
mitm-proxy-railway/
├── src/
│   ├── server.ts              # Servidor Express com API
│   └── database/
│       ├── db.ts              # Funções CRUD
│       └── init.ts            # Inicializar banco
├── mitm_interceptor.py        # Script do MITM Proxy
├── package.json               # Dependências Node.js
├── tsconfig.json              # Configuração TypeScript
├── Procfile                   # Para Railway
├── .env.example               # Variáveis de ambiente
├── RAILWAY_DEPLOY.md          # Guia de deploy
└── README.md                  # Este arquivo
```

---

## 🚀 Quick Start (Local)

### 1. Instalar Dependências

```bash
cd /home/ubuntu/mitm-proxy-railway

# Node.js
npm install

# Python (para o MITM Proxy)
pip3 install mitmproxy requests
```

### 2. Inicializar Banco de Dados

```bash
npm run db:init
```

### 3. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
# Edite .env com suas configurações
```

### 4. Iniciar Servidor

```bash
npm run dev
```

Servidor rodará em `http://localhost:3000`

### 5. Iniciar MITM Proxy

```bash
export DEVICE_UDID="seu-udid-aqui"
export AUTH_SERVER_URL="http://localhost:3000"

mitmdump -s mitm_interceptor.py --listen-port 8080 --mode regular
```

---

## ☁️ Deploy no Railway

### 1. Preparar Repositório Git

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/mitm-proxy-railway.git
git push -u origin main
```

### 2. Deploy no Railway

1. Acesse https://railway.app
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub"**
4. Selecione o repositório
5. Configure as variáveis de ambiente (veja `.env.example`)
6. Deploy automático!

**Veja [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) para instruções detalhadas.**

---

## 🔑 Como Obter o UDID do iPhone

### Opção 1: Xcode (Mac)
1. Conecte o iPhone ao Mac
2. Xcode → Window → Devices and Simulators
3. Copie o "Identifier"

### Opção 2: iTunes
1. Conecte o iPhone
2. iTunes → iPhone → Summary
3. Clique em "Serial Number" para revelar UDID

### Opção 3: iMazing
1. Baixe iMazing (https://imazing.com)
2. Conecte o iPhone
3. UDID aparecerá na interface

---

## 📱 Configurar no iPhone

### 1. Instalar Certificado CA Root
- Envie `mitmproxy-ca-cert.pem` por email
- Abra no iPhone e instale
- Ative em **Ajustes → Geral → Sobre → Certificado de Confiança de Raiz**

### 2. Configurar Proxy WiFi
- **Ajustes → WiFi → HTTP Proxy → Manual**
- **Servidor**: IP da máquina (ex: `192.168.1.100`)
- **Porta**: `8080`

### 3. Usar o Free Fire
- Abra o Free Fire
- Proxy interceptará automaticamente!

---

## 🔌 API Endpoints

### Público (sem autenticação)

#### `GET /`
Status do servidor
```bash
curl https://seu-app.railway.app/
```

#### `GET /check-license?udid=<UDID>`
Verificar se UDID tem licença ativa
```bash
curl "https://seu-app.railway.app/check-license?udid=00008020-000E04DE2E12801E"
```

### Admin (requer X-Admin-Key)

#### `POST /admin/add-license`
Adicionar nova licença
```bash
curl -X POST https://seu-app.railway.app/admin/add-license \
  -H "X-Admin-Key: seu-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "udid": "00008020-000E04DE2E12801E",
    "deviceName": "iPhone 14",
    "durationDays": 7
  }'
```

#### `POST /admin/renew-license`
Renovar licença existente
```bash
curl -X POST https://seu-app.railway.app/admin/renew-license \
  -H "X-Admin-Key: seu-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"udid": "00008020-000E04DE2E12801E", "durationDays": 30}'
```

#### `GET /admin/licenses`
Listar todas as licenças
```bash
curl -H "X-Admin-Key: seu-admin-key" \
  https://seu-app.railway.app/admin/licenses
```

#### `DELETE /admin/delete-license?udid=<UDID>`
Deletar licença
```bash
curl -X DELETE "https://seu-app.railway.app/admin/delete-license?udid=00008020-000E04DE2E12801E" \
  -H "X-Admin-Key: seu-admin-key"
```

#### `GET /admin/logs`
Ver logs de ações
```bash
curl -H "X-Admin-Key: seu-admin-key" \
  https://seu-app.railway.app/admin/logs
```

#### `POST /admin/cleanup`
Limpar licenças expiradas
```bash
curl -X POST https://seu-app.railway.app/admin/cleanup \
  -H "X-Admin-Key: seu-admin-key"
```

---

## 💾 Banco de Dados

### Schema

**Tabela: licenses**
```sql
CREATE TABLE licenses (
  id INTEGER PRIMARY KEY,
  udid TEXT UNIQUE NOT NULL,
  device_name TEXT,
  duration_days INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  last_used DATETIME
);
```

**Tabela: logs**
```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY,
  udid TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔒 Segurança

⚠️ **IMPORTANTE:**

1. **Mude a ADMIN_KEY** - Nunca use a padrão em produção
2. **Use HTTPS** - Railway fornece automaticamente
3. **Proteja o UDID** - Não compartilhe em público
4. **Rotação de chaves** - Mude periodicamente
5. **Limpe logs** - Remova dados sensíveis regularmente

---

## 📊 Monitoramento

### Ver Logs do Railway
1. Acesse seu projeto no Railway
2. Clique em **"Logs"**
3. Veja em tempo real

### Limpar Banco de Dados
```bash
npm run db:init  # Reseta o banco
```

---

## 🐛 Troubleshooting

### Erro: "UDID não encontrado"
- Certifique-se de que `DEVICE_UDID` está configurado
- Verifique o UDID do seu iPhone

### Erro: "Licença não encontrada"
- Adicione a licença via API `/admin/add-license`
- Verifique se o UDID está correto

### Erro: "Cannot connect to server"
- Verifique se o servidor está rodando
- Confirme a URL em `AUTH_SERVER_URL`

### Erro: "Admin key inválida"
- Verifique a variável `ADMIN_KEY`
- Confirme no header `X-Admin-Key`

---

## 📚 Documentação Adicional

- [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - Guia detalhado de deploy
- [mitmproxy docs](https://docs.mitmproxy.org/) - Documentação do mitmproxy
- [Express.js docs](https://expressjs.com/) - Documentação do Express

---

## 📝 Planos de Licença

| Duração | Dias | Uso |
|---------|------|-----|
| Trial | 1 | Teste rápido |
| Básico | 3 | Fim de semana |
| Padrão | 7 | Uma semana |
| Premium | 30 | Um mês |

---

## 🎯 Próximos Passos

1. ✅ Clonar este repositório
2. ✅ Instalar dependências
3. ✅ Configurar variáveis de ambiente
4. ✅ Deploy no Railway
5. ✅ Adicionar primeira licença
6. ✅ Configurar iPhone
7. ✅ Testar com Free Fire

---

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique os logs
- Consulte [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)
- Verifique a documentação do mitmproxy

---

**Versão**: 2.0.0  
**Data**: 23 de Março de 2026  
**Criado por**: Manus AI

---

**Boa sorte! 🚀**
