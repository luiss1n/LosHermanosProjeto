import {
  supabase,
  fetchProducts,
  fetchOrders,
  fetchProductRecipes,
  fetchIngredients,
  createIngredient,
  updateIngredientStock,
} from './data.js';

const state = {
  orders: [],
  products: [],
  recipes: [],
  ingredients: [],
  activeView: 'pedidos',
  isAdmin: false,
  adminAccess: null,
  authRequest: 0,
  toastTimer: undefined,
};

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => {
  const element = document.createElement('span');
  element.textContent = String(value ?? '');
  return element.innerHTML;
};

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function money(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function createOrderLine(product) {
  const recipe = state.recipes
    .filter((row) => row.product_id === product.id && row.ingredients?.active)
    .map((row) => ({
      ingredient_id: row.ingredient_id,
      name: row.ingredients.name,
      unit: row.ingredients.unit,
      base_quantity: Number(row.quantity),
      quantity: Number(row.quantity),
      extra_price_cents: Number(row.extra_price_cents ?? row.ingredients.extra_price_cents ?? 0),
    }));
  return {
    key: crypto.randomUUID(),
    product_id: product.id,
    product_name: product.name,
    base_price_cents: Number(product.base_price_cents ?? product.price_cents),
    ingredients: recipe,
  };
}

function lineTotal(line) {
  return line.base_price_cents + line.ingredients.reduce((sum, ingredient) => {
    const changed = ingredient.quantity - ingredient.base_quantity;
    return sum + Math.max(0, changed) * ingredient.extra_price_cents;
  }, 0);
}

function renderOrderDialog() {
  const select = $('#order-product');
  const previousValue = select.value;
  select.innerHTML = '<option value="">Selecione um lanche</option>' + state.products
    .map((product) => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} · ${money(Number(product.base_price_cents ?? product.price_cents))}</option>`)
    .join('');
  if (state.products.some((product) => product.id === previousValue)) select.value = previousValue;

  const host = $('#order-lines');
  if (!state.orderDraft.length) {
    host.innerHTML = '<div class="empty-state">Adicione um lanche para começar o pedido.</div>';
  } else {
    host.innerHTML = state.orderDraft.map((line) => `<article class="order-line" data-line="${escapeHtml(line.key)}">
      <header class="order-line-header"><div><strong>${escapeHtml(line.product_name)}</strong><small>Preço base: ${money(line.base_price_cents)}</small></div><button class="remove-line" type="button" data-remove-line="${escapeHtml(line.key)}">Remover lanche</button></header>
      <div class="recipe-list">${line.ingredients.length ? line.ingredients.map((ingredient) => `<div class="recipe-row" data-ingredient="${escapeHtml(ingredient.ingredient_id)}">
        <div><strong>${escapeHtml(ingredient.name)}</strong><small>Base: ${formatQuantity(ingredient.base_quantity)} ${escapeHtml(ingredient.unit)}${ingredient.extra_price_cents ? ` · Adicional ${money(ingredient.extra_price_cents)} por unidade` : ''}</small></div>
        <div class="quantity-control"><button type="button" data-quantity="-1" aria-label="Remover ${escapeHtml(ingredient.name)}">−</button><output>${formatQuantity(ingredient.quantity)}</output><button type="button" data-quantity="1" aria-label="Adicionar ${escapeHtml(ingredient.name)}">＋</button></div>
      </div>`).join('') : '<p class="recipe-empty">Receita ainda não cadastrada para este lanche.</p>'}</div>
      <footer>Subtotal do lanche <strong>${money(lineTotal(line))}</strong></footer>
    </article>`).join('');
  }
  $('#order-total').textContent = money(state.orderDraft.reduce((sum, line) => sum + lineTotal(line), 0));
}

function openOrderDialog() {
  if (!state.products.length) {
    showToast('Cadastre produtos ativos no cardápio antes de criar pedidos.');
    return;
  }
  state.orderDraft = [];
  $('#order-form').reset();
  $('#order-feedback').textContent = '';
  renderOrderDialog();
  $('#order-dialog').hidden = false;
  document.body.classList.add('dialog-open');
  requestAnimationFrame(() => $('#order-customer').focus());
}

function closeOrderDialog() {
  $('#order-dialog').hidden = true;
  document.body.classList.remove('dialog-open');
  $('#new-order').focus();
}

function renderOrders() {
  const list = $('#order-list');
  $('#nav-count').textContent = state.orders.length;
  $('#visible-count').textContent = state.orders.length;

  if (!state.isAdmin) {
    list.innerHTML = '<div class="empty-state">A conta conectada não tem permissão de administrador. Atualize app_metadata.role para admin no Supabase Auth e entre novamente.</div>';
    return;
  }
  if (!state.orders.length) {
    list.innerHTML = '<div class="empty-state">Nenhum pedido cadastrado.</div>';
    return;
  }

  const statusLabels = {
    aguardando: 'Aguardando',
    preparo: 'Em preparo',
    pronto: 'Pronto',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };

  list.innerHTML = state.orders.map((order) => {
    const source = order.source === 'whatsapp' ? 'WhatsApp' : 'Balcão';
    const status = statusLabels[order.status] || order.status;
    return `<article class="order-card real-order">
      <div class="order-avatar">${escapeHtml(order.order_number ?? '—')}</div>
      <div class="customer"><strong>${escapeHtml(order.customer_name)}</strong><small>#${escapeHtml(order.order_number ?? '')} · ${source}</small></div>
      <div class="order-items"><strong>${escapeHtml(order.notes || 'Sem observações')}</strong><small>${formatDate(order.created_at)}</small></div>
      <span class="status ${escapeHtml(order.status)}">${escapeHtml(status)}</span>
    </article>`;
  }).join('');
}

function renderProducts() {
  const section = document.createElement('section');
  section.className = 'section-placeholder';
  const content = !state.isAdmin
    ? '<div class="empty-state">O acesso ao cardápio foi bloqueado pelas políticas do banco. Confirme app_metadata.role = admin na conta e entre novamente.</div>'
    : state.products.length
    ? state.products.map((product, index) => `<div class="menu-item">
        <span class="menu-number">${String(index + 1).padStart(2, '0')}</span>
        <strong>${escapeHtml(product.name)}</strong>
        <b>${money(Number(product.base_price_cents ?? product.price_cents))}</b>
      </div>`).join('')
    : '<div class="empty-state">Nenhum produto ativo cadastrado.</div>';
  section.innerHTML = `<h2>Cardápio</h2><p>Produtos ativos cadastrados no Supabase.</p><div class="menu-grid">${content}</div>`;
  return section;
}

function renderIngredients() {
  const list = $('#ingredient-list');
  if (!state.isAdmin) {
    list.innerHTML = '<tr><td class="table-empty" colspan="3">A conta conectada não tem permissão de administrador. Atualize app_metadata.role para admin no Supabase Auth e entre novamente.</td></tr>';
    return;
  }
  if (!state.ingredients.length) {
    list.innerHTML = '<tr><td class="table-empty" colspan="3">Nenhum ingrediente cadastrado. Adicione os ingredientes e informe a quantidade disponível.</td></tr>';
    return;
  }

  list.innerHTML = state.ingredients.map((ingredient) => {
    const id = escapeHtml(ingredient.id);
    const name = escapeHtml(ingredient.name);
    const unit = escapeHtml(ingredient.unit);
    return `<tr>
      <td><strong>${name}</strong></td>
      <td>${unit}</td>
      <td><form class="stock-update-form" data-ingredient="${id}">
        <label class="sr-only" for="stock-${id}">Quantidade disponível de ${name}</label>
        <input id="stock-${id}" name="stock_quantity" type="number" min="0" step="0.001" required value="${Number(ingredient.stock_quantity)}" />
        <span>${unit}</span>
        <button class="secondary-button" type="submit">Atualizar</button>
      </form></td>
    </tr>`;
  }).join('');
}

function showView(view) {
  state.activeView = view;
  const titles = {
    pedidos: ['Pedidos', 'Pedidos registrados no sistema.'],
    cardapio: ['Cardápio', 'Produtos cadastrados no Supabase.'],
    estoque: ['Estoque', 'Quantidade disponível de cada ingrediente.'],
  };
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });
  $('#crumb').textContent = titles[view][0];
  $('#page-title').innerHTML = `${titles[view][0]} <span class="yellow-period">.</span>`;
  $('#page-subtitle').textContent = titles[view][1];
  $('#orders-panel').hidden = view !== 'pedidos';
  $('#stock-panel').hidden = view !== 'estoque';

  const previous = $('.section-placeholder');
  if (previous) previous.remove();
  if (view === 'cardapio') $('#orders-panel').after(renderProducts());
  if (view === 'estoque') renderIngredients();
  $('#sidebar').classList.remove('open');
}

function showAuth() {
  state.authRequest += 1;
  $('#auth-screen').hidden = false;
  $('#sidebar').hidden = true;
  $('.main').hidden = true;
  $('#auth-hint').hidden = Boolean(supabase);
  requestAnimationFrame(() => $('#login-email').focus());
}

function showDashboard(user) {
  $('#auth-screen').hidden = true;
  $('#sidebar').hidden = false;
  $('.main').hidden = false;
  $('#profile-email').textContent = user.email || 'Administrador';
  state.isAdmin = user.app_metadata?.role === 'admin';
  $('#connection-title').textContent = state.isAdmin ? 'Acesso administrativo' : 'Permissão pendente';
  $('#connection-detail').textContent = state.isAdmin ? 'Supabase conectado' : 'Conta sem função admin';
  if (!state.isAdmin) {
    state.orders = [];
    state.products = [];
    state.ingredients = [];
    renderOrders();
    if (state.activeView === 'estoque') renderIngredients();
  }
}

async function refreshOrders() {
  try {
    const { data, error } = await fetchOrders();
    if (error) throw error;
    state.orders = data || [];
    renderOrders();
  } catch {
    $('#order-list').innerHTML = '<div class="empty-state">Não foi possível carregar os pedidos. Verifique a conexão e as permissões do Supabase.</div>';
    showToast('Falha ao carregar pedidos.');
  }
}

async function refreshProducts() {
  try {
    const { data, error } = await fetchProducts();
    if (error) throw error;
    state.products = data || [];
    if (state.products.length && !state.recipesLoaded) await refreshRecipes();
    if (state.activeView === 'cardapio') showView('cardapio');
  } catch {
    state.products = [];
    showToast('Falha ao carregar o cardápio.');
  }
}

async function refreshRecipes() {
  try {
    const { data, error } = await fetchProductRecipes();
    if (error) throw error;
    state.recipes = data || [];
    state.recipesLoaded = true;
  } catch {
    state.recipes = [];
    state.recipesLoaded = false;
    showToast('Não foi possível carregar as receitas.');
  }
}

async function refreshIngredients() {
  try {
    const { data, error } = await fetchIngredients();
    if (error) throw error;
    state.ingredients = data || [];
    if (state.activeView === 'estoque') renderIngredients();
  } catch {
    $('#ingredient-list').innerHTML = '<tr><td class="table-empty" colspan="3">Não foi possível carregar o estoque. Verifique a conexão e as permissões do Supabase.</td></tr>';
    showToast('Falha ao carregar o estoque.');
  }
}

async function refreshDashboardData() {
  if (!state.isAdmin) return;
  await Promise.all([refreshOrders(), refreshProducts(), refreshIngredients()]);
}

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const error = $('#auth-error');
  const button = form.querySelector('[type="submit"]');
  error.hidden = true;
  if (!supabase) {
    error.textContent = 'Supabase não configurado.';
    error.hidden = false;
    return;
  }

  const request = ++state.authRequest;
  button.textContent = 'Entrando…';
  try {
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: form.elements.email.value.trim(),
      password: form.elements.password.value,
    });
    if (request !== state.authRequest) return;
    if (loginError) {
      error.textContent = 'Não foi possível entrar. Confira o e-mail e a senha.';
      error.hidden = false;
      return;
    }
    showDashboard(data.user);
  } catch {
    if (request === state.authRequest) {
      error.textContent = 'Não foi possível conectar ao Supabase. Tente novamente.';
      error.hidden = false;
    }
  } finally {
    if (request === state.authRequest) button.textContent = 'Entrar';
  }
});

$('#sign-out').addEventListener('click', async () => {
  if (!supabase) return;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast('Não foi possível encerrar a sessão.');
      return;
    }
    showAuth();
  } catch {
    showToast('Não foi possível conectar ao Supabase para encerrar a sessão.');
  }
});

$('#ingredient-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.dataset.loading === 'true') return;
  const formData = new FormData(form);
  const name = String(formData.get('name')).trim();
  const unit = String(formData.get('unit')).trim();
  const stockQuantity = Number(formData.get('stock_quantity'));
  if (!name || !unit || !Number.isFinite(stockQuantity) || stockQuantity < 0) {
    $('#ingredient-feedback').textContent = 'Informe o nome, a unidade e uma quantidade igual ou maior que zero.';
    return;
  }

  form.dataset.loading = 'true';
  $('#ingredient-feedback').textContent = '';
  let error;
  try {
    ({ error } = await createIngredient({ name, unit, stock_quantity: stockQuantity }));
  } catch {
    error = new Error('Falha de conexão');
  } finally {
    form.dataset.loading = 'false';
  }
  if (error) {
    $('#ingredient-feedback').textContent = error.code === '23505'
      ? 'Esse ingrediente já está cadastrado. Atualize a quantidade na lista.'
      : 'Não foi possível cadastrar o ingrediente. Confira os dados e tente novamente.';
    return;
  }
  form.reset();
  await refreshIngredients();
  showToast('Ingrediente cadastrado.');
});

$('#ingredient-list').addEventListener('submit', async (event) => {
  const form = event.target.closest('.stock-update-form');
  if (!form) return;
  event.preventDefault();
  if (form.dataset.loading === 'true') return;
  const quantity = Number(new FormData(form).get('stock_quantity'));
  if (!Number.isFinite(quantity) || quantity < 0) return;
  form.dataset.loading = 'true';
  let error;
  try {
    ({ error } = await updateIngredientStock(form.dataset.ingredient, quantity));
  } catch {
    error = new Error('Falha de conexão');
  } finally {
    form.dataset.loading = 'false';
  }
  if (error) {
    showToast('Não foi possível atualizar a quantidade.');
    return;
  }
  await refreshIngredients();
  showToast('Quantidade disponível atualizada.');
});

$('#new-order').addEventListener('click', openOrderDialog);
$('#new-order-panel').addEventListener('click', openOrderDialog);
$('#close-order-dialog').addEventListener('click', closeOrderDialog);
$('#cancel-order').addEventListener('click', closeOrderDialog);
$('#order-dialog').addEventListener('click', (event) => {
  if (event.target === $('#order-dialog')) closeOrderDialog();
});
$('#add-product').addEventListener('click', () => {
  const product = state.products.find((item) => item.id === $('#order-product').value);
  if (!product) {
    $('#order-feedback').textContent = 'Selecione um lanche do cardápio.';
    return;
  }
  $('#order-feedback').textContent = '';
  if (state.orderDraft.length >= 20) {
    $('#order-feedback').textContent = 'O pedido pode conter até 20 lanches.';
    return;
  }
  state.orderDraft.push(createOrderLine(product));
  renderOrderDialog();
});
$('#order-lines').addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove-line]');
  if (removeButton) {
    state.orderDraft = state.orderDraft.filter((line) => line.key !== removeButton.dataset.removeLine);
    renderOrderDialog();
    return;
  }

  const quantityButton = event.target.closest('[data-quantity]');
  if (!quantityButton) return;
  const row = quantityButton.closest('[data-ingredient]');
  const lineElement = quantityButton.closest('[data-line]');
  const line = state.orderDraft.find((item) => item.key === lineElement.dataset.line);
  const ingredient = line?.ingredients.find((item) => item.ingredient_id === row.dataset.ingredient);
  if (!ingredient) return;
  ingredient.quantity = Math.max(0, Number((ingredient.quantity + Number(quantityButton.dataset.quantity)).toFixed(3)));
  renderOrderDialog();
});
  $('#order-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = $('#order-feedback');
  const button = form.querySelector('[type="submit"]');
  feedback.textContent = '';
  const customerName = form.elements.customer_name.value.trim();
  if (!customerName) {
    feedback.textContent = 'Informe o nome do cliente.';
    form.elements.customer_name.focus();
    return;
  }
  if (!state.orderDraft.length) {
    feedback.textContent = 'Adicione pelo menos um lanche ao pedido.';
    return;
  }
  if (state.orderDraft.some((line) => !line.ingredients.length)) {
    feedback.textContent = 'Cadastre a receita de cada lanche selecionado antes de salvar o pedido.';
    return;
  }

  if (!state.orderDraft.every((line) => line.ingredients.every((ingredient) => Number.isFinite(ingredient.quantity) && ingredient.quantity >= 0))) {
    feedback.textContent = 'Confira as quantidades dos ingredientes antes de salvar.';
    return;
  }

  const items = state.orderDraft.map((line) => ({
    product_id: line.product_id,
    product_name: line.product_name,
    quantity: 1,
    unit_price_cents: lineTotal(line),
    customizations: {
      ingredients: line.ingredients.map(({ ingredient_id, name, unit, quantity }) => ({ ingredient_id, name, unit, quantity })),
    },
  }));
  button.textContent = 'Salvando…';
  try {
    const { data, error } = await createOrder({
      customer_name: customerName,
      source: form.elements.source.value,
      notes: form.elements.notes.value.trim(),
      items,
    });
    if (error) throw error;
    closeOrderDialog();
    await refreshOrders();
    showToast(`Pedido #${data} salvo.`);
  } catch {
    feedback.textContent = 'Não foi possível salvar o pedido. Verifique a conexão, as receitas e as permissões do Supabase.';
  } finally {
    button.textContent = 'Salvar pedido';
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('#order-dialog').hidden) closeOrderDialog();
});

document.querySelectorAll('.nav-item').forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.view));
});
$('#mobile-menu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#today').textContent = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short', day: 'numeric', month: 'short',
}).format(new Date());

if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session && event === 'SIGNED_IN') {
      showDashboard(session.user);
      refreshDashboardData();
    } else if (!session) {
      showAuth();
    }
  });
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    showDashboard(session.user);
    await refreshDashboardData();
  } else {
    showAuth();
  }
} else {
  showAuth();
}

renderOrders();
