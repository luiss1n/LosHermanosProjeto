-- Recria o cardápio e suas receitas a partir da imagem enviada pelo responsável.
-- Quantidade-base: 1 por ingrediente listado; "muçarela dupla" = 2 fatias.
-- O cardápio não informa gramaturas nem preços de adicionais: estoque inicia em zero
-- e extra_price_cents fica em zero até que os valores reais sejam definidos.

insert into public.products(name, price_cents, base_price_cents, active) values
  ('Misto Quente', 1000, 1000, true),
  ('Hambúrguer', 1200, 1200, true),
  ('Americano', 1300, 1300, true),
  ('X-Burguer', 1400, 1400, true),
  ('Egg-Burguer', 1600, 1600, true),
  ('X-Salada', 1500, 1500, true),
  ('Egg-Salada', 1650, 1650, true),
  ('X-Especial', 1600, 1600, true),
  ('Egg-Especial', 1700, 1700, true),
  ('X-Frango', 1800, 1800, true),
  ('Egg-Frango', 1900, 1900, true),
  ('X-Vegetariano', 1600, 1600, true),
  ('X-Calabresa', 1900, 1900, true),
  ('Egg-Calabresa', 2000, 2000, true),
  ('X-Bacon', 1900, 1900, true),
  ('Egg-Bacon', 2000, 2000, true),
  ('X-Bacon Cheddar', 2100, 2100, true),
  ('X-Tudo', 2400, 2400, true)
on conflict (name) do update set
  price_cents = excluded.price_cents,
  base_price_cents = excluded.base_price_cents,
  active = true;

insert into public.ingredients(name, unit, stock_quantity, extra_price_cents, active) values
  ('Pão', 'unidade', 0, 0, true),
  ('Maionese', 'porção', 0, 0, true),
  ('Presunto', 'fatia', 0, 0, true),
  ('Muçarela', 'fatia', 0, 0, true),
  ('Batata', 'porção', 0, 0, true),
  ('Tomate', 'fatia', 0, 0, true),
  ('Hambúrguer', 'unidade', 0, 0, true),
  ('Alface', 'folha', 0, 0, true),
  ('Milho', 'porção', 0, 0, true),
  ('Ovo', 'unidade', 0, 0, true),
  ('Frango desfiado', 'porção', 0, 0, true),
  ('Catupiry', 'porção', 0, 0, true),
  ('Calabresa', 'porção', 0, 0, true),
  ('Bacon', 'porção', 0, 0, true),
  ('Cheddar', 'porção', 0, 0, true)
on conflict (name) do nothing;

with recipe(product_name, ingredient_name, quantity) as (
  values
    ('Misto Quente', 'Pão', 1), ('Misto Quente', 'Maionese', 1), ('Misto Quente', 'Presunto', 1), ('Misto Quente', 'Muçarela', 2),
    ('Hambúrguer', 'Pão', 1), ('Hambúrguer', 'Maionese', 1), ('Hambúrguer', 'Batata', 1), ('Hambúrguer', 'Tomate', 1), ('Hambúrguer', 'Hambúrguer', 1),
    ('Americano', 'Pão', 1), ('Americano', 'Maionese', 1), ('Americano', 'Alface', 1), ('Americano', 'Milho', 1), ('Americano', 'Ovo', 1), ('Americano', 'Presunto', 1), ('Americano', 'Muçarela', 1),
    ('X-Burguer', 'Pão', 1), ('X-Burguer', 'Maionese', 1), ('X-Burguer', 'Batata', 1), ('X-Burguer', 'Tomate', 1), ('X-Burguer', 'Milho', 1), ('X-Burguer', 'Hambúrguer', 1), ('X-Burguer', 'Presunto', 1), ('X-Burguer', 'Muçarela', 1),
    ('Egg-Burguer', 'Pão', 1), ('Egg-Burguer', 'Maionese', 1), ('Egg-Burguer', 'Batata', 1), ('Egg-Burguer', 'Tomate', 1), ('Egg-Burguer', 'Milho', 1), ('Egg-Burguer', 'Ovo', 1), ('Egg-Burguer', 'Hambúrguer', 1), ('Egg-Burguer', 'Presunto', 1), ('Egg-Burguer', 'Muçarela', 1),
    ('X-Salada', 'Pão', 1), ('X-Salada', 'Maionese', 1), ('X-Salada', 'Batata', 1), ('X-Salada', 'Tomate', 1), ('X-Salada', 'Alface', 1), ('X-Salada', 'Hambúrguer', 1), ('X-Salada', 'Presunto', 1), ('X-Salada', 'Muçarela', 1),
    ('Egg-Salada', 'Pão', 1), ('Egg-Salada', 'Maionese', 1), ('Egg-Salada', 'Batata', 1), ('Egg-Salada', 'Tomate', 1), ('Egg-Salada', 'Alface', 1), ('Egg-Salada', 'Ovo', 1), ('Egg-Salada', 'Hambúrguer', 1), ('Egg-Salada', 'Presunto', 1), ('Egg-Salada', 'Muçarela', 1),
    ('X-Especial', 'Pão', 1), ('X-Especial', 'Maionese', 1), ('X-Especial', 'Batata', 1), ('X-Especial', 'Tomate', 1), ('X-Especial', 'Alface', 1), ('X-Especial', 'Milho', 1), ('X-Especial', 'Hambúrguer', 1), ('X-Especial', 'Presunto', 1), ('X-Especial', 'Muçarela', 1),
    ('Egg-Especial', 'Pão', 1), ('Egg-Especial', 'Maionese', 1), ('Egg-Especial', 'Batata', 1), ('Egg-Especial', 'Tomate', 1), ('Egg-Especial', 'Alface', 1), ('Egg-Especial', 'Milho', 1), ('Egg-Especial', 'Ovo', 1), ('Egg-Especial', 'Hambúrguer', 1), ('Egg-Especial', 'Presunto', 1), ('Egg-Especial', 'Muçarela', 1),
    ('X-Frango', 'Pão', 1), ('X-Frango', 'Maionese', 1), ('X-Frango', 'Batata', 1), ('X-Frango', 'Tomate', 1), ('X-Frango', 'Milho', 1), ('X-Frango', 'Presunto', 1), ('X-Frango', 'Muçarela', 1), ('X-Frango', 'Frango desfiado', 1), ('X-Frango', 'Catupiry', 1),
    ('Egg-Frango', 'Pão', 1), ('Egg-Frango', 'Maionese', 1), ('Egg-Frango', 'Batata', 1), ('Egg-Frango', 'Tomate', 1), ('Egg-Frango', 'Milho', 1), ('Egg-Frango', 'Presunto', 1), ('Egg-Frango', 'Muçarela', 1), ('Egg-Frango', 'Ovo', 1), ('Egg-Frango', 'Frango desfiado', 1), ('Egg-Frango', 'Catupiry', 1),
    ('X-Vegetariano', 'Pão', 1), ('X-Vegetariano', 'Maionese', 1), ('X-Vegetariano', 'Batata', 1), ('X-Vegetariano', 'Tomate', 1), ('X-Vegetariano', 'Milho', 1), ('X-Vegetariano', 'Alface', 1), ('X-Vegetariano', 'Ovo', 1), ('X-Vegetariano', 'Muçarela', 2),
    ('X-Calabresa', 'Pão', 1), ('X-Calabresa', 'Maionese', 1), ('X-Calabresa', 'Batata', 1), ('X-Calabresa', 'Tomate', 1), ('X-Calabresa', 'Milho', 1), ('X-Calabresa', 'Calabresa', 1), ('X-Calabresa', 'Hambúrguer', 1), ('X-Calabresa', 'Presunto', 1), ('X-Calabresa', 'Muçarela', 1),
    ('Egg-Calabresa', 'Pão', 1), ('Egg-Calabresa', 'Maionese', 1), ('Egg-Calabresa', 'Batata', 1), ('Egg-Calabresa', 'Tomate', 1), ('Egg-Calabresa', 'Milho', 1), ('Egg-Calabresa', 'Calabresa', 1), ('Egg-Calabresa', 'Ovo', 1), ('Egg-Calabresa', 'Hambúrguer', 1), ('Egg-Calabresa', 'Presunto', 1), ('Egg-Calabresa', 'Muçarela', 1),
    ('X-Bacon', 'Pão', 1), ('X-Bacon', 'Maionese', 1), ('X-Bacon', 'Batata', 1), ('X-Bacon', 'Tomate', 1), ('X-Bacon', 'Milho', 1), ('X-Bacon', 'Bacon', 1), ('X-Bacon', 'Hambúrguer', 1), ('X-Bacon', 'Presunto', 1), ('X-Bacon', 'Muçarela', 1),
    ('Egg-Bacon', 'Pão', 1), ('Egg-Bacon', 'Maionese', 1), ('Egg-Bacon', 'Batata', 1), ('Egg-Bacon', 'Tomate', 1), ('Egg-Bacon', 'Milho', 1), ('Egg-Bacon', 'Bacon', 1), ('Egg-Bacon', 'Ovo', 1), ('Egg-Bacon', 'Hambúrguer', 1), ('Egg-Bacon', 'Presunto', 1), ('Egg-Bacon', 'Muçarela', 1),
    ('X-Bacon Cheddar', 'Pão', 1), ('X-Bacon Cheddar', 'Maionese', 1), ('X-Bacon Cheddar', 'Batata', 1), ('X-Bacon Cheddar', 'Tomate', 1), ('X-Bacon Cheddar', 'Milho', 1), ('X-Bacon Cheddar', 'Bacon', 1), ('X-Bacon Cheddar', 'Hambúrguer', 1), ('X-Bacon Cheddar', 'Presunto', 1), ('X-Bacon Cheddar', 'Muçarela', 1), ('X-Bacon Cheddar', 'Cheddar', 1),
    ('X-Tudo', 'Pão', 1), ('X-Tudo', 'Maionese', 1), ('X-Tudo', 'Batata', 1), ('X-Tudo', 'Tomate', 1), ('X-Tudo', 'Milho', 1), ('X-Tudo', 'Bacon', 1), ('X-Tudo', 'Calabresa', 1), ('X-Tudo', 'Ovo', 1), ('X-Tudo', 'Hambúrguer', 1), ('X-Tudo', 'Presunto', 1), ('X-Tudo', 'Muçarela', 1), ('X-Tudo', 'Cheddar', 1)
)
insert into public.product_ingredients(product_id, ingredient_id, quantity, extra_price_cents)
select p.id, i.id, recipe.quantity, 0
from recipe
join public.products p on p.name = recipe.product_name
join public.ingredients i on i.name = recipe.ingredient_name
on conflict (product_id, ingredient_id) do update set
  quantity = excluded.quantity,
  extra_price_cents = excluded.extra_price_cents;
