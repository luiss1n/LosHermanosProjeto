import { createClient } from '@supabase/supabase-js';

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env;
export const supabase = VITE_SUPABASE_URL && VITE_SUPABASE_ANON_KEY
  ? createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
  : null;

export async function fetchProducts() {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  return supabase.from('products').select('id,name,price_cents,base_price_cents,active').eq('active', true).order('name');
}

export async function fetchOrders() {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  return supabase
    .from('orders')
    .select('id,order_number,customer_name,source,status,notes,created_at')
    .order('created_at', { ascending: false });
}

export async function fetchIngredients() {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  return supabase
    .from('ingredients')
    .select('id,name,unit,stock_quantity,extra_price_cents,active')
    .eq('active', true)
    .order('name');
}

export async function createIngredient({ name, unit, stock_quantity }) {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  return supabase
    .from('ingredients')
    .insert({ name, unit, stock_quantity })
    .select('id,name,unit,stock_quantity,extra_price_cents,active')
    .single();
}

export async function updateIngredientStock(id, stock_quantity) {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  return supabase
    .from('ingredients')
    .update({ stock_quantity, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id,name,unit,stock_quantity,extra_price_cents,active')
    .single();
}

export async function fetchProductRecipes() {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  return supabase
    .from('product_ingredients')
    .select('product_id,ingredient_id,quantity,extra_price_cents,ingredients!inner(id,name,unit,extra_price_cents,active)')
    .eq('ingredients.active', true);
}

export async function createOrder({ customer_name, source, notes, items }) {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  return supabase.rpc('create_order_with_items', {
    p_customer_name: customer_name,
    p_source: source,
    p_notes: notes,
    p_items: items,
  });
}
