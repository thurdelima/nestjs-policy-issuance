# 🚀 Instruções Atualizadas - Frontend Policy System

## ✅ Migração para Environment Variables Concluída!

O projeto foi migrado da abordagem de **proxy** para **variáveis de ambiente** para maior simplicidade e flexibilidade.

## 🔧 Mudanças Implementadas

### ✅ Arquivos de Environment Criados
- **`src/environments/environment.ts`** - Configuração de desenvolvimento
- **`src/environments/environment.prod.ts`** - Configuração de produção

### ✅ Services Atualizados
- **`AuthService`** - Agora usa `environment.apiUrlAuth`
- **`PolicyService`** - Agora usa `environment.apiUrlPolicy`

### ✅ Proxy Removido
- **`proxy.conf.json`** - Deletado
- **Scripts** - Atualizados no `package.json`

## 🚀 Como Executar Agora

### 1. Pré-requisitos
Certifique-se de que os microservices estão rodando:
- **User Manager Service** (porta 3004)
- **Policy Issuance Service** (porta 3001)

### 2. Executar o Frontend
```bash
cd frontend-policy-system
npm start
```

A aplicação estará disponível em: **http://localhost:4200**

### 3. URLs das APIs
**Desenvolvimento:**
- **Login**: `http://localhost:3004/api/v1/auth/login`
- **Criar Apólice**: `http://localhost:3001/api/v1/policies`

## 🔧 Configuração de Environment

### Desenvolvimento (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrlAuth: 'http://localhost:3004/api/v1',
  apiUrlPolicy: 'http://localhost:3001/api/v1'
};
```

### Produção (`environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrlAuth: 'https://api.portobank.com/auth/api/v1',
  apiUrlPolicy: 'https://api.portobank.com/policy/api/v1'
};
```

## 📋 Scripts Disponíveis

```bash
# Desenvolvimento
npm start

# Produção
npm run start:prod

# Build desenvolvimento
npm run build

# Build produção
npm run build:prod
```

## ✅ Vantagens da Nova Abordagem

- **✅ Simplicidade** - Sem configuração de proxy
- **✅ Transparência** - URLs explícitas
- **✅ Flexibilidade** - Fácil mudança de URLs
- **✅ Ambiente específico** - Diferentes URLs para dev/prod
- **✅ CORS** - Já configurado nos microservices

## 🧪 Teste

1. **Execute os microservices** (User Manager e Policy Issuance)
2. **Inicie o frontend:** `npm start`
3. **Acesse:** http://localhost:4200
4. **Faça login** - Agora deve funcionar corretamente!

## 🔍 Debug

Se ainda houver problemas, verifique:
- ✅ User Manager Service rodando na porta 3004
- ✅ Policy Issuance Service rodando na porta 3001
- ✅ CORS configurado nos microservices
- ✅ URLs corretas no environment.ts

---

**🎉 Migração concluída com sucesso!**
