# Online Grocery Store

A zero-cost web application that lets a local grocery store take orders online. One vendor (the store owner) manages the products and orders, and many customers can browse and buy.

## Problem statement
A local grocery store is known only to nearby residents and sells only through walk-in customers. It cannot reach new customers, take remote orders, or manage frequently changing prices and stock digitally. This project gives the store a simple online shop for pickup or delivery, with UPI and cash payments, and an easy admin panel for the owner.

## Features
**Customer**
- Product list with categories and search
- Basket with plus and minus buttons
- Pickup or home delivery, with delivery charge by distance slab and free delivery above a set amount
- UPI payment details and pay button, or cash on delivery
- Order sent to the store on WhatsApp
- Order tracking by order number
- Call, WhatsApp and share-store buttons
- Mobile-friendly layout

**Owner (admin)**
- Password login
- Orders list that refreshes automatically, with one-tap status buttons
- Message the customer on WhatsApp
- Edit prices, mark items out of stock, add and delete products

## Tech stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: JSON file (`data/db.json`)
- Payments: UPI link and cash on delivery (no paid gateway)
- Cost: ₹0

## How to run
1. Install Node.js (LTS) from nodejs.org.
2. Clone the project and open the folder:
```
   git clone https://github.com/maheera2006/Online-Grocery-Store.git
   cd Online-Grocery-Store
```
3. Install and start:
```
   npm install
   npm start
```
4. Open the store at http://localhost:3000
5. Open the admin panel at http://localhost:3000/admin.html (default password: `admin123`)

## Set up for a real store
- Edit `data/db.json` under `config`: `shopName`, `area`, `phone`, `whatsapp` (with 91), `upi`, `freeAbove` and `slabs`.
- Change the admin password. In PowerShell: `$env:ADMIN_PASS="mypassword"; npm start`
- Clear demo orders by setting `"orders": []` in `data/db.json`.

## Project structure
```
server.js        API and server
data/db.json     products, orders and store settings
public/          index.html, admin.html, app.js, admin.js, style.css
```

## Limitations and future scope
- UPI payments are confirmed manually by the owner (no payment gateway yet)
- No SMS OTP login, Tamil language toggle, reviews or coupons
- JSON file storage suits a small store; a database such as Firebase or MongoDB can replace it
- Future: custom domain, automatic payments, loyalty program, mobile app

## Author
Mariyam Maheera R
