# Frontend Policy System

Sistema frontend para emissão de apólices de seguro - Porto Bank Digital

## 🚀 Tecnologias

- **Angular 19x** - Framework principal
- **Angular Material** - UI Components
- **TypeScript** - Linguagem de programação
- **RxJS** - Programação reativa
- **SCSS** - Estilização

## 📋 Funcionalidades

- **Login** - Autenticação de usuários
- **Criação de Apólice** - Formulário para criar novas apólices
- **Logout** - Sair da aplicação
- **Proteção de Rotas** - Guard para rotas autenticadas

## 🏗️ Arquitetura

### Estrutura de Módulos (NgModules)

```
src/app/
├── core/                    # Serviços, guards e interceptors
│   ├── services/           # AuthService, PolicyService
│   ├── guards/             # AuthGuard
│   └── interceptors/       # JWT Interceptor
├── shared/                 # Componentes compartilhados
│   └── components/         # HeaderComponent
├── features/               # Módulos de funcionalidades
│   ├── auth/              # Módulo de autenticação
│   │   └── components/    # LoginComponent
│   └── policy/            # Módulo de apólices
│       └── components/    # PolicyCreateComponent
└── app.module.ts          # Módulo principal
```

### Integração com Backend

- **User Manager Service** (3004) - Autenticação
- **Policy Issuance Service** (3001) - Criação de apólices
- **Proxy Configuration** - Redirecionamento de APIs

## 🛠️ Instalação e Execução

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Backend services rodando (user-manager e policy-issuance)

### Instalação

```bash
npm install
```

### Execução

```bash
# Desenvolvimento
npm start

# Produção
npm run start:prod
```

A aplicação estará disponível em: `http://localhost:4200`

## 🔧 Configuração

### Environment

As URLs das APIs são configuradas através de variáveis de ambiente:

**Desenvolvimento** (`src/environments/environment.ts`):
- `apiUrlAuth`: `http://localhost:3004/api/v1` (User Manager)
- `apiUrlPolicy`: `http://localhost:3001/api/v1` (Policy Issuance)

**Produção** (`src/environments/environment.prod.ts`):
- `apiUrlAuth`: `https://api.portobank.com/auth/api/v1`
- `apiUrlPolicy`: `https://api.portobank.com/policy/api/v1`

## 📱 Telas

### 1. Login (`/login`)
- Formulário de email e senha
- Validação de campos
- Redirecionamento após sucesso

### 2. Criar Apólice (`/policy/create`)
- Formulário em steps (Stepper)
- Dados do cliente
- Dados da apólice
- Validação completa

### 3. Header
- Nome do usuário logado
- Botão de logout
- Presente em todas as telas autenticadas

## 🔐 Autenticação

- **JWT Token** - Armazenado no localStorage
- **AuthGuard** - Proteção de rotas
- **JWT Interceptor** - Adiciona token nas requisições
- **Auto-redirect** - Redireciona para login se não autenticado

## 🎨 UI/UX

- **Material Design** - Componentes do Angular Material
- **Responsive** - Design adaptável
- **Loading States** - Indicadores de carregamento
- **Error Handling** - Snackbars para feedback
- **Form Validation** - Validação em tempo real

## 📦 Build

```bash
# Build de produção
npm run build

# Build de desenvolvimento com watch
npm run watch
```

## 🧪 Testes

```bash
# Executar testes
npm test
```

## 🔗 Integração

### APIs Utilizadas

1. **POST /auth/api/v1/auth/login**
   - Login de usuário
   - Retorna JWT token

2. **POST /api/v1/policies**
   - Criação de apólice
   - Requer autenticação

### Fluxo de Dados

1. Usuário faz login
2. Token JWT é armazenado
3. Requisições incluem token automaticamente
4. Criação de apólice com dados validados
5. Feedback de sucesso/erro

## 🚀 Deploy

Para produção, configure as URLs das APIs nos services e remova o proxy.
