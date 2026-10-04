let cfg = {}, products = [], cart = {}, cat = 'All';
const $ = id => document.getElementById(id), rs = n => '₹' + n;
const val = n => document.querySelector(`[name=${n}]:checked`).value;
const linkBtn = 'style="padding:10px 14px;text-decoration:none;display:inline-block;border-radius:8px"';

async function init() {
  cfg = await (await fetch('/api/config')).json();
  products = await (await fetch('/api/products')).json();
  $('shop').textContent = cfg.shopName; $('area').textContent = cfg.area; document.title = cfg.shopName;
  $('call').href = 'tel:' + cfg.phone;
  $('wa').href = 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent('Hi, I want to order groceries.');
  $('area2').innerHTML = cfg.slabs.map(s => `<option>${s.name}</option>`).join('');
  $('upiTxt').innerHTML = `Pay to UPI ID <b>${cfg.upi}</b>. After placing the order you will get a Pay button.`;
  render();
}
function render() {
  const cats = ['All', ...new Set(products.map(p => p.category))];
  $('chips').innerHTML = cats.map(c => `<button class="chip ${c === cat ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
  const q = $('q').value.trim().toLowerCase();
  const list = products.filter(p => (cat === 'All' || p.category === cat) && p.name.toLowerCase().includes(q));
  $('grid').innerHTML = list.length ? list.map(card).join('') : '<p class="empty">No product found. Try a different name or category.</p>';
  renderCart();
}
function card(p) {
  const n = cart[p.id] || 0;
  const ctl = !p.inStock ? '<div class="tag">Out of stock</div>' : n
    ? `<div class="qty"><button data-m="${p.id}" aria-label="Remove one">-</button><b>${n}</b><button data-a="${p.id}" aria-label="Add one">+</button></div>`
    : `<button class="btn add" data-a="${p.id}">Add</button>`;
  return `<div class="p ${p.inStock ? '' : 'out'}"><div class="e">${p.emoji}</div><h3>${p.name}</h3><div class="pr">${rs(p.price)}</div><div class="u">per ${p.unit}</div>${ctl}</div>`;
}
function totals() {
  const sub = Object.entries(cart).reduce((s, [id, q]) => s + products.find(p => p.id == id).price * q, 0);
  let del = 0;
  if (val('type') === 'delivery' && sub) {
    const slab = cfg.slabs.find(s => s.name === $('area2').value);
    del = sub >= cfg.freeAbove ? 0 : (slab ? slab.charge : 0);
  }
  return { sub, del, total: sub + del };
}
function renderCart() {
  const ids = Object.keys(cart), t = totals();
  $('cart').innerHTML = ids.length ? ids.map(id => { const p = products.find(x => x.id == id);
    return `<div class="row"><span>${p.emoji} ${p.name} x ${cart[id]}</span><span>${rs(p.price * cart[id])}</span></div>`; }).join('') +
    `<div class="row"><span>Items total</span><span>${rs(t.sub)}</span></div>
     <div class="row"><span>Delivery</span><span>${t.del ? rs(t.del) : (val('type') === 'delivery' ? 'Free' : 'Not needed')}</span></div>
     <div class="row tot"><span>To pay</span><span>${rs(t.total)}</span></div>
     <p class="empty">${cfg.freeAbove ? 'Free delivery above ' + rs(cfg.freeAbove) : ''}</p>`
    : '<p class="empty">Your basket is empty. Add some items from the list, for example milk or rice.</p>';
  $('form').classList.toggle('hide', !ids.length);
  $('floatBtn').textContent = ids.length ? `View basket (${ids.length} items) - ${rs(t.total)}` : 'Basket is empty';
}
document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.c) { cat = t.dataset.c; render(); }
  if (t.dataset.a) { cart[t.dataset.a] = (cart[t.dataset.a] || 0) + 1; render(); }
  if (t.dataset.m) { if (--cart[t.dataset.m] <= 0) delete cart[t.dataset.m]; render(); }
});
$('q').oninput = render;
document.querySelectorAll('[name=type]').forEach(r => r.onchange = () => { $('dl').classList.toggle('hide', val('type') !== 'delivery'); renderCart(); });
document.querySelectorAll('[name=pay]').forEach(r => r.onchange = () => $('upiBox').classList.toggle('hide', val('pay') !== 'upi'));
$('area2').onchange = renderCart;
$('floatBtn').onclick = () => $('panel').scrollIntoView({ behavior: 'smooth' });
$('share').onclick = e => { e.preventDefault(); window.open('https://wa.me/?text=' + encodeURIComponent('Order groceries from ' + cfg.shopName + ': ' + location.href)); };

$('place').onclick = async () => {
  const body = { name: $('name').value.trim(), phone: $('phone').value.trim(), type: val('type'), area: $('area2').value,
    address: $('addr').value.trim(), payment: val('pay'), items: Object.entries(cart).map(([id, qty]) => ({ id: +id, qty })) };
  const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) { $('err').innerHTML = `<div class="err">${d.error}</div>`; return; }
  cart = {}; $('err').innerHTML = '';
  const lines = d.items.map(i => `${i.name} x ${i.qty} = ₹${i.price * i.qty}`).join('\n');
  const msg = `New order ${d.id}\nName: ${d.name} (${d.phone})\n${d.type === 'delivery' ? 'Delivery to: ' + d.address + ' (' + d.area + ')' : 'Pickup'}\n${lines}\nDelivery: ₹${d.delivery}\nTotal: ₹${d.total}\nPayment: ${d.payment}`;
  const upi = `upi://pay?pa=${cfg.upi}&pn=${encodeURIComponent(cfg.shopName)}&am=${d.total}&cu=INR&tn=${d.id}`;
  $('done').classList.remove('hide');
  $('done').innerHTML = `<div class="ok"><h2>Order placed. Your order number is ${d.id}</h2>
    <p>Total to pay: <b>${rs(d.total)}</b> (${d.payment}). Save this number to track your order.</p>
    ${d.payment === 'UPI' ? `<p><a class="btn" ${linkBtn} href="${upi}">Pay ${rs(d.total)} with UPI</a></p>` : ''}
    <p>Send the order on WhatsApp so the store sees it faster:</p>
    <a class="btn" ${linkBtn} target="_blank" href="https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}">Send on WhatsApp</a></div>`;
  $('done').scrollIntoView({ behavior: 'smooth' }); render();
};
$('trkBtn').onclick = async () => {
  const r = await fetch('/api/track/' + encodeURIComponent($('trk').value.trim())), d = await r.json();
  $('trkOut').innerHTML = r.ok ? `<div class="ok">Order ${d.id}: <span class="st">${d.status}</span> (${rs(d.total)}, ${d.type})</div>` : `<div class="err">${d.error}</div>`;
};
init();
