import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { html } from 'hono/html';
import type { Env } from './types';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { paymentRouter } from './routes/payment';
import { IP17_BASE64, IP18_BASE64 } from './images';

const app = new Hono<Env>();

app.use('*', cors());

// Hàm chuyển đổi data URL sang Uint8Array
function base64ToUint8Array(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(',');
  const raw = parts.length > 1 ? parts[1] : parts[0];
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Routes phân phối ảnh tĩnh
app.get('/ip17prm.webp', (c) => {
  return c.body(base64ToUint8Array(IP17_BASE64), 200, { 'Content-Type': 'image/webp' });
});
app.get('/img/ip17prm.webp', (c) => {
  return c.body(base64ToUint8Array(IP17_BASE64), 200, { 'Content-Type': 'image/webp' });
});
app.get('/ip18prm.webp', (c) => {
  return c.body(base64ToUint8Array(IP18_BASE64), 200, { 'Content-Type': 'image/webp' });
});
app.get('/img/ip18prm.webp', (c) => {
  return c.body(base64ToUint8Array(IP18_BASE64), 200, { 'Content-Type': 'image/webp' });
});

// Route favicon tránh lỗi 404
app.get('/favicon.ico', (c) => {
  return c.text('', 204);
});

// Proxy API cho Casso Address Kit (giải quyết triệt để lỗi CORS trên trình duyệt)
app.get('/api/address/provinces', async (c) => {
  try {
    const res = await fetch('https://production.cas.so/address-kit/2025-07-01/provinces');
    if (!res.ok) {
      return c.json({ provinces: [] }, 200);
    }
    const data = await res.json();
    return c.json(data);
  } catch (err) {
    return c.json({ provinces: [] }, 200);
  }
});

app.get('/api/address/provinces/:code/communes', async (c) => {
  try {
    const code = c.req.param('code');
    const res = await fetch(`https://production.cas.so/address-kit/2025-07-01/provinces/${encodeURIComponent(code)}/communes`);
    if (!res.ok) {
      return c.json({ communes: [] }, 200);
    }
    const data = await res.json();
    return c.json(data);
  } catch (err) {
    return c.json({ communes: [] }, 200);
  }
});

// Giao diện Web Store Apple Store Demo
app.get('/', (c) => {
  return c.html(html`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Apple Store</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg-main: #000000;
          --bg-card: #161617;
          --bg-card-hover: #1d1d1f;
          --bg-glass: rgba(22, 22, 23, 0.85);
          --accent: #2997ff;
          --accent-hover: #147ce5;
          --accent-glow: rgba(41, 151, 255, 0.35);
          --text-main: #f5f5f7;
          --text-sub: #86868b;
          --border: #2d2d30;
          --danger: #ff453a;
          --success: #30d158;
        }

        /* Ẩn scrollbar trên toàn bộ phần tử và modal */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          -ms-overflow-style: none;  /* IE và Edge */
          scrollbar-width: none;     /* Firefox */
        }

        *::-webkit-scrollbar {
          display: none;             /* Chrome, Safari, Opera */
          width: 0px;
          height: 0px;
          background: transparent;
        }

        html, body {
          -ms-overflow-style: none;  /* IE và Edge */
          scrollbar-width: none;     /* Firefox */
        }

        html::-webkit-scrollbar, body::-webkit-scrollbar {
          display: none;             /* Chrome, Safari, Opera */
          width: 0px;
          height: 0px;
          background: transparent;
        }

        body {
          background-color: var(--bg-main);
          color: var(--text-main);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          background-image: 
            radial-gradient(circle at 50% 0%, rgba(41, 151, 255, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 90% 20%, rgba(142, 142, 147, 0.08) 0%, transparent 40%);
        }

        /* HEADER */
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--bg-glass);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0 24px;
        }

        .header-inner {
          max-width: 1200px;
          height: 64px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-decoration: none;
          color: var(--text-main);
        }

        .apple-icon {
          width: 24px;
          height: 24px;
          fill: currentColor;
        }

        .store-title {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.4px;
          background: linear-gradient(180deg, #ffffff 30%, #a1a1a6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Cart Icon Button */
        .cart-btn {
          position: relative;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-main);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          user-select: none;
        }

        .cart-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }

        .cart-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          background: var(--accent);
          color: white;
          font-size: 11px;
          font-weight: 700;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          box-shadow: 0 2px 8px rgba(41, 151, 255, 0.6);
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .cart-badge.bump {
          transform: scale(1.35);
        }

        /* Auth Button & State */
        .auth-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-auth-open {
          background: var(--accent);
          color: white;
          border: none;
          padding: 9px 18px;
          border-radius: 20px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px var(--accent-glow);
          user-select: none;
        }

        .btn-auth-open:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }

        .user-logged-box {
          display: none;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.06);
          padding: 5px 6px 5px 14px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-email-text {
          font-size: 13px;
          color: #e5e5ea;
          font-weight: 500;
          max-width: 170px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-logout {
          background: rgba(255, 69, 58, 0.18);
          color: #ff6961;
          border: 1px solid rgba(255, 69, 58, 0.35);
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-logout:hover {
          background: var(--danger);
          color: white;
        }

        /* MAIN CONTENT */
        .main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px 80px;
          flex: 1;
          width: 100%;
        }

        /* Hero Banner */
        .hero {
          text-align: center;
          margin-bottom: 50px;
        }

        .hero-tag {
          display: inline-block;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--accent);
          margin-bottom: 12px;
        }

        .hero-title {
          font-size: clamp(34px, 5vw, 54px);
          font-weight: 800;
          letter-spacing: -1.2px;
          line-height: 1.15;
          margin-bottom: 16px;
          background: linear-gradient(180deg, #ffffff 40%, #8e8e93 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-desc {
          font-size: clamp(16px, 2vw, 19px);
          color: var(--text-sub);
          max-width: 640px;
          margin: 0 auto;
          line-height: 1.5;
        }

        /* PRODUCT GRID */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 32px;
          margin-top: 20px;
        }

        .product-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 28px;
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease;
        }

        .product-card:hover {
          transform: translateY(-6px);
          background: var(--bg-card-hover);
          border-color: rgba(255, 255, 255, 0.22);
          box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.7);
        }

        .card-badge {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.08);
          color: #d1d1d6;
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 14px;
          margin-bottom: 20px;
        }

        .card-badge.highlight {
          background: rgba(41, 151, 255, 0.15);
          color: #70baff;
          border-color: rgba(41, 151, 255, 0.35);
        }

        .product-image-wrap {
          width: 100%;
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
          position: relative;
          cursor: pointer;
        }

        .product-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 15px 30px rgba(0,0,0,0.6));
          transition: transform 0.4s ease;
        }

        .product-card:hover .product-img {
          transform: scale(1.05);
        }

        .product-name {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.6px;
          margin-bottom: 8px;
          color: #ffffff;
        }

        .product-price {
          font-size: 22px;
          font-weight: 800;
          color: var(--accent);
          margin-bottom: 16px;
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .product-price small {
          font-size: 13px;
          color: var(--text-sub);
          font-weight: 500;
        }

        .product-desc {
          font-size: 14px;
          color: var(--text-sub);
          line-height: 1.6;
          margin-bottom: 24px;
          flex-grow: 1;
        }

        .features-list {
          list-style: none;
          margin-bottom: 28px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .features-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          color: #c7c7cc;
        }

        .features-list li svg {
          width: 16px;
          height: 16px;
          fill: var(--accent);
          flex-shrink: 0;
        }

        .btn-add-cart {
          background: #ffffff;
          color: #000000;
          border: none;
          padding: 14px 20px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s ease;
          width: 100%;
          user-select: none;
        }

        .btn-add-cart:hover {
          background: #e5e5ea;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 255, 255, 0.25);
        }

        .btn-add-cart:active {
          transform: translateY(0);
        }

        /* FOOTER */
        .footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 30px 24px;
          text-align: center;
          font-size: 13px;
          color: var(--text-sub);
        }

        /* MODAL COMMON */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 1000;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 20px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }

        .modal-overlay.active {
          display: flex !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }

        .modal-container {
          background: #1c1c1e;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.85);
          transform: scale(0.95);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-overlay.active .modal-container {
          transform: scale(1);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .modal-title {
          font-size: 19px;
          font-weight: 700;
          color: #ffffff;
        }

        .btn-close-modal {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #a1a1a6;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .btn-close-modal:hover {
          background: rgba(255, 255, 255, 0.25);
          color: #fff;
        }

        .modal-body {
          padding: 24px;
        }

        /* CART MODAL SPECIFICS */
        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 340px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .cart-item {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 14px 16px;
          border-radius: 16px;
        }

        .cart-item-img {
          width: 60px;
          height: 60px;
          object-fit: contain;
          flex-shrink: 0;
        }

        .cart-item-info {
          flex: 1;
          min-width: 0;
        }

        .cart-item-title {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
        }

        .cart-item-price {
          font-size: 13.5px;
          color: var(--accent);
          font-weight: 600;
        }

        .cart-qty-ctrl {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-qty {
          background: none;
          border: none;
          color: #fff;
          width: 28px;
          height: 28px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .btn-qty:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .cart-qty-val {
          width: 28px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
        }

        .btn-del-item {
          background: none;
          border: none;
          color: #86868b;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
        }

        .btn-del-item:hover {
          color: var(--danger);
        }

        .cart-empty-state {
          text-align: center;
          padding: 40px 20px;
        }

        .cart-empty-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          stroke: #48484a;
        }

        .cart-empty-title {
          font-size: 17px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #fff;
        }

        .cart-empty-desc {
          font-size: 13.5px;
          color: var(--text-sub);
        }

        .cart-summary {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: var(--text-sub);
          margin-bottom: 10px;
        }

        .summary-row.total {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px dashed rgba(255, 255, 255, 0.15);
        }

        .summary-row.total .total-amount {
          color: var(--accent);
          font-size: 20px;
        }

        .btn-checkout {
          width: 100%;
          background: var(--accent);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 20px;
          transition: all 0.25s ease;
          box-shadow: 0 6px 20px var(--accent-glow);
        }

        .btn-checkout:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }

        /* AUTH MODAL SPECIFICS */
        .auth-nav {
          display: flex;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 20px;
        }

        .auth-nav button {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-sub);
          padding: 8px 4px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .auth-nav button.active {
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #a1a1a6;
          margin-bottom: 6px;
        }

        .form-group input {
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 12px 14px;
          color: #ffffff;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--accent);
          background: rgba(255, 255, 255, 0.09);
        }

        .btn-submit-auth {
          width: 100%;
          background: var(--accent);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.25s ease;
        }

        .btn-submit-auth:hover {
          background: var(--accent-hover);
        }

        .auth-msg {
          margin-top: 14px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          display: none;
          line-height: 1.4;
          word-break: break-all;
        }

        .auth-msg.error {
          background: rgba(255, 69, 58, 0.15);
          color: #ff6961;
          border: 1px solid rgba(255, 69, 58, 0.3);
          display: block;
        }

        .auth-msg.success {
          background: rgba(48, 209, 88, 0.15);
          color: #32d74b;
          border: 1px solid rgba(48, 209, 88, 0.3);
          display: block;
        }

        .tab-panel {
          display: none;
        }

        .tab-panel.active {
          display: block;
        }

        .reset-divider {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px dashed rgba(255, 255, 255, 0.15);
        }

        /* TOAST NOTIFICATION */
        .toast-container {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }

        .toast {
          background: #2c2c2e;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 14px 20px;
          border-radius: 16px;
          font-size: 14px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: auto;
          max-width: 380px;
        }

        .toast.show {
          opacity: 1;
          transform: translateY(0);
        }

        .toast.success {
          border-left: 4px solid var(--success);
        }

        .toast.info {
          border-left: 4px solid var(--accent);
        }

        .toast.warning {
          border-left: 4px solid #ffd60a;
        }

        /* PAYMENT MODAL & METHODS */
        .payment-summary-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 16px 20px;
          margin-bottom: 20px;
        }

        .payment-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: var(--text-sub);
          margin-bottom: 8px;
        }

        .payment-summary-row:last-child {
          margin-bottom: 0;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          font-weight: 700;
          font-size: 16px;
        }

        .payment-summary-row .pay-total-amount {
          color: var(--accent);
          font-size: 20px;
          font-weight: 800;
        }

        .payment-title-label {
          font-size: 14px;
          font-weight: 600;
          color: #f5f5f7;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .payment-gateways-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 20px;
        }

        .payment-option-card {
          background: rgba(255, 255, 255, 0.04);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          position: relative;
          user-select: none;
        }

        .payment-option-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .payment-option-card.active.momo {
          border-color: #d82d8b;
          background: rgba(216, 45, 139, 0.12);
          box-shadow: 0 0 20px rgba(216, 45, 139, 0.25);
        }

        .payment-option-card.active.vnpay {
          border-color: #005baa;
          background: rgba(0, 91, 170, 0.12);
          box-shadow: 0 0 20px rgba(0, 91, 170, 0.25);
        }

        .payment-option-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin-bottom: 10px;
        }

        .gateway-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .gateway-badge.momo {
          background: #d82d8b;
          color: #ffffff;
        }

        .gateway-badge.vnpay {
          background: linear-gradient(135deg, #005baa, #ed1c24);
          color: #ffffff;
        }

        .radio-check-circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .payment-option-card.active .radio-check-circle {
          background: #fff;
          border-color: #fff;
        }

        .payment-option-card.active.momo .radio-check-circle {
          background: #d82d8b;
          border-color: #d82d8b;
        }

        .payment-option-card.active.vnpay .radio-check-circle {
          background: #005baa;
          border-color: #005baa;
        }

        .radio-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #fff;
          display: none;
        }

        .payment-option-card.active .radio-dot {
          display: block;
        }

        .gateway-name {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }

        .gateway-desc {
          font-size: 12px;
          color: var(--text-sub);
          line-height: 1.4;
        }

        .gateway-url-hint {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 8px;
          word-break: break-all;
        }

        /* QR SIMULATION BOX */
        .qr-simulator-wrap {
          text-align: center;
          padding: 10px 0;
        }

        .qr-container {
          display: inline-block;
          background: #ffffff;
          padding: 16px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
          margin-bottom: 16px;
          position: relative;
        }

        .qr-scan-line {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          height: 2px;
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent);
          animation: qrScan 2.2s ease-in-out infinite alternate;
        }

        @keyframes qrScan {
          0% { top: 16px; }
          100% { top: 180px; }
        }

        .qr-code-svg {
          width: 170px;
          height: 170px;
          display: block;
        }

        .order-info-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .countdown-timer {
          font-size: 13px;
          color: #ffd60a;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .btn-confirm-pay {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-confirm-pay.momo {
          background: #d82d8b;
          color: #fff;
        }
        .btn-confirm-pay.momo:hover {
          background: #b52273;
          box-shadow: 0 6px 20px rgba(216, 45, 139, 0.4);
        }

        .btn-confirm-pay.vnpay {
          background: #005baa;
          color: #fff;
        }
        .btn-confirm-pay.vnpay:hover {
          background: #004582;
          box-shadow: 0 6px 20px rgba(0, 91, 170, 0.4);
        }

        .btn-pay-back {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--text-sub);
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13.5px;
          cursor: pointer;
          margin-top: 10px;
          width: 100%;
          transition: all 0.2s ease;
        }
        .btn-pay-back:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        /* ORDER SUCCESS RECEIPT */
        .success-receipt-card {
          background: rgba(48, 209, 88, 0.08);
          border: 1px solid rgba(48, 209, 88, 0.25);
          border-radius: 18px;
          padding: 24px;
          text-align: center;
        }

        .success-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(48, 209, 88, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: var(--success);
        }

        .receipt-detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 13.5px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .receipt-detail-row:last-child {
          border-bottom: none;
        }
        .receipt-detail-row span:first-child {
          color: var(--text-sub);
        }
        .receipt-detail-row span:last-child {
          color: #fff;
          font-weight: 600;
        }

        /* CASSO ADDRESS KIT SELECTS */
        .select-address {
          width: 100%;
          background: #1c1c1e;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 12px 14px;
          color: #ffffff;
          font-size: 14px;
          transition: border-color 0.2s ease, opacity 0.2s ease;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 38px;
          cursor: pointer;
        }

        .select-address:focus {
          outline: none;
          border-color: var(--accent);
          background-color: #242426;
        }

        .select-address:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          background-color: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
        }

        .select-address option {
          background: #1c1c1e;
          color: #ffffff;
        }

        .address-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* ATM TEST CARD GUIDELINE BOX */
        .test-card-box {
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }

        .test-card-box.vnpay {
          background: rgba(0, 91, 170, 0.1);
          border: 1px solid rgba(0, 91, 170, 0.35);
        }

        .test-card-box.momo {
          background: rgba(216, 45, 139, 0.1);
          border: 1px solid rgba(216, 45, 139, 0.35);
        }

        .test-card-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
        }

        .test-card-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 14px;
          font-size: 12.5px;
        }

        .test-card-row {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .test-card-row.full {
          grid-column: 1 / -1;
          background: rgba(0, 0, 0, 0.25);
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px dashed rgba(255, 255, 255, 0.15);
        }

        .test-card-label {
          color: var(--text-sub);
          font-size: 11.5px;
        }

        .test-card-val-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .test-card-val {
          font-family: 'SF Mono', Consolas, Monaco, monospace;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .btn-copy-val {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
        }

        .btn-copy-val:hover {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .loading-spinner-inline {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Order Status Round Button (Matching Cart Button) */
        .order-status-btn {
          position: relative;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #f5f5f7;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          user-select: none;
        }

        .order-status-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
          color: #ff9f0a;
        }

        .order-status-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ff9f0a;
          border: 2px solid #000000;
          box-shadow: 0 0 10px #ff9f0a;
          animation: pulseStatusDot 1.8s infinite ease-in-out;
        }

        .order-status-dot.success {
          background: var(--success);
          box-shadow: 0 0 10px var(--success);
        }

        @keyframes pulseStatusDot {
          0% { transform: scale(0.95); opacity: 0.85; }
          50% { transform: scale(1.25); opacity: 1; box-shadow: 0 0 12px #ff9f0a; }
          100% { transform: scale(0.95); opacity: 0.85; }
        }

        /* Order History Modal & List Styles */
        .order-history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 520px;
          overflow-y: auto;
          padding-right: 4px;
        }

        /* Empty State */
        .order-history-empty {
          text-align: center;
          padding: 44px 20px 36px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .empty-icon-circle {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed rgba(255, 255, 255, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #86868b;
          margin-bottom: 16px;
        }

        .order-history-empty h4 {
          font-size: 17px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 8px 0;
        }

        .order-history-empty p {
          font-size: 13px;
          color: var(--text-sub);
          max-width: 330px;
          margin: 0 0 18px 0;
          line-height: 1.5;
        }

        /* Order Card */
        .order-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          overflow: hidden;
          transition: all 0.25s ease;
        }

        .order-card:hover {
          border-color: rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.055);
        }

        .order-card.processing-order {
          border-color: rgba(255, 159, 10, 0.28);
        }

        .order-card-header {
          padding: 16px 18px;
          cursor: pointer;
          user-select: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .order-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .order-card-id-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .order-card-id {
          font-weight: 700;
          color: var(--accent);
          letter-spacing: 0.3px;
        }

        .order-card-date {
          color: var(--text-sub);
          font-size: 12px;
        }

        .order-card-badges {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .order-badge-gateway {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 12px;
          letter-spacing: 0.3px;
        }

        .order-badge-gateway.vnpay {
          background: rgba(0, 113, 227, 0.16);
          color: #2997ff;
          border: 1px solid rgba(0, 113, 227, 0.35);
        }

        .order-badge-gateway.momo {
          background: rgba(224, 38, 120, 0.16);
          color: #ff3b99;
          border: 1px solid rgba(224, 38, 120, 0.35);
        }

        .order-badge-status {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .order-badge-status.processing {
          background: rgba(255, 159, 10, 0.16);
          color: #ff9f0a;
          border: 1px solid rgba(255, 159, 10, 0.4);
        }

        .order-badge-status.success {
          background: rgba(48, 209, 88, 0.16);
          color: var(--success);
          border: 1px solid rgba(48, 209, 88, 0.4);
        }

        .order-card-items-summary {
          display: flex;
          flex-direction: column;
          gap: 5px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .order-item-summary-line {
          font-size: 13px;
          font-weight: 500;
          color: #f5f5f7;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .order-item-summary-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding-right: 12px;
        }

        .order-item-summary-qty {
          color: var(--text-sub);
          font-size: 12px;
          font-weight: normal;
          white-space: nowrap;
        }

        .order-card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 10px;
        }

        .order-total-label {
          font-size: 12.5px;
          color: var(--text-sub);
        }

        .order-total-val {
          font-size: 15px;
          font-weight: 700;
          color: #ff9f0a;
        }

        .order-total-val.success {
          color: var(--success);
        }

        .order-expand-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          color: var(--accent);
          background: rgba(0, 113, 227, 0.1);
          border: 1px solid rgba(0, 113, 227, 0.25);
          padding: 4px 10px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .order-card:hover .order-expand-btn {
          background: rgba(0, 113, 227, 0.18);
          border-color: rgba(0, 113, 227, 0.4);
        }

        .order-chevron {
          transition: transform 0.25s ease;
        }

        .order-card.expanded .order-chevron {
          transform: rotate(180deg);
        }

        .order-card-details-panel {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(0, 0, 0, 0.28);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .order-card.expanded .order-card-details-panel {
          max-height: 650px;
        }

        .order-details-inner {
          padding: 16px 18px;
        }

        .order-timeline-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-weight: 700;
          color: var(--text-sub);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Compact Stepper */
        .order-stepper-compact {
          display: flex;
          flex-direction: column;
          position: relative;
          margin-bottom: 16px;
          padding-left: 6px;
        }

        .order-stepper-compact .stepper-step {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          position: relative;
          padding-bottom: 18px;
        }

        .order-stepper-compact .stepper-step:last-child {
          padding-bottom: 0;
        }

        .order-stepper-compact .stepper-step::before {
          content: '';
          position: absolute;
          left: 14px;
          top: 30px;
          bottom: 0;
          width: 2px;
          background: rgba(255, 255, 255, 0.1);
        }

        .order-stepper-compact .stepper-step:last-child::before {
          display: none;
        }

        .order-stepper-compact .stepper-step.step-done::before {
          background: var(--success);
        }

        .order-stepper-compact .step-icon-wrap {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          z-index: 1;
        }

        .order-stepper-compact .stepper-step.step-done .step-icon-wrap {
          background: rgba(48, 209, 88, 0.18);
          color: var(--success);
          border: 1px solid rgba(48, 209, 88, 0.4);
        }

        .order-stepper-compact .stepper-step.step-active .step-icon-wrap {
          background: rgba(255, 159, 10, 0.2);
          color: #ff9f0a;
          border: 1px solid rgba(255, 159, 10, 0.5);
          box-shadow: 0 0 12px rgba(255, 159, 10, 0.3);
        }

        .order-stepper-compact .stepper-step.step-pending .step-icon-wrap {
          background: rgba(255, 255, 255, 0.05);
          color: #636366;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .order-stepper-compact .step-info {
          flex: 1;
          padding-top: 4px;
        }

        .order-stepper-compact .step-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .order-stepper-compact .stepper-step.step-active .step-name {
          color: #ff9f0a;
        }

        .order-stepper-compact .stepper-step.step-pending .step-name {
          color: #8e8e93;
        }

        .order-stepper-compact .step-sub {
          font-size: 11.5px;
          color: var(--text-sub);
        }

        .order-info-subbox {
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 12.5px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .order-subbox-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 600px) {
          .address-grid-2col {
            grid-template-columns: 1fr;
          }
          .test-card-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .header-inner {
            height: 58px;
          }
          .user-email-text {
            max-width: 100px;
          }
          .products-grid {
            grid-template-columns: 1fr;
          }
          .product-card {
            padding: 24px 20px;
          }
          .product-image-wrap {
            height: 240px;
          }
          .toast-container {
            left: 20px;
            right: 20px;
            bottom: 20px;
          }
          .toast {
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <!-- HEADER -->
      <header class="header">
        <div class="header-inner">
          <a class="logo-wrap" href="/">
            <svg class="apple-icon" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-7.48-11.47-13.41-24.36-17.78-38.67-4.37-14.3-6.55-27.4-6.55-39.31 0-16.14 4.18-29.47 12.54-40 8.35-10.53 18.83-15.89 31.43-16.08 4.79 0 10.22 1.25 16.3 3.75 6.07 2.5 10.28 3.82 12.63 3.96 2.01-.14 6.33-1.49 12.95-4.06 6.63-2.58 12.18-3.72 16.66-3.44 14.34 1.05 25.54 6.74 33.62 17.07-12.82 7.76-19.06 18.42-18.72 31.98.34 10.66 4.41 19.53 12.22 26.61 7.82 7.08 17.15 11.16 28 12.24-2.14 6.34-4.71 12.8-7.72 19.39zM119.22 31.81c0-7.39 2.66-14.28 7.99-20.67 5.33-6.39 12.06-10.42 20.19-12.11.1 1.09.15 2.18.15 3.28 0 7.39-2.73 14.52-8.2 21.39-5.47 6.87-12.3 11-20.48 12.4-0.1-1.4-.2-2.83-.2-4.29z"/>
            </svg>
            <span class="store-title">Mêo Mêo</span>
          </a>

          <div class="header-actions">
            <!-- User Status -->
            <div id="authContainer" class="auth-container">
              <button id="btnOpenAuth" class="btn-auth-open" type="button" onclick="openAuthModal('login')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Đăng nhập / Đăng ký</span>
              </button>

              <div id="userLoggedBox" class="user-logged-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span id="userEmailSpan" class="user-email-text">user@example.com</span>
                <button class="btn-logout" type="button" onclick="handleLogout()">Đăng xuất</button>
              </div>
            </div>

            <!-- Cart Trigger -->
            <button class="cart-btn" id="btnOpenCart" type="button" onclick="openCartModal()" aria-label="Xem giỏ hàng">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span id="cartCountBadge" class="cart-badge">0</span>
            </button>

            <!-- Nút Lịch sử & Trạng thái đơn hàng (Nút tròn icon đồng bộ với Giỏ hàng) -->
            <button class="order-status-btn" id="btnOpenOrderStatus" type="button" onclick="openOrderStatusModal()" aria-label="Trạng thái đơn hàng" title="Trạng thái đơn hàng">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- MAIN PAGE -->
      <main class="main-container">
        <!-- Hero Section -->
        <section class="hero">
          <span class="hero-tag">Thế Hệ Mới Đột Phá</span>
          <h1 class="hero-title">Đỉnh Cao Sức Mạnh. Thiết Kế Titan.</h1>
          <p class="hero-desc">Trải nghiệm những chiếc iPhone mạnh mẽ và tinh tế nhất từ trước đến nay, sẵn sàng nâng tầm mọi giới hạn sáng tạo.</p>
        </section>

        <!-- Product Grid -->
        <section class="products-grid">
          <!-- BOX 1: iPhone 17 Pro Max -->
          <div class="product-card" id="card-ip17">
            <span class="card-badge highlight">Mới Ra Mắt</span>
            <div class="product-image-wrap" onclick="addToCart('ip17', 'iPhone 17 Pro Max', 34990000, '/ip17prm.webp')">
              <img 
                src="/ip17prm.webp" 
                alt="iPhone 17 Pro Max" 
                class="product-img"
              />
            </div>
            <h2 class="product-name">iPhone 17 Pro Max</h2>
            <div class="product-price">
              34.990.000 ₫
              <small>Chính hãng VN/A</small>
            </div>
            <p class="product-desc">
              Chip A19 Pro, Camera tiềm vọng siêu nét, Thiết kế Titan sang trọng.
            </p>
            <ul class="features-list">
              <li>
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                Chipset Apple A19 Pro tiến trình 2nm siêu tốc độ
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                Hệ thống camera tiềm vọng zoom quang học siêu nét
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                Khung viền Titanium nguyên khối chuẩn hàng không
              </li>
            </ul>
            <button class="btn-add-cart" type="button" onclick="addToCart('ip17', 'iPhone 17 Pro Max', 34990000, '/ip17prm.webp')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Thêm vào giỏ hàng
            </button>
          </div>

          <!-- BOX 2: iPhone 18 Pro Max -->
          <div class="product-card" id="card-ip18">
            <span class="card-badge">Mới Ra Mắt</span>
            <div class="product-image-wrap" onclick="addToCart('ip18', 'iPhone 18 Pro Max', 42990000, '/ip18prm.webp')">
              <img 
                src="/ip18prm.webp" 
                alt="iPhone 18 Pro Max" 
                class="product-img"
              />
            </div>
            <h2 class="product-name">iPhone 18 Pro Max</h2>
            <div class="product-price">
              42.990.000 ₫
              <small>Chính hãng VN/A</small>
            </div>
            <p class="product-desc">
              Chip A20 Bionic thế hệ mới, Thiết kế siêu mỏng nhẹ, Pin nâng cấp vượt trội.
            </p>
            <ul class="features-list">
              <li>
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                Chip A20 Bionic thế hệ mới bứt phá giới hạn AI cục bộ
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                Thiết kế Ultra-Slim không viền siêu mỏng nhẹ
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                Dung lượng pin đột phá cho trải nghiệm liên tục 38 giờ
              </li>
            </ul>
            <button class="btn-add-cart" type="button" onclick="addToCart('ip18', 'iPhone 18 Pro Max', 42990000, '/ip18prm.webp')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Thêm vào giỏ hàng
            </button>
          </div>
        </section>
      </main>

      <!-- FOOTER -->
      <footer class="footer">
        <p>© 2026 MEO MEO!!!!</p>
      </footer>

      <!-- MODAL GIỎ HÀNG -->
      <div id="cartModal" class="modal-overlay" onclick="handleBackdropClick(event, 'cartModal')">
        <div class="modal-container" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Giỏ hàng</h3>
            <button class="btn-close-modal" type="button" onclick="closeCartModal()">✕</button>
          </div>
          <div class="modal-body">
            <!-- Empty state -->
            <div id="cartEmpty" class="cart-empty-state" style="display: none;">
              <svg class="cart-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <h4 class="cart-empty-title">Giỏ hàng đang trống</h4>
            </div>

            <!-- Items list -->
            <div id="cartItemsList" class="cart-items-list"></div>

            <!-- Summary & Checkout -->
            <div id="cartSummaryBox" class="cart-summary">
              <div class="summary-row">
                <span>Tạm tính</span>
                <span id="subtotalText">0 ₫</span>
              </div>
              <div class="summary-row">
                <span>Vận chuyển (Apple Express)</span>
                <span style="color: var(--success); font-weight: 600;">Miễn phí</span>
              </div>
              <div class="summary-row total">
                <span>Tổng tiền thanh toán</span>
                <span id="totalAmountText" class="total-amount">0 ₫</span>
              </div>

              <button class="btn-checkout" type="button" onclick="handleCheckout()">Thanh toán ngay</button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL AUTH (ĐĂNG NHẬP / ĐĂNG KÝ / QUÊN MẬT KHẨU) -->
      <div id="authModal" class="modal-overlay" onclick="handleBackdropClick(event, 'authModal')">
        <div class="modal-container" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title" id="authModalTitle">Tài Khoản Apple</h3>
            <button class="btn-close-modal" type="button" onclick="closeAuthModal()">✕</button>
          </div>
          <div class="modal-body">
            <!-- Auth Navigation Tabs -->
            <div class="auth-nav">
              <button id="tabBtnLogin" class="active" type="button" onclick="switchAuthTab('login')">Đăng nhập</button>
              <button id="tabBtnRegister" type="button" onclick="switchAuthTab('register')">Đăng ký</button>
              <button id="tabBtnForgot" type="button" onclick="switchAuthTab('forgot')">Quên mật khẩu</button>
            </div>

            <div id="authMsgBox" class="auth-msg"></div>

            <!-- TAB: LOGIN -->
            <div id="tabPanelLogin" class="tab-panel active">
              <div class="form-group">
                <label>Email tài khoản</label>
                <input type="email" id="loginEmail" placeholder="name@example.com" />
              </div>
              <div class="form-group">
                <label>Mật khẩu</label>
                <input type="password" id="loginPassword" placeholder="••••••••" />
              </div>
              <button class="btn-submit-auth" type="button" onclick="submitLogin()">Đăng nhập</button>
            </div>

            <!-- TAB: REGISTER -->
            <div id="tabPanelRegister" class="tab-panel">
              <div class="form-group">
                <label>Email đăng ký</label>
                <input type="email" id="regEmail" placeholder="name@example.com" />
              </div>
              <div class="form-group">
                <label>Mật khẩu (tối thiểu 6 ký tự)</label>
                <input type="password" id="regPassword" placeholder="••••••••" />
              </div>
              <button class="btn-submit-auth" type="button" onclick="submitRegister()">Tạo tài khoản</button>
            </div>

            <!-- TAB: FORGOT PASSWORD -->
            <div id="tabPanelForgot" class="tab-panel">
              <div class="form-group">
                <label>Nhập Email để nhận mã khôi phục</label>
                <input type="email" id="forgotEmail" placeholder="name@example.com" />
              </div>
              <button class="btn-submit-auth" type="button" onclick="submitForgot()">Gửi mã khôi phục</button>

              <div class="reset-divider">
                <p style="font-size: 13px; font-weight: 700; margin-bottom: 12px; color: #fff;">Đổi mật khẩu mới:</p>
                <div class="form-group">
                  <label>Mã khôi phục</label>
                  <input type="text" id="resetToken" placeholder="Dán mã khôi phục vào đây" />
                </div>
                <div class="form-group">
                  <label>Mật khẩu mới</label>
                  <input type="password" id="newPassword" placeholder="Mật khẩu mới ít nhất 6 ký tự" />
                </div>
                <button class="btn-submit-auth" style="background: #3a3a3c;" type="button" onclick="submitResetPass()">Xác nhận đổi mật khẩu</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL CHỌN THANH TOÁN (MOMO / VNPAY) -->
      <div id="paymentModal" class="modal-overlay" onclick="handleBackdropClick(event, 'paymentModal')">
        <div class="modal-container" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title" id="paymentModalTitle">Thanh Toán Đơn Hàng</h3>
            <button class="btn-close-modal" type="button" onclick="closePaymentModal()">✕</button>
          </div>
          <div class="modal-body">
            <!-- BƯỚC 1: CHỌN PHƯƠNG THỨC THANH TOÁN -->
            <div id="payStepSelect">
              <div class="payment-summary-card">
                <div class="payment-summary-row">
                  <span>Khách hàng</span>
                  <span id="payUserEmail" style="color: #fff; font-weight: 600;">user@example.com</span>
                </div>
                <div class="payment-summary-row">
                  <span>Số lượng sản phẩm</span>
                  <span id="payTotalQty">0 món</span>
                </div>
                <div class="payment-summary-row">
                  <span>Tổng tiền thanh toán</span>
                  <span id="payGrandTotal" class="pay-total-amount">0 ₫</span>
                </div>
              </div>

              <div class="payment-title-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                Chọn cổng thanh toán trực tuyến:
              </div>

              <div class="payment-gateways-grid">
                <!-- CỔNG VNPAY -->
                <div id="cardGatewayVNPAY" class="payment-option-card vnpay active" onclick="selectPaymentMethod('vnpay')">
                  <div class="payment-option-header">
                    <span class="gateway-badge vnpay">VNPAY</span>
                    <div class="radio-check-circle"><div class="radio-dot"></div></div>
                  </div>
                </div>

                <!-- VÍ MOMO -->
                <div id="cardGatewayMoMo" class="payment-option-card momo" onclick="selectPaymentMethod('momo')">
                  <div class="payment-option-header">
                    <span class="gateway-badge momo">MoMo</span>
                    <div class="radio-check-circle"><div class="radio-dot"></div></div>
                  </div>
                </div>
              </div>

              <div class="payment-address-group" style="margin-bottom: 16px;">
                <div class="payment-title-label" style="margin-top: 4px; margin-bottom: 12px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  Địa chỉ nhận:
                </div>

                <div class="address-grid-2col">
                  <!-- Dropdown 1: Tỉnh / Thành phố -->
                  <div class="form-group" style="margin-bottom: 12px;">
                    <label for="addressProvince">Tỉnh / Thành phố <span style="color: var(--danger); font-weight: 700;">*</span></label>
                    <select id="addressProvince" class="select-address" onchange="onProvinceChange()">
                      <option value="">-- Chọn Tỉnh / Thành phố --</option>
                    </select>
                  </div>

                  <!-- Dropdown 2: Xã / Phường / Thị trấn -->
                  <div class="form-group" style="margin-bottom: 12px;">
                    <label for="addressCommune">Xã / Phường / Thị trấn <span style="color: var(--danger); font-weight: 700;">*</span></label>
                    <select id="addressCommune" class="select-address" disabled>
                      <option value="">-- Chọn Xã / Phường --</option>
                    </select>
                  </div>
                </div>

                <!-- Input Text: Số nhà, tên đường -->
                <div class="form-group" style="margin-bottom: 0;">
                  <label for="addressStreet">Số nhà, tên đường / xóm / thôn (tùy chọn)</label>
                  <input type="text" id="addressStreet" placeholder="Ví dụ: Số 123 Đường Cầu Giấy" />
                </div>
              </div>

              <!-- THẺ TEST ATM NỘI ĐỊA GUIDELINE -->
              <div id="testCardBox" class="test-card-box vnpay">
                <div class="test-card-title">
                  <span style="display: flex; align-items: center; gap: 6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                    <span id="testCardHeading">Thông tin thẻ test, hãy copy ra notepad trước nhé!</span>
                  </span>
                  <span style="font-size: 11px; background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 10px;">Thẻ Test</span>
                </div>
                <div class="test-card-grid">
                  <div class="test-card-row">
                    <span class="test-card-label">Ngân hàng</span>
                    <span id="testCardBank" class="test-card-val">NCB</span>
                  </div>
                  <div class="test-card-row">
                    <span class="test-card-label">Tên chủ thẻ</span>
                    <span id="testCardHolder" class="test-card-val">NGUYEN VAN A</span>
                  </div>
                  <div class="test-card-row full">
                    <span class="test-card-label">Số thẻ ATM </span>
                    <div class="test-card-val-wrap">
                      <span id="testCardNum" class="test-card-val" style="color: #ffd60a; font-size: 13.5px;">9704198526191432198</span>
                      <button class="btn-copy-val" type="button" onclick="copyCardNumber()">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        Sao chép
                      </button>
                    </div>
                  </div>
                  <div class="test-card-row">
                    <span class="test-card-label">Ngày phát hành</span>
                    <span id="testCardDate" class="test-card-val">07/15</span>
                  </div>
                  <div class="test-card-row">
                    <span class="test-card-label">Mã xác thực OTP</span>
                    <span id="testCardOtp" class="test-card-val" style="color: var(--success);">123456</span>
                  </div>
                </div>
              </div>

              <button id="btnProceedPay" class="btn-confirm-pay vnpay" type="button" onclick="proceedToPaymentStep()">
                <span>Thanh toán</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

            <!-- BƯỚC 2: GIẢ LẬP CỔNG / QUÉT MÃ QR -->
            <div id="payStepQR" style="display: none;">
              <div class="qr-simulator-wrap">
                <div class="order-info-badge">
                  <span>Mã đơn: <strong id="qrOrderCode" style="color: var(--accent);">APL_84920</strong></span>
                  <span>•</span>
                  <span>Số tiền: <strong id="qrAmount" style="color: var(--success);">0 ₫</strong></span>
                </div>

                <div class="qr-container">
                  <div class="qr-scan-line"></div>
                  <!-- SVG Mock QR Code -->
                  <svg class="qr-code-svg" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="#ffffff" />
                    <rect x="10" y="10" width="24" height="24" fill="#000" />
                    <rect x="14" y="14" width="16" height="16" fill="#fff" />
                    <rect x="18" y="18" width="8" height="8" fill="#000" />
                    <rect x="66" y="10" width="24" height="24" fill="#000" />
                    <rect x="70" y="14" width="16" height="16" fill="#fff" />
                    <rect x="74" y="18" width="8" height="8" fill="#000" />
                    <rect x="10" y="66" width="24" height="24" fill="#000" />
                    <rect x="14" y="70" width="16" height="16" fill="#fff" />
                    <rect x="18" y="74" width="8" height="8" fill="#000" />
                    <rect x="38" y="10" width="6" height="6" fill="#000" />
                    <rect x="48" y="10" width="6" height="6" fill="#000" />
                    <rect x="38" y="20" width="6" height="6" fill="#000" />
                    <rect x="52" y="24" width="8" height="6" fill="#000" />
                    <rect x="40" y="34" width="8" height="8" fill="#000" />
                    <rect x="10" y="44" width="6" height="6" fill="#000" />
                    <rect x="22" y="44" width="6" height="6" fill="#000" />
                    <rect x="34" y="44" width="12" height="6" fill="#000" />
                    <rect x="52" y="40" width="6" height="12" fill="#000" />
                    <rect x="66" y="38" width="8" height="8" fill="#000" />
                    <rect x="80" y="38" width="10" height="6" fill="#000" />
                    <rect x="66" y="52" width="6" height="14" fill="#000" />
                    <rect x="78" y="50" width="12" height="6" fill="#000" />
                    <rect x="40" y="58" width="8" height="8" fill="#000" />
                    <rect x="54" y="58" width="6" height="12" fill="#000" />
                    <rect x="38" y="72" width="12" height="6" fill="#000" />
                    <rect x="54" y="76" width="8" height="8" fill="#000" />
                    <rect x="68" y="72" width="6" height="18" fill="#000" />
                    <rect x="78" y="68" width="12" height="6" fill="#000" />
                    <rect x="78" y="80" width="12" height="10" fill="#000" />
                  </svg>
                </div>

                <p id="qrInstructionText" style="font-size: 13.5px; color: var(--text-sub); margin-bottom: 8px;">
                  Quét mã QR bằng ứng dụng ngân hàng hoặc VNPAY để thanh toán
                </p>
                <div class="countdown-timer">⏱️ Mã giao dịch hết hạn sau: <span id="payTimerVal">14:59</span></div>

                <button id="btnSimulateSuccess" class="btn-confirm-pay vnpay" type="button" onclick="confirmSimulatedPayment()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Xác nhận thanh toán thành công (Sandbox)</span>
                </button>

                <button class="btn-pay-back" type="button" onclick="backToMethodSelect()">
                  ← Chọn phương thức khác
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL KẾT QUẢ ĐƠN HÀNG (RECEIPT) -->
      <div id="orderSuccessModal" class="modal-overlay" onclick="handleBackdropClick(event, 'orderSuccessModal')">
        <div class="modal-container" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Hóa Đơn Đặt Hàng</h3>
            <button class="btn-close-modal" type="button" onclick="closeOrderSuccessModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="success-receipt-card">
              <div class="success-icon-wrap">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h3 style="color: #fff; font-size: 20px; font-weight: 800; margin-bottom: 6px;">Thanh Toán Thành Công!</h3>
              <p style="color: var(--text-sub); font-size: 13.5px; margin-bottom: 20px;">Đơn hàng của bạn đã được thanh toán thành công qua cổng Sandbox.</p>

              <div class="receipt-detail-row">
                <span>Mã đơn hàng:</span>
                <span id="receiptOrderCode" style="color: var(--accent);">APL_12345</span>
              </div>
              <div class="receipt-detail-row">
                <span>Phương thức thanh toán:</span>
                <span id="receiptGateway">VNPAY Sandbox</span>
              </div>
              <div class="receipt-detail-row">
                <span>Số tiền thanh toán:</span>
                <span id="receiptAmount" style="color: var(--success); font-weight: 700;">0 ₫</span>
              </div>
              <div class="receipt-detail-row">
                <span>Email tài khoản:</span>
                <span id="receiptEmail">user@example.com</span>
              </div>
              <div class="receipt-detail-row">
                <span>Địa chỉ giao nhận:</span>
                <span id="receiptAddress">Hà Nội, Việt Nam</span>
              </div>
              <div class="receipt-detail-row">
                <span>Trạng thái giao dịch:</span>
                <span style="color: var(--success);"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--success); margin-right: 6px;"></span>Đã thanh toán (Hoàn tất)</span>
              </div>
            </div>

            <button class="btn-submit-auth" style="margin-top: 20px; background: var(--accent);" type="button" onclick="closeOrderSuccessModal()">
              Hoàn tất & Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL LỊCH SỬ & TRẠNG THÁI TẤT CẢ ĐƠN HÀNG (ORDER HISTORY) -->
      <div id="orderStatusModal" class="modal-overlay" onclick="handleBackdropClick(event, 'orderStatusModal')">
        <div class="modal-container" style="max-width: 580px; max-height: 88vh; display: flex; flex-direction: column;" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div>
                  <h3 class="modal-title" style="font-size: 17.5px; margin-bottom: 2px;">Trạng thái đơn hàng</h3>
                  <span id="modalOrderCountSub" style="font-size: 12.5px; color: var(--text-sub);">Đang tải...</span>
                </div>
              </div>
            </div>
            <button class="btn-close-modal" type="button" onclick="closeOrderStatusModal()">✕</button>
          </div>
          <div class="modal-body" style="overflow-y: auto; padding: 18px 20px;">
            <!-- CONTAINER DANH SÁCH ĐƠN HÀNG HOẶC TRẠNG THÁI RỖNG -->
            <div id="orderHistoryContainer" class="order-history-list"></div>
          </div>
        </div>
      </div>

      <!-- TOAST NOTIFICATION CONTAINER -->
      <div id="toastContainer" class="toast-container"></div>

      <!-- CLIENT-SIDE JAVASCRIPT -->
      <script>
        // Image paths
        var IP17_IMG = '/ip17prm.webp';
        var IP18_IMG = '/ip18prm.webp';
        window.IP17_IMG = IP17_IMG;
        window.IP18_IMG = IP18_IMG;

        // Global variables
        var cart = [];
        var currentUser = null;

        // FORMAT TIỀN VND
        function formatVND(amount) {
          return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        }

        // TOAST NOTIFICATION SYSTEM
        function showToast(message, type) {
          type = type || 'info';
          var container = document.getElementById('toastContainer');
          if (!container) return;

          var toast = document.createElement('div');
          toast.className = 'toast ' + type;
          
          var iconSvg = '';
          if (type === 'success') {
            iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          } else if (type === 'warning') {
            iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffd60a" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
          } else {
            iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
          }

          toast.innerHTML = iconSvg + '<span>' + message + '</span>';
          container.appendChild(toast);

          setTimeout(function() { toast.classList.add('show'); }, 10);

          setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 350);
          }, 3500);
        }

        // BACKDROP CLICK
        function handleBackdropClick(event, modalId) {
          if (event.target.id === modalId) {
            if (modalId === 'cartModal') closeCartModal();
            if (modalId === 'authModal') closeAuthModal();
            if (modalId === 'paymentModal') closePaymentModal();
            if (modalId === 'orderSuccessModal') closeOrderSuccessModal();
            if (modalId === 'orderStatusModal') closeOrderStatusModal();
          }
        }

        // ================= GIỎ HÀNG LOGIC =================
        function loadCartFromStorage() {
          try {
            var saved = localStorage.getItem('apple_store_cart');
            if (saved) {
              var parsed = JSON.parse(saved);
              cart = Array.isArray(parsed) ? parsed : [];
            } else {
              cart = [];
            }
          } catch (e) {
            cart = [];
          }
          updateCartUI();
        }

        function saveCartToStorage() {
          localStorage.setItem('apple_store_cart', JSON.stringify(cart));
          updateCartUI();
        }

        function addToCart(id, name, price, img) {
          var existingItem = cart.find(function(item) { return item.id === id; });
          if (existingItem) {
            existingItem.qty += 1;
          } else {
            cart.push({ id: id, name: name, price: price, img: img, qty: 1 });
          }
          saveCartToStorage();

          var badge = document.getElementById('cartCountBadge');
          if (badge) {
            badge.classList.add('bump');
            setTimeout(function() { badge.classList.remove('bump'); }, 250);
          }

          showToast('Đã thêm <strong>' + name + '</strong> vào giỏ hàng!', 'success');
          // Tự động mở modal giỏ hàng để người dùng thấy ngay
          openCartModal();
        }

        function changeQty(id, delta) {
          var item = cart.find(function(item) { return item.id === id; });
          if (!item) return;

          item.qty += delta;
          if (item.qty <= 0) {
            removeFromCart(id);
            return;
          }
          saveCartToStorage();
          renderCartList();
        }

        function removeFromCart(id) {
          cart = cart.filter(function(item) { return item.id !== id; });
          saveCartToStorage();
          renderCartList();
          showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
        }

        function clearCart() {
          cart = [];
          saveCartToStorage();
          renderCartList();
        }

        function updateCartUI() {
          var totalCount = cart.reduce(function(sum, item) { return sum + (item.qty || 1); }, 0);
          var badge = document.getElementById('cartCountBadge');
          if (badge) badge.textContent = totalCount;
        }

        function renderCartList() {
          var listEl = document.getElementById('cartItemsList');
          var emptyEl = document.getElementById('cartEmpty');
          var summaryEl = document.getElementById('cartSummaryBox');
          if (!listEl || !emptyEl || !summaryEl) return;

          if (cart.length === 0) {
            listEl.innerHTML = '';
            emptyEl.style.display = 'block';
            summaryEl.style.display = 'none';
            return;
          }

          emptyEl.style.display = 'none';
          summaryEl.style.display = 'block';
          listEl.innerHTML = '';

          var grandTotal = 0;

          cart.forEach(function(item) {
            var lineTotal = item.price * item.qty;
            grandTotal += lineTotal;

            var itemEl = document.createElement('div');
            itemEl.className = 'cart-item';

            var imgEl = document.createElement('img');
            imgEl.src = item.img;
            imgEl.alt = item.name;
            imgEl.className = 'cart-item-img';
            imgEl.onerror = function() { this.src = '/ip17prm.webp'; };

            var infoEl = document.createElement('div');
            infoEl.className = 'cart-item-info';

            var titleEl = document.createElement('div');
            titleEl.className = 'cart-item-title';
            titleEl.textContent = item.name;

            var priceEl = document.createElement('div');
            priceEl.className = 'cart-item-price';
            priceEl.textContent = formatVND(item.price);

            infoEl.appendChild(titleEl);
            infoEl.appendChild(priceEl);

            var qtyCtrl = document.createElement('div');
            qtyCtrl.className = 'cart-qty-ctrl';

            var btnMinus = document.createElement('button');
            btnMinus.className = 'btn-qty';
            btnMinus.type = 'button';
            btnMinus.textContent = '-';
            btnMinus.onclick = function() { changeQty(item.id, -1); };

            var qtyVal = document.createElement('span');
            qtyVal.className = 'cart-qty-val';
            qtyVal.textContent = item.qty;

            var btnPlus = document.createElement('button');
            btnPlus.className = 'btn-qty';
            btnPlus.type = 'button';
            btnPlus.textContent = '+';
            btnPlus.onclick = function() { changeQty(item.id, 1); };

            qtyCtrl.appendChild(btnMinus);
            qtyCtrl.appendChild(qtyVal);
            qtyCtrl.appendChild(btnPlus);

            var btnDel = document.createElement('button');
            btnDel.className = 'btn-del-item';
            btnDel.type = 'button';
            btnDel.title = 'Xóa món này';
            btnDel.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
            btnDel.onclick = function() { removeFromCart(item.id); };

            itemEl.appendChild(imgEl);
            itemEl.appendChild(infoEl);
            itemEl.appendChild(qtyCtrl);
            itemEl.appendChild(btnDel);

            listEl.appendChild(itemEl);
          });

          var subtotal = document.getElementById('subtotalText');
          var totalAmount = document.getElementById('totalAmountText');
          if (subtotal) subtotal.textContent = formatVND(grandTotal);
          if (totalAmount) totalAmount.textContent = formatVND(grandTotal);
        }

        function openCartModal() {
          renderCartList();
          var modal = document.getElementById('cartModal');
          if (modal) modal.classList.add('active');
        }

        function closeCartModal() {
          var modal = document.getElementById('cartModal');
          if (modal) modal.classList.remove('active');
        }

        // ================= THANH TOÁN (MOMO & VNPAY) =================
        var selectedPaymentGateway = 'vnpay';
        var currentOrderCode = '';
        var payTimerInterval = null;

        // CASSO ADDRESS KIT
        var provincesCache = [];
        var communesCache = {};
        var currentDeliveryAddress = 'Hà Nội, Việt Nam';

        async function loadProvinces() {
          var provSelect = document.getElementById('addressProvince');
          if (!provSelect) return;
          if (provincesCache && provincesCache.length > 0) return;

          provSelect.innerHTML = '<option value="">Đang tải danh sách tỉnh thành...</option>';

          try {
            var res = await fetch('/api/address/provinces');
            if (!res.ok) throw new Error('HTTP error ' + res.status);
            var data = await res.json();
            var provinces = data.provinces || [];
            provincesCache = provinces;

            provSelect.innerHTML = '<option value="">-- Chọn Tỉnh / Thành phố --</option>';
            provinces.forEach(function(p) {
              var opt = document.createElement('option');
              opt.value = p.code;
              opt.textContent = p.name;
              provSelect.appendChild(opt);
            });
          } catch (err) {
            console.error('Error fetching provinces:', err);
            provSelect.innerHTML = '<option value="">Không thể tải danh sách tỉnh - Vui lòng thử lại</option>';
          }
        }

        async function onProvinceChange() {
          var provSelect = document.getElementById('addressProvince');
          var comSelect = document.getElementById('addressCommune');
          if (!provSelect || !comSelect) return;

          var provinceCode = provSelect.value;
          if (!provinceCode) {
            comSelect.innerHTML = '<option value="">-- Chọn Xã / Phường --</option>';
            comSelect.disabled = true;
            return;
          }

          comSelect.disabled = true;
          comSelect.innerHTML = '<option value="">Đang tải danh sách xã/phường...</option>';

          try {
            var communes = communesCache[provinceCode];
            if (!communes) {
              var res = await fetch('/api/address/provinces/' + encodeURIComponent(provinceCode) + '/communes');
              if (!res.ok) throw new Error('HTTP error ' + res.status);
              var data = await res.json();
              communes = data.communes || [];
              communesCache[provinceCode] = communes;
            }

            comSelect.innerHTML = '<option value="">-- Chọn Xã / Phường / Thị trấn --</option>';
            communes.forEach(function(c) {
              var opt = document.createElement('option');
              opt.value = c.code;
              opt.textContent = (c.name || '').replace(/\s+/g, ' ').trim();
              comSelect.appendChild(opt);
            });
            comSelect.disabled = false;
          } catch (err) {
            console.error('Error fetching communes:', err);
            comSelect.innerHTML = '<option value="">Không thể tải xã/phường - Thử lại</option>';
            comSelect.disabled = false;
          }
        }

        function selectPaymentMethod(method) {
          selectedPaymentGateway = method;
          var cardVNPAY = document.getElementById('cardGatewayVNPAY');
          var cardMoMo = document.getElementById('cardGatewayMoMo');
          var btnProceed = document.getElementById('btnProceedPay');
          var testBox = document.getElementById('testCardBox');
          var testHeading = document.getElementById('testCardHeading');
          var testBank = document.getElementById('testCardBank');
          var testHolder = document.getElementById('testCardHolder');
          var testNum = document.getElementById('testCardNum');
          var testDate = document.getElementById('testCardDate');
          var testOtp = document.getElementById('testCardOtp');

          if (method === 'vnpay') {
            if (cardVNPAY) cardVNPAY.className = 'payment-option-card vnpay active';
            if (cardMoMo) cardMoMo.className = 'payment-option-card momo';
            if (testBox) testBox.className = 'test-card-box vnpay';
            if (testHeading) testHeading.textContent = 'Thông tin thẻ Test, hãy copy ra Notepad trước nhé!';
            if (testBank) testBank.textContent = 'NCB';
            if (testHolder) testHolder.textContent = 'NGUYEN VAN A';
            if (testNum) testNum.textContent = '9704198526191432198';
            if (testDate) testDate.textContent = '07/15';
            if (testOtp) testOtp.textContent = '123456';
            if (btnProceed) {
              btnProceed.disabled = false;
              btnProceed.className = 'btn-confirm-pay vnpay';
              btnProceed.innerHTML = '<span>Thanh toán</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>';
            }
          } else {
            if (cardVNPAY) cardVNPAY.className = 'payment-option-card vnpay';
            if (cardMoMo) cardMoMo.className = 'payment-option-card momo active';
            if (testBox) testBox.className = 'test-card-box momo';
            if (testHeading) testHeading.textContent = 'Thông tin thẻ Test, hãy copy ra notepad trước nhé!';
            if (testBank) testBank.textContent = 'NCB';
            if (testHolder) testHolder.textContent = 'NGUYEN VAN A';
            if (testNum) testNum.textContent = '9704000000000018';
            if (testDate) testDate.textContent = '03/07';
            if (testOtp) testOtp.textContent = 'OTP';
            if (btnProceed) {
              btnProceed.disabled = false;
              btnProceed.className = 'btn-confirm-pay momo';
              btnProceed.innerHTML = '<span>Thanh toán</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>';
            }
          }
        }

        function copyCardNumber() {
          var numEl = document.getElementById('testCardNum');
          if (!numEl) return;
          var text = (numEl.textContent || '').replace(/\s+/g, '');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
              showToast('Đã sao chép số thẻ: ' + text, 'info');
            }).catch(function() {
              showToast('Số thẻ: ' + text, 'info');
            });
          } else {
            showToast('Số thẻ: ' + text, 'info');
          }
        }

        function openPaymentModal() {
          if (cart.length === 0) {
            showToast('Giỏ hàng đang trống!', 'warning');
            return;
          }
          if (!currentUser) {
            showToast('Vui lòng đăng nhập trước khi tiến hành thanh toán!', 'warning');
            openAuthModal('login');
            return;
          }

          var grandTotal = cart.reduce(function(sum, item) { return sum + (item.price * item.qty); }, 0);
          var totalCount = cart.reduce(function(sum, item) { return sum + (item.qty || 1); }, 0);

          var userEmailEl = document.getElementById('payUserEmail');
          var totalQtyEl = document.getElementById('payTotalQty');
          var grandTotalEl = document.getElementById('payGrandTotal');

          if (userEmailEl) userEmailEl.textContent = currentUser.email;
          if (totalQtyEl) totalQtyEl.textContent = totalCount + ' sản phẩm';
          if (grandTotalEl) grandTotalEl.textContent = formatVND(grandTotal);

          backToMethodSelect();
          selectPaymentMethod(selectedPaymentGateway || 'vnpay');

          // Tải danh sách tỉnh từ Casso Address Kit
          loadProvinces();

          var modal = document.getElementById('paymentModal');
          if (modal) modal.classList.add('active');
        }

        function closePaymentModal() {
          var modal = document.getElementById('paymentModal');
          if (modal) modal.classList.remove('active');
          if (payTimerInterval) {
            clearInterval(payTimerInterval);
            payTimerInterval = null;
          }
        }

        function backToMethodSelect() {
          var stepSelect = document.getElementById('payStepSelect');
          var stepQR = document.getElementById('payStepQR');
          var modalTitle = document.getElementById('paymentModalTitle');
          if (stepSelect) stepSelect.style.display = 'block';
          if (stepQR) stepQR.style.display = 'none';
          if (modalTitle) modalTitle.textContent = 'Thanh Toán Đơn Hàng';
          if (payTimerInterval) {
            clearInterval(payTimerInterval);
            payTimerInterval = null;
          }
        }

        function getEmailFromToken() {
          var token = localStorage.getItem('auth_token');
          if (!token) return '';
          try {
            var parts = token.split('.');
            if (parts.length >= 2) {
              var base64Url = parts[1];
              var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              var json = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              var payload = JSON.parse(json);
              return payload.email || '';
            }
          } catch (e) {}
          return '';
        }

        async function proceedToPaymentStep() {
          var provSelect = document.getElementById('addressProvince');
          var comSelect = document.getElementById('addressCommune');
          var streetInput = document.getElementById('addressStreet');

          if (!provSelect || !provSelect.value) {
            showToast('Vui lòng chọn Tỉnh / Thành phố nhận hàng!', 'warning');
            if (provSelect) provSelect.focus();
            return;
          }

          if (!comSelect || !comSelect.value) {
            showToast('Vui lòng chọn Xã / Phường / Thị trấn nhận hàng!', 'warning');
            if (comSelect) comSelect.focus();
            return;
          }

          var provinceName = provSelect.options[provSelect.selectedIndex].text;
          var communeName = comSelect.options[comSelect.selectedIndex].text;
          var street = streetInput ? streetInput.value.trim() : '';

          if (street) {
            currentDeliveryAddress = street + ', ' + communeName + ', ' + provinceName;
          } else {
            currentDeliveryAddress = communeName + ', ' + provinceName;
          }

          var grandTotal = cart.reduce(function(sum, item) { return sum + (item.price * item.qty); }, 0);
          if (grandTotal <= 0) {
            showToast('Số tiền giỏ hàng không hợp lệ!', 'warning');
            return;
          }

          var orderId = 'APL_' + Date.now();
          var btnProceed = document.getElementById('btnProceedPay');
          if (btnProceed) {
            btnProceed.disabled = true;
            btnProceed.innerHTML = '<span class="loading-spinner-inline"></span><span>Đang kết nối cổng thanh toán...</span>';
          }

          try {
            var buyerEmail = (currentUser && currentUser.email) || getEmailFromToken() || localStorage.getItem('last_user_email') || '';
            var productsSummary = cart.map(function(i) { return i.name + ' (x' + i.qty + ')'; }).join(', ');
            sessionStorage.setItem('pending_order_email', buyerEmail);
            sessionStorage.setItem('pending_order_address', currentDeliveryAddress);
            sessionStorage.setItem('pending_order_id', orderId);
            sessionStorage.setItem('pending_order_products', productsSummary || 'iPhone 17 Pro Max (x1)');
            sessionStorage.setItem('pending_order_items', JSON.stringify(cart));
            sessionStorage.setItem('pending_order_total', grandTotal.toString());
            sessionStorage.setItem('pending_order_gateway', selectedPaymentGateway === 'momo' ? 'MoMo' : 'VNPay');

            var endpoint = '/api/payment/' + (selectedPaymentGateway === 'momo' ? 'momo' : 'vnpay');
            var res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: grandTotal,
                orderId: orderId,
                orderInfo: 'Thanh toan don hang Apple Store ' + orderId,
                returnOrigin: window.location.origin
              })
            });

            var data = await res.json();
            if (res.ok && data.paymentUrl) {
              if (btnProceed) {
                btnProceed.innerHTML = '<span class="loading-spinner-inline"></span><span>Đang chuyển sang cổng thanh toán...</span>';
              }
              showToast('Đang chuyển hướng sang cổng thanh toán ATM...', 'info');
              setTimeout(function() {
                window.location.href = data.paymentUrl;
              }, 300);
            } else {
              showToast(data.error || 'Không thể tạo liên kết thanh toán', 'warning');
              selectPaymentMethod(selectedPaymentGateway);
            }
          } catch (err) {
            console.error('Lỗi khi gọi API thanh toán:', err);
            showToast('Lỗi kết nối máy chủ cổng thanh toán!', 'warning');
            selectPaymentMethod(selectedPaymentGateway);
          }
        }

        // ================= ORDER HISTORY STORAGE & LOGIC =================
        function getActiveUserId() {
          if (currentUser && currentUser.id) return String(currentUser.id);
          if (currentUser && currentUser.email) return currentUser.email.replace(/[^a-zA-Z0-9_]/g, '_');
          var token = localStorage.getItem('auth_token');
          if (token) {
            try {
              var parts = token.split('.');
              if (parts.length >= 2) {
                var base64Url = parts[1];
                var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                var payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(function(c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join('')));
                if (payload.userId) return String(payload.userId);
                if (payload.email) return payload.email.replace(/[^a-zA-Z0-9_]/g, '_');
              }
            } catch (e) {}
          }
          var lastEmail = localStorage.getItem('last_user_email');
          if (lastEmail) return lastEmail.replace(/[^a-zA-Z0-9_]/g, '_');
          return 'guest';
        }

        function getUserOrderKey() {
          return 'user_orders_' + getActiveUserId();
        }

        function getUserOrders() {
          var key = getUserOrderKey();
          var orders = [];
          try {
            var raw = localStorage.getItem(key);
            if (raw) orders = JSON.parse(raw);
          } catch (e) {}
          if (!Array.isArray(orders)) orders = [];

          // Nếu user đăng nhập mà chưa có đơn, kiểm tra di chuyển đơn từ user_orders_guest
          if (orders.length === 0 && getActiveUserId() !== 'guest') {
            try {
              var guestRaw = localStorage.getItem('user_orders_guest');
              if (guestRaw) {
                var gOrders = JSON.parse(guestRaw);
                if (Array.isArray(gOrders) && gOrders.length > 0) {
                  orders = gOrders;
                  localStorage.setItem(key, JSON.stringify(orders));
                }
              }
            } catch (e) {}
          }

          // Kiểm tra tương thích ngược đơn cũ từ apple_current_order
          if (orders.length === 0) {
            try {
              var oldSingle = localStorage.getItem('apple_current_order');
              if (oldSingle) {
                var s = JSON.parse(oldSingle);
                if (s && s.orderId) {
                  orders = [{
                    orderId: s.orderId,
                    date: s.createdAt || new Date().toLocaleString('vi-VN'),
                    items: [{ name: s.products || 'iPhone 17 Pro Max', qty: 1, price: s.amount || 34990000 }],
                    totalAmount: s.amount || 34990000,
                    paymentMethod: (s.gateway && s.gateway.toLowerCase().indexOf('momo') !== -1) ? 'MoMo' : 'VNPay',
                    status: s.status || 'Đang xử lý',
                    address: s.address || 'Hà Nội, Việt Nam'
                  }];
                  localStorage.setItem(key, JSON.stringify(orders));
                }
              }
            } catch (e) {}
          }

          return orders;
        }

        function saveUserOrders(orders) {
          var key = getUserOrderKey();
          localStorage.setItem(key, JSON.stringify(orders));
          // Lưu dự phòng cho guest
          if (getActiveUserId() !== 'guest') {
            try {
              localStorage.setItem('user_orders_guest', JSON.stringify(orders));
            } catch (e) {}
          }
        }

        function addOrderToHistory(order) {
          var orders = getUserOrders();
          // Tự động thêm đơn hàng mới lên đầu danh sách (unshift)
          orders.unshift(order);
          saveUserOrders(orders);
          syncOrderStatusUI();
        }

        function toggleOrderCard(orderId) {
          var card = document.getElementById('orderCard_' + orderId);
          if (card) {
            card.classList.toggle('expanded');
          }
        }

        function advanceOrderStatus(orderId, event) {
          if (event && event.stopPropagation) event.stopPropagation();
          var orders = getUserOrders();
          var order = orders.find(function(o) { return o.orderId === orderId; });
          if (!order) return;

          if (order.status === 'Đang xử lý') {
            order.status = 'Đang vận chuyển';
          } else if (order.status === 'Đang vận chuyển') {
            order.status = 'Thành công';
          } else {
            order.status = 'Đang xử lý';
          }

          saveUserOrders(orders);
          syncOrderStatusUI();
          var card = document.getElementById('orderCard_' + orderId);
          if (card) card.classList.add('expanded');
          showToast('Đã đổi trạng thái đơn #' + orderId + ' sang: ' + order.status, 'info');
        }

        function checkPaymentReturn() {
          var urlParams = new URLSearchParams(window.location.search);
          var paymentStatus = urlParams.get('payment_status');
          if (!paymentStatus) return;

          var gateway = urlParams.get('gateway') || 'vnpay';
          var orderId = urlParams.get('order_id') || ('APL_' + Math.floor(100000 + Math.random() * 900000));
          var amount = Number(urlParams.get('amount')) || 0;
          var gatewayName = gateway === 'momo' ? 'Ví MoMo (ATM NCB)' : 'Cổng VNPAY';

          if (paymentStatus === 'success') {
            clearCart();

            var receiptCodeEl = document.getElementById('receiptOrderCode');
            var receiptGatewayEl = document.getElementById('receiptGateway');
            var receiptAmountEl = document.getElementById('receiptAmount');
            var receiptEmailEl = document.getElementById('receiptEmail');
            var receiptAddressEl = document.getElementById('receiptAddress');

            var address = sessionStorage.getItem('pending_order_address') || 'Hà Nội, Việt Nam';
            var email = sessionStorage.getItem('pending_order_email') || (currentUser && currentUser.email) || getEmailFromToken() || localStorage.getItem('last_user_email') || '';

            // Lấy danh sách sản phẩm đã lưu trong sessionStorage
            var savedItems = [];
            try {
              var rawItems = sessionStorage.getItem('pending_order_items');
              if (rawItems) savedItems = JSON.parse(rawItems);
            } catch (e) {}

            if (!Array.isArray(savedItems) || savedItems.length === 0) {
              var pendingProducts = sessionStorage.getItem('pending_order_products') || 'iPhone 17 Pro Max (x1)';
              savedItems = [{
                name: pendingProducts.split('(')[0].trim() || 'iPhone 17 Pro Max',
                qty: 1,
                price: amount || 34990000
              }];
            }

            var cleanItems = savedItems.map(function(item) {
              return {
                name: item.name || 'Sản phẩm Apple',
                qty: Number(item.qty) || 1,
                price: Number(item.price) || 0
              };
            });

            var grandTotalVal = amount > 0 ? amount : Number(sessionStorage.getItem('pending_order_total')) || 34990000;

            sessionStorage.removeItem('pending_order_address');
            sessionStorage.removeItem('pending_order_id');
            sessionStorage.removeItem('pending_order_email');
            sessionStorage.removeItem('pending_order_products');
            sessionStorage.removeItem('pending_order_items');
            sessionStorage.removeItem('pending_order_total');
            sessionStorage.removeItem('pending_order_gateway');

            if (receiptCodeEl) receiptCodeEl.textContent = orderId;
            if (receiptGatewayEl) receiptGatewayEl.textContent = gatewayName;
            if (receiptAmountEl) receiptAmountEl.textContent = grandTotalVal > 0 ? formatVND(grandTotalVal) : 'Đã thanh toán';
            if (receiptEmailEl) receiptEmailEl.textContent = email || 'Tài khoản của bạn';
            if (receiptAddressEl) receiptAddressEl.textContent = address;

            var receiptModal = document.getElementById('orderSuccessModal');
            if (receiptModal) receiptModal.classList.add('active');

            // Thêm đơn hàng mới vào lịch sử đơn hàng
            var nowStr = new Date().toLocaleString('vi-VN', {
              hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
            });

            var newOrderObj = {
              orderId: orderId,
              date: nowStr,
              items: cleanItems,
              totalAmount: grandTotalVal,
              paymentMethod: gateway === 'momo' ? 'MoMo' : 'VNPay',
              status: 'Đang xử lý',
              address: address
            };

            addOrderToHistory(newOrderObj);

            showToast('🎉 Thanh toán ' + (grandTotalVal > 0 ? formatVND(grandTotalVal) + ' ' : '') + 'thành công qua ' + gatewayName + '!', 'success');
          } else if (paymentStatus === 'cancel') {
            showToast('Giao dịch thanh toán qua ' + gatewayName + ' đã bị hủy hoặc không thành công.', 'warning');
          } else if (paymentStatus === 'invalid_signature') {
            showToast('Lỗi chữ ký bảo mật (Invalid Checksum) từ ' + gatewayName + '!', 'danger');
          }

          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }

        function startPayCountdown(seconds) {
          if (payTimerInterval) clearInterval(payTimerInterval);
          var timerEl = document.getElementById('payTimerVal');
          var remaining = seconds;

          function updateDisplay() {
            var m = Math.floor(remaining / 60);
            var s = remaining % 60;
            if (timerEl) {
              timerEl.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
            }
          }

          updateDisplay();
          payTimerInterval = setInterval(function() {
            remaining -= 1;
            if (remaining <= 0) {
              clearInterval(payTimerInterval);
              payTimerInterval = null;
              if (timerEl) timerEl.textContent = '00:00 (Hết hạn)';
              showToast('Mã giao dịch đã hết hạn. Vui lòng thử lại!', 'warning');
            } else {
              updateDisplay();
            }
          }, 1000);
        }

        function confirmSimulatedPayment() {
          var grandTotal = cart.reduce(function(sum, item) { return sum + (item.price * item.qty); }, 0);
          var formattedTotal = formatVND(grandTotal);
          var email = currentUser ? currentUser.email : 'user@example.com';
          var gatewayName = selectedPaymentGateway === 'momo' ? 'Ví MoMo (Sandbox)' : 'Cổng VNPAY (Sandbox)';
          var address = currentDeliveryAddress || 'Hà Nội, Việt Nam';

          var cleanItems = cart.map(function(item) {
            return {
              name: item.name || 'Sản phẩm Apple',
              qty: Number(item.qty) || 1,
              price: Number(item.price) || 0
            };
          });

          var receiptCodeEl = document.getElementById('receiptOrderCode');
          var receiptGatewayEl = document.getElementById('receiptGateway');
          var receiptAmountEl = document.getElementById('receiptAmount');
          var receiptEmailEl = document.getElementById('receiptEmail');
          var receiptAddressEl = document.getElementById('receiptAddress');

          if (receiptCodeEl) receiptCodeEl.textContent = currentOrderCode;
          if (receiptGatewayEl) receiptGatewayEl.textContent = gatewayName;
          if (receiptAmountEl) receiptAmountEl.textContent = formattedTotal;
          if (receiptEmailEl) receiptEmailEl.textContent = email;
          if (receiptAddressEl) receiptAddressEl.textContent = address;

          clearCart();
          closePaymentModal();

          var receiptModal = document.getElementById('orderSuccessModal');
          if (receiptModal) receiptModal.classList.add('active');

          // Thêm đơn hàng mới vào lịch sử đơn hàng
          var nowStr = new Date().toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
          });

          var newOrderObj = {
            orderId: currentOrderCode,
            date: nowStr,
            items: cleanItems.length > 0 ? cleanItems : [{ name: 'iPhone 17 Pro Max', qty: 1, price: grandTotal }],
            totalAmount: grandTotal,
            paymentMethod: selectedPaymentGateway === 'momo' ? 'MoMo' : 'VNPay',
            status: 'Đang xử lý',
            address: address
          };

          addOrderToHistory(newOrderObj);

          showToast('🎉 Thanh toán ' + formattedTotal + ' thành công qua ' + (selectedPaymentGateway === 'momo' ? 'MoMo' : 'VNPAY') + '!', 'success');
        }

        function closeOrderSuccessModal() {
          var receiptModal = document.getElementById('orderSuccessModal');
          if (receiptModal) receiptModal.classList.remove('active');
        }

        // ================= ORDER STATUS MODAL LOGIC =================
        function openOrderStatusModal() {
          syncOrderStatusUI();
          var modal = document.getElementById('orderStatusModal');
          if (modal) modal.classList.add('active');
        }

        function closeOrderStatusModal() {
          var modal = document.getElementById('orderStatusModal');
          if (modal) modal.classList.remove('active');
        }

        function syncOrderStatusUI() {
          var orders = getUserOrders();
          var navDot = document.getElementById('orderStatusNavDot');
          var modalSub = document.getElementById('modalOrderCountSub');
          var container = document.getElementById('orderHistoryContainer');

          var processingCount = orders.filter(function(o) { return o.status === 'Đang xử lý'; }).length;
          var hasProcessing = processingCount > 0;
          var hasOrders = orders.length > 0;

          // Cập nhật chấm tròn thông báo trên thanh Header
          if (navDot) {
            if (!hasOrders) {
              navDot.style.display = 'none';
            } else {
              navDot.style.display = 'block';
              if (hasProcessing) {
                navDot.className = 'order-status-dot';
                navDot.title = processingCount + ' đơn hàng đang xử lý';
              } else {
                navDot.className = 'order-status-dot success';
                navDot.title = 'Tất cả đơn hàng đã giao thành công';
              }
            }
          }

          // Cập nhật phụ đề modal
          if (modalSub) {
            if (!hasOrders) {
              modalSub.textContent = '';
            } else {
              modalSub.textContent = 'Tổng cộng: ' + orders.length + ' đơn hàng' + (hasProcessing ? ' (' + processingCount + ' đang xử lý)' : '');
            }
          }

          // Hiển thị danh sách card hoặc Empty State
          if (!container) return;

          if (!hasOrders) {
            container.innerHTML = 
              '<div class="order-history-empty">' +
                '<div class="empty-icon-circle">' +
                  '<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>' +
                    '<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>' +
                    '<line x1="12" y1="22.08" x2="12" y2="12"></line>' +
                  '</svg>' +
                '</div>' +
                '<h4>Trạng thái đơn hàng đang trống</h4>' +
              '</div>';
            return;
          }

          var html = '';
          orders.forEach(function(order, idx) {
            var rawId = String(order.orderId || ('APL_' + (idx + 1)));
            var orderId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
            var date = order.date || 'Hôm nay';
            var totalAmount = order.totalAmount || 0;
            var formattedTotal = typeof totalAmount === 'number' ? formatVND(totalAmount) : totalAmount;
            var paymentMethod = order.paymentMethod || 'VNPay';
            var isMoMo = paymentMethod.toLowerCase().indexOf('momo') !== -1;
            var gatewayBadgeText = isMoMo ? 'MoMo' : 'VNPay';
            var status = order.status || 'Đang xử lý';
            var isSuccess = status === 'Thành công' || status === 'Giao thành công' || status === 'Hoàn tất';
            var isShipping = status === 'Đang vận chuyển';
            var isProcessing = status === 'Đang xử lý';
            var address = order.address || 'Hà Nội, Việt Nam';

            // Danh sách tóm tắt tên sản phẩm kèm số lượng
            var itemsSummaryHtml = '';
            if (Array.isArray(order.items) && order.items.length > 0) {
              itemsSummaryHtml = order.items.map(function(item) {
                var name = item.name || 'Sản phẩm Apple';
                var qty = item.qty || 1;
                var itemPriceStr = item.price ? formatVND(item.price) : '';
                return '<div class="order-item-summary-line">' +
                  '<span class="order-item-summary-name">• ' + name + '</span>' +
                  '<span class="order-item-summary-qty">' + (itemPriceStr ? '<span style="color: #a1a1a6; margin-right: 6px;">' + itemPriceStr + '</span>' : '') + '<strong>x' + qty + '</strong></span>' +
                '</div>';
              }).join('');
            } else {
              itemsSummaryHtml = '<div class="order-item-summary-line"><span class="order-item-summary-name">• ' + (order.products || 'iPhone 17 Pro Max') + '</span><span class="order-item-summary-qty"><strong>x1</strong></span></div>';
            }

            // Các bước trong Timeline Stepper
            var step1Class = 'stepper-step step-done';
            var step2Class = 'stepper-step ' + (isProcessing ? 'step-active' : 'step-done');
            var step3Class = 'stepper-step ' + (isShipping ? 'step-active' : (isSuccess ? 'step-done' : 'step-pending'));
            var step4Class = 'stepper-step ' + (isSuccess ? 'step-done' : 'step-pending');

            html += 
              '<div class="order-card ' + (isProcessing ? 'processing-order' : '') + '" id="orderCard_' + orderId + '">' +
                '<div class="order-card-header" data-order-id="' + orderId + '" onclick="toggleOrderCard(this.dataset.orderId)">' +
                  '<div class="order-card-top">' +
                    '<div class="order-card-id-wrap">' +
                      '<span class="order-card-id">#' + rawId + '</span>' +
                      '<span style="color: rgba(255,255,255,0.25);">|</span>' +
                      '<span class="order-card-date">' + date + '</span>' +
                    '</div>' +
                    '<div class="order-card-badges">' +
                      '<span class="order-badge-gateway ' + (isMoMo ? 'momo' : 'vnpay') + '">' + gatewayBadgeText + '</span>' +
                      '<span class="order-badge-status ' + (isSuccess ? 'success' : 'processing') + '">' +
                        (isSuccess ? '✓ ' : '<span class="pulse-indicator" style="width: 6px; height: 6px;"></span> ') + status +
                      '</span>' +
                    '</div>' +
                  '</div>' +

                  '<div class="order-card-items-summary">' +
                    itemsSummaryHtml +
                  '</div>' +

                  '<div class="order-card-bottom">' +
                    '<div style="display: flex; align-items: baseline; gap: 6px;">' +
                      '<span class="order-total-label">Tổng tiền:</span>' +
                      '<span class="order-total-val ' + (isSuccess ? 'success' : '') + '">' + formattedTotal + '</span>' +
                    '</div>' +
                    '<button class="order-expand-btn" type="button">' +
                      '<span>Chi tiết hành trình</span>' +
                      '<svg class="order-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
                    '</button>' +
                  '</div>' +
                '</div>' +

                '<!-- Chi tiết Timeline vận chuyển mở rộng -->' +
                '<div class="order-card-details-panel">' +
                  '<div class="order-details-inner">' +
                    '<div class="order-timeline-title">' +
                      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>' +
                      'Hành trình vận chuyển đơn hàng' +
                    '</div>' +

                    '<div class="order-stepper-compact">' +
                      '<!-- Bước 1: Đặt hàng thành công -->' +
                      '<div class="' + step1Class + '">' +
                        '<div class="step-icon-wrap">' +
                          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
                        '</div>' +
                        '<div class="step-info">' +
                          '<div class="step-name">Đặt hàng thành công</div>' +
                          '<div class="step-sub">' + date + ' - Đã xác nhận thanh toán</div>' +
                        '</div>' +
                      '</div>' +

                      '<!-- Bước 2: Đang xử lý -->' +
                      '<div class="' + step2Class + '">' +
                        '<div class="step-icon-wrap">' +
                          (isProcessing ? '<span class="pulse-indicator" style="width: 8px; height: 8px;"></span>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>') +
                        '</div>' +
                        '<div class="step-info">' +
                          '<div class="step-name">Đang xử lý</div>' +
                          '<div class="step-sub">' + (isProcessing ? 'Đang kiểm tra tồn kho & đóng gói kiện hàng' : 'Đã đóng gói hoàn tất') + '</div>' +
                        '</div>' +
                      '</div>' +

                      '<!-- Bước 3: Đang vận chuyển -->' +
                      '<div class="' + step3Class + '">' +
                        '<div class="step-icon-wrap">' +
                          (isShipping ? '<span class="pulse-indicator" style="width: 8px; height: 8px;"></span>' : (isSuccess ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>')) +
                        '</div>' +
                        '<div class="step-info">' +
                          '<div class="step-name">Đang vận chuyển</div>' +
                          '<div class="step-sub">' + (isShipping ? 'Đang trên đường trung chuyển liên tỉnh' : (isSuccess ? 'Đã vận chuyển đến bưu cục phát' : 'Chờ bàn giao đối tác vận chuyển')) + '</div>' +
                        '</div>' +
                      '</div>' +

                      '<!-- Bước 4: Giao thành công -->' +
                      '<div class="' + step4Class + '">' +
                        '<div class="step-icon-wrap">' +
                          (isSuccess ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>') +
                        '</div>' +
                        '<div class="step-info">' +
                          '<div class="step-name">Giao thành công</div>' +
                          '<div class="step-sub">' + (isSuccess ? 'Kiện hàng đã được ký nhận thành công' : 'Chờ giao tới người nhận') + '</div>' +
                        '</div>' +
                      '</div>' +
                    '</div>' +

                    '<div class="order-info-subbox">' +
                      '<div class="order-subbox-row">' +
                        '<span style="color: var(--text-sub);">Địa chỉ nhận hàng:</span>' +
                        '<span style="color: #fff; font-weight: 500; text-align: right; max-width: 65%;">' + address + '</span>' +
                      '</div>' +
                      '<div class="order-subbox-row">' +
                        '<span style="color: var(--text-sub);">Phương thức thanh toán:</span>' +
                        '<span style="color: #fff; font-weight: 500;">' + paymentMethod + '</span>' +
                      '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>';
          });

          container.innerHTML = html;
        }

        function handleCheckout() {
          if (cart.length === 0) {
            showToast('Giỏ hàng đang trống!', 'warning');
            return;
          }

          if (!currentUser) {
            showToast('Vui lòng đăng nhập trước khi tiến hành thanh toán!', 'warning');
            closeCartModal();
            setTimeout(function() {
              openAuthModal('login');
              showAuthMsg('Bạn cần đăng nhập để thanh toán đơn hàng.', true);
            }, 250);
            return;
          }

          closeCartModal();
          setTimeout(function() {
            openPaymentModal();
          }, 200);
        }

        // ================= AUTH MODAL LOGIC =================
        function showAuthMsg(text, isError) {
          var authMsgBox = document.getElementById('authMsgBox');
          if (!authMsgBox) return;
          authMsgBox.textContent = text;
          authMsgBox.className = 'auth-msg ' + (isError ? 'error' : 'success');
        }

        function clearAuthMsg() {
          var authMsgBox = document.getElementById('authMsgBox');
          if (!authMsgBox) return;
          authMsgBox.textContent = '';
          authMsgBox.className = 'auth-msg';
        }

        function openAuthModal(tab) {
          tab = tab || 'login';
          switchAuthTab(tab);
          var modal = document.getElementById('authModal');
          if (modal) modal.classList.add('active');
        }

        function closeAuthModal() {
          var modal = document.getElementById('authModal');
          if (modal) modal.classList.remove('active');
          clearAuthMsg();
        }

        function switchAuthTab(tab) {
          clearAuthMsg();
          document.querySelectorAll('.tab-panel').forEach(function(el) { el.classList.remove('active'); });
          document.querySelectorAll('.auth-nav button').forEach(function(el) { el.classList.remove('active'); });

          var title = document.getElementById('authModalTitle');
          if (tab === 'login') {
            var panel = document.getElementById('tabPanelLogin');
            var btn = document.getElementById('tabBtnLogin');
            if (panel) panel.classList.add('active');
            if (btn) btn.classList.add('active');
            if (title) title.textContent = 'Đăng Nhập';
          } else if (tab === 'register') {
            var panel = document.getElementById('tabPanelRegister');
            var btn = document.getElementById('tabBtnRegister');
            if (panel) panel.classList.add('active');
            if (btn) btn.classList.add('active');
            if (title) title.textContent = 'Đăng Ký';
          } else if (tab === 'forgot') {
            var panel = document.getElementById('tabPanelForgot');
            var btn = document.getElementById('tabBtnForgot');
            if (panel) panel.classList.add('active');
            if (btn) btn.classList.add('active');
            if (title) title.textContent = 'Khôi Phục Mật Khẩu';
          }
        }

        async function submitRegister() {
          clearAuthMsg();
          var email = (document.getElementById('regEmail').value || '').trim();
          var password = document.getElementById('regPassword').value;

          if (!email || !password) {
            showAuthMsg('Vui lòng điền đầy đủ Email và Mật khẩu', true);
            return;
          }

          try {
            var res = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email, password: password })
            });
            var data = await res.json();
            if (res.ok) {
              showAuthMsg(data.message + '! Chuyển sang đăng nhập...');
              document.getElementById('loginEmail').value = email;
              document.getElementById('loginPassword').value = '';
              setTimeout(function() { switchAuthTab('login'); }, 1200);
            } else {
              showAuthMsg(data.error || 'Đăng ký thất bại', true);
            }
          } catch (err) {
            showAuthMsg('Lỗi kết nối máy chủ', true);
          }
        }

        async function submitLogin() {
          clearAuthMsg();
          var email = (document.getElementById('loginEmail').value || '').trim();
          var password = document.getElementById('loginPassword').value;

          if (!email || !password) {
            showAuthMsg('Vui lòng điền Email và Mật khẩu', true);
            return;
          }

          try {
            var res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email, password: password })
            });
            var data = await res.json();
            if (res.ok && data.token) {
              localStorage.setItem('auth_token', data.token);
              localStorage.setItem('last_user_email', email);
              showAuthMsg('Đăng nhập thành công!');
              await checkAuth();
              setTimeout(function() {
                closeAuthModal();
                showToast('Chào mừng trở lại, ' + email + '!', 'success');
              }, 600);
            } else {
              showAuthMsg(data.error || 'Email hoặc mật khẩu không chính xác', true);
            }
          } catch (err) {
            showAuthMsg('Lỗi kết nối máy chủ', true);
          }
        }

        async function submitForgot() {
          clearAuthMsg();
          var email = (document.getElementById('forgotEmail').value || '').trim();
          if (!email) {
            showAuthMsg('Vui lòng nhập Email cần lấy lại mật khẩu', true);
            return;
          }

          try {
            var res = await fetch('/api/auth/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email })
            });
            var data = await res.json();
            if (res.ok) {
              showAuthMsg(data.message);
              if (data.reset_token) {
                document.getElementById('resetToken').value = data.reset_token;
              }
            } else {
              showAuthMsg(data.error || 'Không thể gửi yêu cầu', true);
            }
          } catch (err) {
            showAuthMsg('Lỗi kết nối máy chủ', true);
          }
        }

        async function submitResetPass() {
          clearAuthMsg();
          var token = (document.getElementById('resetToken').value || '').trim();
          var new_password = document.getElementById('newPassword').value;

          if (!token || !new_password) {
            showAuthMsg('Vui lòng điền mã Reset Token và Mật khẩu mới', true);
            return;
          }

          try {
            var res = await fetch('/api/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: token, new_password: new_password })
            });
            var data = await res.json();
            if (res.ok) {
              showAuthMsg('Đổi mật khẩu thành công! Chuyển sang đăng nhập...');
              document.getElementById('loginPassword').value = '';
              setTimeout(function() { switchAuthTab('login'); }, 1200);
            } else {
              showAuthMsg(data.error || 'Đổi mật khẩu thất bại', true);
            }
          } catch (err) {
            showAuthMsg('Lỗi kết nối máy chủ', true);
          }
        }

        async function checkAuth() {
          var token = localStorage.getItem('auth_token');
          if (!token) {
            setLoggedOutUI();
            return;
          }

          try {
            var res = await fetch('/api/me', {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
              var data = await res.json();
              currentUser = data.user;
              setLoggedInUI(currentUser.email);
            } else {
              handleLogout(false);
            }
          } catch (err) {
            setLoggedOutUI();
          }
        }

        function setLoggedInUI(email) {
          localStorage.setItem('last_user_email', email);
          var btnAuth = document.getElementById('btnOpenAuth');
          var loggedBox = document.getElementById('userLoggedBox');
          var emailSpan = document.getElementById('userEmailSpan');
          if (btnAuth) btnAuth.style.display = 'none';
          if (loggedBox) loggedBox.style.display = 'flex';
          if (emailSpan) {
            emailSpan.textContent = email;
            emailSpan.title = email;
          }
          var receiptEmailEl = document.getElementById('receiptEmail');
          if (receiptEmailEl && (!receiptEmailEl.textContent || receiptEmailEl.textContent.indexOf('@apple-demo.com') !== -1 || receiptEmailEl.textContent === 'Tài khoản của bạn')) {
            receiptEmailEl.textContent = email;
          }
          syncOrderStatusUI();
        }

        function setLoggedOutUI() {
          currentUser = null;
          var btnAuth = document.getElementById('btnOpenAuth');
          var loggedBox = document.getElementById('userLoggedBox');
          if (btnAuth) btnAuth.style.display = 'flex';
          if (loggedBox) loggedBox.style.display = 'none';
          syncOrderStatusUI();
        }

        function handleLogout(showNotification) {
          if (showNotification === undefined) showNotification = true;
          localStorage.removeItem('auth_token');
          localStorage.removeItem('apple_store_cart');
          cart = [];
          updateCartUI();
          setLoggedOutUI();
          if (showNotification) {
            showToast('Đã đăng xuất tài khoản.', 'info');
          }
        }

        // Đính kèm các hàm vào window để đảm bảo onclick luôn hoạt động
        window.openAuthModal = openAuthModal;
        window.closeAuthModal = closeAuthModal;
        window.switchAuthTab = switchAuthTab;
        window.submitLogin = submitLogin;
        window.submitRegister = submitRegister;
        window.submitForgot = submitForgot;
        window.submitResetPass = submitResetPass;
        window.openCartModal = openCartModal;
        window.closeCartModal = closeCartModal;
        window.addToCart = addToCart;
        window.changeQty = changeQty;
        window.removeFromCart = removeFromCart;
        window.handleCheckout = handleCheckout;
        window.handleLogout = handleLogout;
        window.handleBackdropClick = handleBackdropClick;
        window.openPaymentModal = openPaymentModal;
        window.closePaymentModal = closePaymentModal;
        window.selectPaymentMethod = selectPaymentMethod;
        window.proceedToPaymentStep = proceedToPaymentStep;
        window.backToMethodSelect = backToMethodSelect;
        window.confirmSimulatedPayment = confirmSimulatedPayment;
        window.closeOrderSuccessModal = closeOrderSuccessModal;
        window.loadProvinces = loadProvinces;
        window.onProvinceChange = onProvinceChange;
        window.copyCardNumber = copyCardNumber;
        window.checkPaymentReturn = checkPaymentReturn;
        window.openOrderStatusModal = openOrderStatusModal;
        window.closeOrderStatusModal = closeOrderStatusModal;
        window.syncOrderStatusUI = syncOrderStatusUI;
        window.toggleOrderCard = toggleOrderCard;
        window.advanceOrderStatus = advanceOrderStatus;

        // Khởi tạo trạng thái
        loadCartFromStorage();
        checkAuth();
        checkPaymentReturn();
        syncOrderStatusUI();
      </script>
    </body>
    </html>
  `);
});

// Endpoint tự tạo bảng cho database (Dùng cho local)
app.get('/init-db', async (c) => {
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `),
      c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS password_resets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL
        )
      `),
    ]);
    return c.json({ message: 'Khởi tạo bảng database thành công!' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể khởi tạo database';
    return c.json({ error: message }, 500);
  }
});

// Gắn routes API
app.route('/api/auth', authRouter);
app.route('/api', userRouter);
app.route('/api/payment', paymentRouter);

export default app;
