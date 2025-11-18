import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
// Para obter suas credenciais:
// 1. Acesse: https://supabase.com/dashboard
// 2. Selecione seu projeto
// 3. Vá em Settings > API
// 4. Copie a "URL" e a "anon public" key
// 5. Configure as variáveis de ambiente no arquivo .env:
//    VITE_SUPABASE_URL=sua_url_aqui
//    VITE_SUPABASE_ANON_KEY=sua_chave_aqui
// 
// IMPORTANTE: Em produção, configure as variáveis de ambiente na Vercel!

// Valores padrão (fallback)
const DEFAULT_SUPABASE_URL = 'https://fsajrowuqhptilnqdeue.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYWpyb3d1cWhwdGlsbnFkZXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjc1NjAsImV4cCI6MjA3Nzg0MzU2MH0.5x8FDYGxT-Ep5RtiPqUl-Cyu6hab6tMamJo5FRIrdoQ';

// Obter valores das variáveis de ambiente, removendo espaços em branco
const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Validar e usar valores
const supabaseUrl = (envUrl && envUrl !== '' && envUrl.startsWith('http')) 
  ? envUrl 
  : DEFAULT_SUPABASE_URL;

const supabaseAnonKey = (envKey && envKey !== '' && envKey !== 'YOUR_ANON_KEY')
  ? envKey
  : DEFAULT_SUPABASE_ANON_KEY;

// Logs de debug (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Config:', {
    url: supabaseUrl,
    hasEnvUrl: !!envUrl,
    hasEnvKey: !!envKey,
    usingDefaultUrl: !envUrl || envUrl === '',
    usingDefaultKey: !envKey || envKey === '',
  });
}

// Avisos se estiver usando valores padrão em produção
if (import.meta.env.PROD && (!envUrl || !envKey)) {
  console.warn('⚠️ ATENÇÃO: Usando valores padrão do Supabase. Configure as variáveis de ambiente na Vercel!');
  console.warn('⚠️ VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem ser configuradas.');
}

// Validar URL antes de criar o cliente
if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  throw new Error(`URL do Supabase inválida: "${supabaseUrl}". Deve começar com http:// ou https://`);
}

if (!supabaseAnonKey || supabaseAnonKey.length < 10) {
  throw new Error('Chave anon do Supabase inválida ou muito curta.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

