// Local Grocery Store - Express server with JSON file storage (no paid services)
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const DB = path.join(__dirname, 'data', 'db.json');
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123'; // change this before real use
const STATUSES = ['New', 'Accepted', 'Packed', 'Out for delivery', 'Ready for pickup', 'Delivered', 'Cancelled'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const load = () => JSON.parse(fs.readFileSync(DB, 'utf8'));
const save = d => fs.writeFileSync(DB, JSON.stringify(d, null, 2));
const admin = (req, res, next) =>
  req.headers['x-admin'] === ADMIN_PASS ? next() : res.status(401).json({ error: 'Please log in again.' });

// ---------- Customer API ----------
app.get('/api/config', (req, res) => res.json(load().config));
app.get('/api/products', (req, res) => res.json(load().products));

app.post('/api/orders', (req, res) => {
  const d = load(), b = req.body || {};
  if (!b.name || !/^\d{10}$/.test(b.phone || '') || !Array.isArray(b.items) || !b.items.length)
    return res.status(400).json({ error: 'Enter your name, a 10-digit mobile number and add at least one item.' });
  let subtotal = 0; const items = [];
  for (const i of b.items) {
    const p = d.products.find(x => x.id === i.id);
    if (!p || !p.inStock) return res.status(400).json({ error: (p ? p.name : 'An item') + ' is out of stock. Remove it and try again.' });
    const qty = Math.max(1, parseInt(i.qty) || 1);
    items.push({ id: p.id, name: p.name, unit: p.unit, price: p.price, qty });
    subtotal += p.price * qty;
  }
  let delivery = 0;
  if (b.type === 'delivery') {
    const slab = d.config.slabs.find(s => s.name === b.area);
    if (!slab || !b.address) return res.status(400).json({ error: 'Choose your delivery area and enter your address.' });
    delivery = subtotal >= d.config.freeAbove ? 0 : slab.charge;
  }
  const order = {
    id: 'ORD' + (1001 + d.orders.length), name: b.name, phone: b.phone, type: b.type === 'delivery' ? 'delivery' : 'pickup',
    area: b.area || '', address: b.address || '', payment: b.payment === 'upi' ? 'UPI' : 'COD', upiRef: b.upiRef || '',
    items, subtotal, delivery, total: subtotal + delivery, status: 'New', createdAt: new Date().toISOString()
  };
  d.orders.push(order); save(d); res.json(order);
});

app.get('/api/track/:id', (req, res) => {
  const o = load().orders.find(x => x.id === req.params.id.toUpperCase());
  o ? res.json({ id: o.id, status: o.status, total: o.total, type: o.type }) : res.status(404).json({ error: 'No order found with that number.' });
});

// ---------- Admin API ----------
app.post('/api/login', (req, res) =>
  req.body.password === ADMIN_PASS ? res.json({ ok: true }) : res.status(401).json({ error: 'Wrong password.' }));

app.get('/api/admin/orders', admin, (req, res) => res.json(load().orders.slice().reverse()));

app.patch('/api/admin/orders/:id', admin, (req, res) => {
  const d = load(), o = d.orders.find(x => x.id === req.params.id);
  if (!o || !STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Invalid request.' });
  o.status = req.body.status; save(d); res.json(o);
});

app.post('/api/admin/products', admin, (req, res) => {
  const d = load(), b = req.body;
  if (!b.name || !(b.price >= 0)) return res.status(400).json({ error: 'Enter a name and price.' });
  const p = { id: Math.max(0, ...d.products.map(x => x.id)) + 1, name: b.name, category: b.category || 'Other',
    emoji: b.emoji || '🛒', price: +b.price, unit: b.unit || 'piece', inStock: true };
  d.products.push(p); save(d); res.json(p);
});

app.put('/api/admin/products/:id', admin, (req, res) => {
  const d = load(), p = d.products.find(x => x.id === +req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found.' });
  if (req.body.price !== undefined) p.price = +req.body.price;
  if (req.body.inStock !== undefined) p.inStock = !!req.body.inStock;
  save(d); res.json(p);
});

app.delete('/api/admin/products/:id', admin, (req, res) => {
  const d = load(); d.products = d.products.filter(x => x.id !== +req.params.id); save(d); res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Store: http://localhost:${PORT}   Admin: http://localhost:${PORT}/admin.html`));
