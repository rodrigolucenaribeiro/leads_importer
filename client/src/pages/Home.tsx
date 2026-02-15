import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { createClient } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export default function Home() {
  const [, setLocation] = useLocation();
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    verificarAutenticacao();
  }, []);

  const verificarAutenticacao = async () => {
    if (!supabase) {
      setLocation('/login');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Usuário autenticado, ir para dashboard
        setLocation('/dashboard');
      } else {
        // Usuário não autenticado, ir para login
        setLocation('/login');
      }
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
      setLocation('/login');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        <p>Redirecionando...</p>
      </div>
    </div>
  );
}
