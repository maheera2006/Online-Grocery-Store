# Online Grocery Store (single vendor, many customers)

Zero-cost web app: Node.js + Express, JSON file database, plain HTML/CSS/JS.

## Run in VS Code
1. Install Node.js (nodejs.org, LTS version).
2. Open this folder in VS Code, then open the terminal (Ctrl + `).
3. `npm install`
4. `npm start`
5. Store: http://localhost:3000   Admin: http://localhost:3000/admin.html (password: `admin123`)

## Set up for your client
- Edit `data/db.json` > `config`: shopName, area, phone, whatsapp (with 91), upi, freeAbove, slabs (delivery charges by distance).
- Change the admin password: `ADMIN_PASS=mypassword npm start` (Windows PowerShell: `$env:ADMIN_PASS="mypassword"; npm start`).
- Clear demo orders: set `"orders": []` in `data/db.json`.

## Features
Customer: product list, categories, search, basket, pickup/delivery, delivery slabs, free-delivery threshold, UPI pay link, COD, WhatsApp order message, order tracking, share store, mobile friendly.
Admin: login, orders with one-tap status buttons (auto refresh), message customer on WhatsApp, edit price, stock toggle, add/delete products.

## Structure
server.js (API) | data/db.json (data) | public/ (index.html, admin.html, app.js, admin.js, style.css)

## Go live for free (later)
Push to GitHub and deploy on Render's free web service. Note that free hosts may reset the JSON file; use a free Firebase/Supabase database for permanent storage.

## Not included in this version
SMS OTP login, automatic payment gateway, Tamil toggle, reviews, coupons. Mention these as future scope.
