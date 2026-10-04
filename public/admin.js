const $ = id => document.getElementById(id);
let pw = sessionStorage.getItem('pw') || '';
const api = (url, method = 'GET', body) => fetch(url, { method, headers: { 'Content-Type': 'application/json', 'x-admin': pw }, body: body && JSON.stringify(body) });
const FLOW = { delivery: ['Accepted', 'Packed', 'Out for delivery', 'Delivered', 'Cancelled'], pickup: ['Accepted', 'Packed', 'Ready for pickup', 'Delivered', 'Cancelled'] };

async function login() {
  const attempt = pw || $('pw').value;
  const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: attempt }) });
  if (!r.ok) { $('le').innerHTML = '<div class="err">Wrong password. Try again.</div>'; sessionStorage.removeItem('pw'); pw = ''; return; }
  pw = attempt; sessionStorage.setItem('pw', pw);
  $('login').classList.add('hide'); $('app').classList.remove('hide'); loadOrders(); loadProducts();
  setInterval(loadOrders, 15000);
}
$('go').onclick = login; if (pw) login();
$('t1').onclick = () => tab(1); $('t2').onclick = () => tab(2);
function tab(n) { $('orders').classList.toggle('hide', n !== 1); $('prods').classList.toggle('hide', n !== 2); $('t1').classList.toggle('on', n === 1); $('t2').classList.toggle('on', n === 2); }

async function loadOrders() {
  const list = await (await api('/api/admin/orders')).json();
  $('t1').textContent = `Orders (${list.filter(o => o.status === 'New').length} new)`;
  $('orders').innerHTML = list.length ? list.map(o => `<div class="ord"><div class="row"><b>${o.id} - ${o.name}</b><span class="st">${o.status}</span></div>
   <div>Phone: <a href="tel:${o.phone}">${o.phone}</a> | ${o.type === 'delivery' ? 'Delivery: ' + o.address + ' (' + o.area + ')' : 'Pickup'} | ${o.payment}</div>
   <div class="empty">${o.items.map(i => `${i.name} x ${i.qty}`).join(', ')}</div>
   <div><b>Total ₹${o.total}</b> (delivery ₹${o.delivery}) | ${new Date(o.createdAt).toLocaleString()}</div>
   <div class="acts">${FLOW[o.type].map(s => `<button class="btn ${s === 'Cancelled' ? 'red' : 'alt'}" data-o="${o.id}" data-s="${s}">${s}</button>`).join('')}
   <a class="btn" style="padding:8px 10px;text-decoration:none;border-radius:8px" target="_blank" href="https://wa.me/91${o.phone}?text=${encodeURIComponent('Your order ' + o.id + ' status: ' + o.status)}">Message customer</a></div></div>`).join('')
   : '<p class="empty">No orders yet. New orders appear here automatically.</p>';
}
async function loadProducts() {
  const ps = await (await fetch('/api/products')).json();
  $('tb').innerHTML = ps.map(p => `<tr><td>${p.emoji} ${p.name} <span class="empty">per ${p.unit}</span></td>
   <td><input class="num" type="number" value="${p.price}" data-p="${p.id}"></td>
   <td><input type="checkbox" ${p.inStock ? 'checked' : ''} data-k="${p.id}" style="width:24px;height:24px"></td>
   <td><button class="btn red" data-d="${p.id}">Delete</button></td></tr>`).join('');
}
document.addEventListener('click', async e => {
  const t = e.target;
  if (t.dataset.o) { await api('/api/admin/orders/' + t.dataset.o, 'PATCH', { status: t.dataset.s }); loadOrders(); }
  if (t.dataset.d && confirm('Delete this product?')) { await api('/api/admin/products/' + t.dataset.d, 'DELETE'); loadProducts(); }
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.dataset.p) await api('/api/admin/products/' + t.dataset.p, 'PUT', { price: +t.value });
  if (t.dataset.k) await api('/api/admin/products/' + t.dataset.k, 'PUT', { inStock: t.checked });
});
$('na').onclick = async () => {
  const r = await api('/api/admin/products', 'POST', { name: $('nn').value, category: $('nc').value, emoji: $('ne').value, price: $('np').value, unit: $('nu').value });
  if (r.ok) { ['nn', 'nc', 'ne', 'np', 'nu'].forEach(i => $(i).value = ''); loadProducts(); } else alert((await r.json()).error);
};
