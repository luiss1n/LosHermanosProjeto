import {
  supabase,
  fetchProducts,
  fetchOrders,
  fetchIngredients,
  createIngredient,
  updateIngredientStock,
} from './data.js';

const state = {
  orders: [],
  products: [],
  ingredients: [],
  activeView: 'pedidos',
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

function renderOrders() {
  const list = $('#order-list');
  $('#nav-count').textContent = state.orders.length;
  $('#visible-count').textContent = state.orders.length;

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
  const content = state.products.length
    ? state.products.map((product, index) => `<div class="menu-item">
        <span class="menu-number">${String(index + 1).padStart(2, '0')}</span>
        <strong>${escapeHtml(product.name)}</strong>
        <b>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price_cents / 100)}</b>
      </div>`).join('')
    : '<div class="empty-state">Nenhum produto ativo cadastrado.</div>';
  section.innerHTML = `<h2>Cardápio</h2><p>Produtos ativos cadastrados no Supabase.</p><div class="menu-grid">${content}</div>`;
  return section;
}

function renderIngredients() {
  const list = $('#ingredient-list');
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
  $('#connection-title').textContent = 'Sessão autenticada';
  $('#connection-detail').textContent = 'Supabase conectado';
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
    if (state.activeView === 'cardapio') showView('cardapio');
  } catch {
    state.products = [];
    showToast('Falha ao carregar o cardápio.');
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
