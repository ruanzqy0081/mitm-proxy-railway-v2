# 🚀 Deploy no Railway

## Pré-requisitos

- Conta no Railway (https://railway.app)
- Git instalado
- Node.js 18+ (opcional, Railway cuida disso)

---

## Passo 1: Preparar o Repositório

### 1.1 Inicializar Git (se não tiver)
```bash
cd /home/ubuntu/mitm-proxy-railway
git init
git add .
git commit -m "Initial commit: MITM Proxy com autenticação por UDID"
```

### 1.2 Criar repositório no GitHub
1. Acesse https://github.com/new
2. Crie um novo repositório (ex: `mitm-proxy-railway`)
3. Copie o URL do repositório

### 1.3 Fazer push para GitHub
```bash
git remote add origin https://github.com/seu-usuario/mitm-proxy-railway.git
git branch -M main
git push -u origin main
```

---

## Passo 2: Deploy no Railway

### 2.1 Conectar Railway ao GitHub
1. Acesse https://railway.app
2. Faça login com sua conta
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub"**
5. Autorize o Railway a acessar seu GitHub
6. Selecione o repositório `mitm-proxy-railway`

### 2.2 Configurar Variáveis de Ambiente
No painel do Railway:

1. Vá em **"Variables"**
2. Adicione as seguintes variáveis:

```
ADMIN_KEY=seu-admin-key-super-secreto-aqui
NODE_ENV=production
PORT=3000
```

### 2.3 Deploy Automático
1. O Railway fará o deploy automaticamente
2. Aguarde até aparecer "Deployed"
3. Copie a URL do seu app (ex: `https://seu-app.railway.app`)

---

## Passo 3: Testar a API

### 3.1 Verificar Status
```bash
curl https://seu-app.railway.app/
```

Resposta esperada:
```json
{
  "status": "online",
  "message": "MITM Proxy License Server",
  "totalLicenses": 0,
  "activeLicenses": 0
}
```

### 3.2 Adicionar Licença (com Admin Key)
```bash
curl -X POST https://seu-app.railway.app/admin/add-license \
  -H "X-Admin-Key: seu-admin-key-super-secreto-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "udid": "00008020-000E04DE2E12801E",
    "deviceName": "iPhone 14",
    "durationDays": 7
  }'
```

### 3.3 Verificar Licença (sem Admin Key)
```bash
curl "https://seu-app.railway.app/check-license?udid=00008020-000E04DE2E12801E"
```

---

## Passo 4: Configurar o MITM Proxy Local

### 4.1 Atualizar variável de ambiente
```bash
export AUTH_SERVER_URL="https://seu-app.railway.app"
export DEVICE_UDID="00008020-000E04DE2E12801E"  # Seu UDID do iPhone
```

### 4.2 Iniciar o MITM Proxy
```bash
cd /home/ubuntu/mitm-proxy-railway
mitmdump -s mitm_interceptor.py --listen-port 8080 --mode regular
```

---

## 🔑 Como Obter o UDID do iPhone

### Opção 1: Pelo Xcode (Mac)
1. Conecte o iPhone ao Mac
2. Abra Xcode → Window → Devices and Simulators
3. Selecione o iPhone
4. Copie o "Identifier" (UDID)

### Opção 2: Pelo iTunes (Windows/Mac)
1. Conecte o iPhone ao computador
2. Abra iTunes
3. Clique no iPhone
4. Vá em "Summary"
5. Clique em "Serial Number" para revelar o UDID
6. Copie o UDID

### Opção 3: Pelo iMazing
1. Baixe iMazing (https://imazing.com)
2. Conecte o iPhone
3. O UDID aparecerá na interface

---

## 📱 Configurar no iPhone

### 1. Instalar Certificado CA Root
- Copie o certificado `mitmproxy-ca-cert.pem`
- Envie por email para você
- Abra no iPhone e instale
- Ative em **Ajustes → Geral → Sobre → Certificado de Confiança de Raiz**

### 2. Configurar Proxy WiFi
- **Ajustes → WiFi → HTTP Proxy → Manual**
- **Servidor**: IP da máquina rodando o proxy (ex: `192.168.1.100`)
- **Porta**: `8080`

### 3. Usar o Free Fire
- Abra o Free Fire
- O proxy interceptará e substituirá os assets automaticamente!

---

## 🔧 Gerenciar Licenças via API

### Adicionar Licença (1, 3, 7 ou 30 dias)
```bash
# 1 dia
curl -X POST https://seu-app.railway.app/admin/add-license \
  -H "X-Admin-Key: seu-admin-key-super-secreto-aqui" \
  -H "Content-Type: application/json" \
  -d '{"udid": "UDID_AQUI", "deviceName": "iPhone", "durationDays": 1}'

# 3 dias
curl -X POST https://seu-app.railway.app/admin/add-license \
  -H "X-Admin-Key: seu-admin-key-super-secreto-aqui" \
  -H "Content-Type: application/json" \
  -d '{"udid": "UDID_AQUI", "deviceName": "iPhone", "durationDays": 3}'

# 7 dias
curl -X POST https://seu-app.railway.app/admin/add-license \
  -H "X-Admin-Key: seu-admin-key-super-secreto-aqui" \
  -H "Content-Type: application/json" \
  -d '{"udid": "UDID_AQUI", "deviceName": "iPhone", "durationDays": 7}'

# 30 dias
curl -X POST https://seu-app.railway.app/admin/add-license \
  -H "X-Admin-Key: seu-admin-key-super-secreto-aqui" \
  -H "Content-Type: application/json" \
  -d '{"udid": "UDID_AQUI", "deviceName": "iPhone", "durationDays": 30}'
```

### Renovar Licença
```bash
curl -X POST https://seu-app.railway.app/admin/renew-license \
  -H "X-Admin-Key: seu-admin-key-super-secreto-aqui" \
  -H "Content-Type: application/json" \
  -d '{"udid": "UDID_AQUI", "durationDays": 7}'
```

### Listar Todas as Licenças
```bash
curl -H "X-Admin-Key: seu-admin-key-super-secreto-aqui" \
  https://seu-app.railway.app/admin/licenses
```

### Ver Logs
```bash
curl -H "X-Admin-Key: seu-admin-key-super-secreto-aqui" \
  https://seu-app.railway.app/admin/logs
```

### Deletar Licença
```bash
curl -X DELETE https://seu-app.railway.app/admin/delete-license?udid=UDID_AQUI \
  -H "X-Admin-Key: seu-admin-key-super-secreto-aqui"
```

---

## 📊 Monitoramento

### Ver Logs do Railway
1. Acesse seu projeto no Railway
2. Clique em **"Logs"**
3. Veja os logs em tempo real

### Limpar Licenças Expiradas
```bash
curl -X POST https://seu-app.railway.app/admin/cleanup \
  -H "X-Admin-Key: seu-admin-key-super-secreto-aqui"
```

---

## ⚠️ Segurança

1. **Mude a ADMIN_KEY**: Nunca use a padrão em produção
2. **Use HTTPS**: Railway fornece HTTPS automaticamente
3. **Proteja o UDID**: Não compartilhe em público
4. **Rotação de chaves**: Mude a admin key periodicamente

---

## 🆘 Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
npm run build
```

### Erro: "Database locked"
O banco SQLite pode ter problemas em produção. Para melhor performance, considere usar PostgreSQL:
```bash
# No Railway, adicione um banco PostgreSQL
# E atualize a conexão no código
```

### Erro: "ADMIN_KEY inválida"
Verifique se a variável está corretamente configurada no Railway:
1. Vá em **Variables**
2. Confirme o valor de `ADMIN_KEY`
3. Reinicie o app

---

## 📝 Próximos Passos

1. ✅ Deploy no Railway
2. ✅ Configurar variáveis de ambiente
3. ✅ Testar API
4. ✅ Adicionar primeira licença
5. ✅ Configurar iPhone
6. ✅ Testar com Free Fire

---

**Versão**: 2.0.0  
**Data**: 23 de Março de 2026  
**Criado por**: Manus AI
