import { createClient } from '@supabase/supabase-js';

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env;
export const supabase = VITE_SUPABASE_URL && VITE_SUPABASE_ANON_KEY
  ? createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
  : null;

export async function fetchProducts() {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  return supabase.from('products').select('id,name,price_cents,active').eq('active', true).order('name');
}
