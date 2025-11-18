# Sistema de Garantia Técnica

Sistema completo para gerenciamento de equipamentos, manutenções e clientes com controle de garantia técnica.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior) - [Download](https://nodejs.org/)
- **npm** ou **yarn** (geralmente vem com o Node.js)
- Conta no **Supabase** para o banco de dados

## 🚀 Instalação e Configuração

### Passo 1: Clonar o Repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd garantia-tech-flow-main
```

### Passo 2: Instalar Dependências

```bash
npm install
```

ou se estiver usando yarn:

```bash
yarn install
```

### Passo 3: Configurar Variáveis de Ambiente

1. Crie um arquivo `.env` na raiz do projeto:

```bash
# Windows (PowerShell)
New-Item .env

# Linux/Mac
touch .env
```

2. Adicione as seguintes variáveis no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

**Como obter as credenciais do Supabase:**

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie a **"URL"** e a **"anon public" key**
5. Cole no arquivo `.env`

**Nota:** Se você não configurar essas variáveis, o sistema usará valores padrão do arquivo `src/lib/supabase.ts`, mas é recomendado usar variáveis de ambiente para maior segurança.

### Passo 4: Configurar o Banco de Dados

Execute os scripts SQL fornecidos no Supabase para criar as tabelas necessárias:

1. Acesse o **SQL Editor** no Supabase
2. Execute os seguintes arquivos SQL na ordem:
   - `create_customers_table.sql`
   - `create_maintenances_table.sql`
   - `add_sku_to_equipments.sql`
   - `add_quantidade_to_equipments.sql`

### Passo 5: Executar o Projeto

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

ou

```bash
yarn dev
```

O projeto estará disponível em: `http://localhost:8080`

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run build:dev` - Cria a build em modo desenvolvimento
- `npm run preview` - Visualiza a build de produção localmente
- `npm run lint` - Executa o linter para verificar erros de código

## 🌐 Deploy na Vercel

### Configuração Automática

1. Faça push do código para um repositório Git (GitHub, GitLab ou Bitbucket)
2. Acesse [Vercel](https://vercel.com)
3. Conecte seu repositório
4. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL` - URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` - Sua chave anon do Supabase
5. Clique em **Deploy**

A Vercel detectará automaticamente que é um projeto Vite e configurará tudo automaticamente.

### Configuração Manual

Se preferir configurar manualmente, o arquivo `vercel.json` já está configurado no projeto.

## 🔧 Solução de Problemas

### Erro ao conectar com Supabase

- Verifique se as variáveis de ambiente estão configuradas corretamente
- Confirme se a chave anon está correta no arquivo `.env`
- Verifique se o projeto Supabase está ativo

### Erro ao instalar dependências

- Tente limpar o cache: `npm cache clean --force`
- Delete a pasta `node_modules` e o arquivo `package-lock.json`
- Execute `npm install` novamente

### Porta 8080 já está em uso

- Altere a porta no arquivo `vite.config.ts` na propriedade `port`

## 📚 Tecnologias Utilizadas

- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Superset do JavaScript com tipagem estática
- **Vite** - Build tool e dev server
- **React Router** - Roteamento
- **Supabase** - Backend como serviço (BaaS)
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI
- **React Query** - Gerenciamento de estado do servidor
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

## 📝 Estrutura do Projeto

Para entender melhor a estrutura de arquivos e pastas, consulte o arquivo [README-ESTRUTURA.md](./README-ESTRUTURA.md).

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e de uso interno.
