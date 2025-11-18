# 📁 Estrutura do Projeto - Sistema de Garantia Técnica

Este documento explica a função de cada arquivo e pasta do projeto.

## 📂 Estrutura de Diretórios

```
garantia-tech-flow-main/
├── public/                 # Arquivos estáticos públicos
├── src/                    # Código-fonte principal
│   ├── components/         # Componentes React reutilizáveis
│   ├── contexts/           # Contextos React (Auth, etc)
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Bibliotecas e utilitários
│   ├── pages/              # Páginas/rotas da aplicação
│   └── ...
├── node_modules/           # Dependências do projeto (gerado automaticamente)
└── ...
```

## 📄 Arquivos na Raiz

### Arquivos de Configuração

- **`package.json`** - Define dependências, scripts e metadados do projeto Node.js
- **`package-lock.json`** - Lock file que garante versões exatas das dependências
- **`bun.lockb`** - Lock file do Bun (gerado se usar Bun como gerenciador)
- **`tsconfig.json`** - Configuração principal do TypeScript
- **`tsconfig.app.json`** - Configuração TypeScript para a aplicação
- **`tsconfig.node.json`** - Configuração TypeScript para Node.js
- **`vite.config.ts`** - Configuração do Vite (build tool e dev server)
- **`tailwind.config.ts`** - Configuração do Tailwind CSS
- **`postcss.config.js`** - Configuração do PostCSS (processador CSS)
- **`eslint.config.js`** - Configuração do ESLint (linter de código)
- **`components.json`** - Configuração do shadcn/ui
- **`vercel.json`** - Configuração de deploy na Vercel

### Arquivos HTML e Documentação

- **`index.html`** - Arquivo HTML principal, ponto de entrada da aplicação
- **`README.md`** - Documentação principal com instruções de instalação
- **`README-ESTRUTURA.md`** - Este arquivo, explicando a estrutura do projeto

### Scripts SQL

- **`create_customers_table.sql`** - Script para criar tabela de clientes no Supabase
- **`create_maintenances_table.sql`** - Script para criar tabela de manutenções
- **`add_sku_to_equipments.sql`** - Script para adicionar campo SKU na tabela de equipamentos
- **`add_quantidade_to_equipments.sql`** - Script para adicionar campo quantidade na tabela de equipamentos

### Outros

- **`DESABILITAR_CONFIRMACAO_EMAIL.md`** - Documentação sobre desabilitar confirmação de email

## 📂 Pasta `public/`

Arquivos estáticos servidos diretamente pelo servidor:

- **`favicon.ico`** - Ícone exibido na aba do navegador
- **`placeholder.svg`** - Imagem placeholder
- **`robots.txt`** - Instruções para crawlers de busca

## 📂 Pasta `src/`

Código-fonte principal da aplicação.

### `src/main.tsx`
Ponto de entrada da aplicação React. Renderiza o componente `App` no elemento `#root`.

### `src/App.tsx`
Componente principal que configura:
- Roteamento (React Router)
- Providers (QueryClient, Auth, Tooltip)
- Rotas protegidas e públicas
- Layout geral da aplicação

### `src/App.css`
Estilos globais específicos do componente App.

### `src/index.css`
Estilos globais da aplicação, incluindo configurações do Tailwind CSS.

### `src/vite-env.d.ts`
Definições de tipos TypeScript para variáveis de ambiente do Vite.

## 📂 `src/components/`

Componentes React reutilizáveis.

### Componentes Principais

- **`Layout.tsx`** - Layout principal com sidebar e header
- **`AppSidebar.tsx`** - Barra lateral de navegação
- **`ProtectedRoute.tsx`** - Componente que protege rotas, exigindo autenticação
- **`ThemeToggle.tsx`** - Botão para alternar entre tema claro/escuro

### `src/components/ui/`

Componentes de UI do shadcn/ui (biblioteca de componentes):

- **`button.tsx`** - Botões
- **`input.tsx`** - Campos de entrada
- **`table.tsx`** - Tabelas
- **`dialog.tsx`** - Modais/diálogos
- **`form.tsx`** - Formulários
- **`card.tsx`** - Cards
- **`toast.tsx`** / **`toaster.tsx`** - Notificações toast
- **`select.tsx`** - Seletores dropdown
- **`calendar.tsx`** - Calendário
- **`chart.tsx`** - Gráficos
- E muitos outros componentes UI...

## 📂 `src/pages/`

Páginas/rotas da aplicação:

- **`Index.tsx`** - Página inicial (redireciona para Dashboard)
- **`Dashboard.tsx`** - Dashboard principal com visão geral
- **`Equipments.tsx`** - Página de gerenciamento de equipamentos
- **`Maintenance.tsx`** - Página de gerenciamento de manutenções
- **`Customers.tsx`** - Página de gerenciamento de clientes
- **`Reports.tsx`** - Página de relatórios
- **`QRCodeTracking.tsx`** - Página de rastreamento por QR Code
- **`Auth.tsx`** - Página de autenticação (login)
- **`NotFound.tsx`** - Página 404 (não encontrado)

## 📂 `src/contexts/`

Contextos React para estado global:

- **`AuthContext.tsx`** - Contexto de autenticação, gerencia usuário logado e sessão

## 📂 `src/hooks/`

Custom hooks React:

- **`use-mobile.tsx`** - Hook para detectar se está em dispositivo móvel
- **`use-toast.ts`** - Hook para usar notificações toast

## 📂 `src/lib/`

Bibliotecas e utilitários:

- **`supabase.ts`** - Configuração e cliente do Supabase (banco de dados)
- **`utils.ts`** - Funções utilitárias gerais (ex: `cn()` para classes CSS)

## 📂 `node_modules/`

**⚠️ Não edite nada aqui!**

Pasta gerada automaticamente pelo `npm install` ou `yarn install`. Contém todas as dependências do projeto listadas no `package.json`. Esta pasta não deve ser commitada no Git (está no `.gitignore`).

## 🔧 Como Funciona

1. **`index.html`** é carregado pelo navegador
2. **`main.tsx`** é executado e renderiza **`App.tsx`**
3. **`App.tsx`** configura rotas e providers
4. Cada rota renderiza uma página de **`src/pages/`**
5. As páginas usam componentes de **`src/components/`**
6. Os componentes se comunicam com o Supabase através de **`src/lib/supabase.ts`**
7. O estado de autenticação é gerenciado por **`src/contexts/AuthContext.tsx`**

## 🎨 Estilização

- **Tailwind CSS** - Classes utilitárias para estilização
- **CSS Modules** - Estilos scoped por componente (quando necessário)
- **shadcn/ui** - Componentes pré-estilizados

## 📦 Dependências Principais

- **React** - Biblioteca de UI
- **React Router** - Roteamento
- **Supabase** - Backend (banco de dados, autenticação)
- **React Query** - Cache e sincronização de dados do servidor
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Componentes UI
- **React Hook Form** - Formulários
- **Zod** - Validação

## 🚀 Build e Deploy

- **`npm run build`** - Gera arquivos otimizados em `dist/`
- **Vercel** - Detecta automaticamente projeto Vite e faz deploy
- **`vercel.json`** - Configurações específicas de deploy
