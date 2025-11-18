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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fsajrowuqhptilnqdeue.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYWpyb3d1cWhwdGlsbnFkZXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjc1NjAsImV4cCI6MjA3Nzg0MzU2MH0.5x8FDYGxT-Ep5RtiPqUl-Cyu6hab6tMamJo5FRIrdoQ';

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_ANON_KEY') {
  console.warn('⚠️ Configure a chave do Supabase! Veja src/lib/supabase.ts para instruções.');
}

if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.warn('⚠️ Configure a URL do Supabase! Veja src/lib/supabase.ts para instruções.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

