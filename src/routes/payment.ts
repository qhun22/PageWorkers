import { Hono } from 'hono';
import type { Env } from '../types';
import { hmacSHA512, hmacSHA256 } from '../utils/crypto';

export const paymentRouter = new Hono<Env>();

// Helper lấy thời gian thực GMT+7 (Asia/Ho_Chi_Minh) cho VNPay (vnp_CreateDate & vnp_ExpireDate)
async function getVnDates(): Promise<{ createDate: string; expireDate: string }> {
  let now = new Date();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const serverDate = res.headers.get('date');
    if (serverDate) {
      const parsed = new Date(serverDate);
      if (!isNaN(parsed.getTime())) {
        now = parsed;
      }
    }
  } catch {
    // Sử dụng giờ hệ thống hiện tại nếu fetch timeout
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const format = (d: Date) => {
    const parts = formatter.formatToParts(d);
    const m: Record<string, string> = {};
    for (const p of parts) m[p.type] = p.value;
    return `${m.year}${m.month}${m.day}${m.hour}${m.minute}${m.second}`;
  };

  const createDate = format(now);
  const expireDate = format(new Date(now.getTime() + 15 * 60 * 1000));
  return { createDate, expireDate };
}

// Helper lấy IP client chuẩn IPv4 cho VNPay
function getClientIp(c: any): string {
  const forwarded = c.req.header('x-forwarded-for');
  let ip = forwarded ? forwarded.split(',')[0].trim() : '';
  if (!ip) ip = c.req.header('cf-connecting-ip') || '';
  if (!ip || ip.includes(':')) ip = '127.0.0.1';
  return ip;
}

// Hàm chuẩn hóa & sắp xếp tham số chuẩn đặc tả VNPay
function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const str: string[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        str.push(encodeURIComponent(key));
      }
    }
  }
  str.sort();
  for (let key = 0; key < str.length; key++) {
    const k = str[key];
    sorted[k] = encodeURIComponent(obj[decodeURIComponent(k)]).replace(/%20/g, '+');
  }
  return sorted;
}

// ================= 1. CỔNG VNPAY (NHẬP THẺ ATM NỘI ĐỊA NCB) =================
paymentRouter.post('/vnpay', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const amount = Number(body.amount) || 0;
    const orderId = String(body.orderId || ('APL_' + Date.now()));
    const orderInfo = String(body.orderInfo || ('Thanh toan don hang ' + orderId));

    if (amount <= 0) {
      return c.json({ error: 'Số tiền thanh toán không hợp lệ' }, 400);
    }

    const vnp_Url = c.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const vnp_TmnCode = c.env.VNPAY_TMN_CODE || '<SET_YOUR_VNPAY_TMN_CODE>';
    const vnp_HashSecret = c.env.VNPAY_HASH_SECRET || '<SET_YOUR_VNPAY_HASH_SECRET>';
    const origin = body.returnOrigin || new URL(c.req.url).origin;
    const vnp_ReturnUrl = `${origin}/api/payment/vnpay/return`;

    const { createDate, expireDate } = await getVnDates();

    const vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: String(Math.round(amount * 100)),
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_IpAddr: getClientIp(c),
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Chọn ngân hàng NCB thử nghiệm theo thông tin tài khoản test
    if (body.bankCode && body.bankCode !== 'ALL') {
      vnp_Params.vnp_BankCode = String(body.bankCode);
    } else if (body.bankCode === undefined) {
      vnp_Params.vnp_BankCode = 'NCB';
    }

    // Sắp xếp tham số theo chuẩn VNPay
    const sortedParams = sortObject(vnp_Params);
    let signData = '';
    for (const key in sortedParams) {
      if (signData.length > 0) {
        signData += '&' + key + '=' + sortedParams[key];
      } else {
        signData += key + '=' + sortedParams[key];
      }
    }

    // Ký chữ ký HMAC-SHA512
    const secureHash = await hmacSHA512(vnp_HashSecret, signData);
    const paymentUrl = `${vnp_Url}?${signData}&vnp_SecureHash=${secureHash}`;

    return c.json({
      paymentUrl,
      orderId,
      bankCode: vnp_Params.vnp_BankCode || '',
      testCard: {
        bank: 'NCB',
        cardNumber: '9704198526191432198',
        cardHolder: 'NGUYEN VAN A',
        issueDate: '07/15',
        otp: '123456',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi tạo liên kết VNPay';
    return c.json({ error: msg }, 500);
  }
});

// Callback Return URL từ VNPay khi người dùng thanh toán xong
paymentRouter.get('/vnpay/return', async (c) => {
  const query = c.req.query();
  const secureHash = query['vnp_SecureHash'] || '';
  const responseCode = query['vnp_ResponseCode'] || '';
  const txnRef = query['vnp_TxnRef'] || '';
  const amount = (Number(query['vnp_Amount']) || 0) / 100;
  const vnp_HashSecret = c.env.VNPAY_HASH_SECRET || '<SET_YOUR_VNPAY_HASH_SECRET>';

  // Kiểm tra chữ ký bảo mật từ VNPay
  const verifyParams: Record<string, string> = {};
  for (const key in query) {
    if (key.startsWith('vnp_') && key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
      verifyParams[key] = query[key];
    }
  }

  const sortedVerifyParams = sortObject(verifyParams);
  let signData = '';
  for (const key in sortedVerifyParams) {
    if (signData.length > 0) {
      signData += '&' + key + '=' + sortedVerifyParams[key];
    } else {
      signData += key + '=' + sortedVerifyParams[key];
    }
  }

  const checkHash = await hmacSHA512(vnp_HashSecret, signData);
  const isValidSignature = secureHash.toLowerCase() === checkHash.toLowerCase();

  if (!isValidSignature) {
    console.warn('VNPay Return: Sai chu ky checksum', { secureHash, checkHash });
    return c.redirect(`/?payment_status=invalid_signature&gateway=vnpay&order_id=${encodeURIComponent(txnRef)}`);
  }

  if (responseCode === '00') {
    return c.redirect(`/?payment_status=success&gateway=vnpay&order_id=${encodeURIComponent(txnRef)}&amount=${amount}`);
  } else {
    return c.redirect(`/?payment_status=cancel&gateway=vnpay&order_id=${encodeURIComponent(txnRef)}`);
  }
});

// Endpoint IPN URL (Server-to-Server) dành cho VNPay cập nhật trạng thái thanh toán & kịch bản test SIT
paymentRouter.get('/vnpay/ipn', async (c) => {
  try {
    const query = c.req.query();
    const secureHash = query['vnp_SecureHash'] || '';
    const responseCode = query['vnp_ResponseCode'] || '';
    const transactionStatus = query['vnp_TransactionStatus'] || '';
    const vnp_HashSecret = c.env.VNPAY_HASH_SECRET || '<SET_YOUR_VNPAY_HASH_SECRET>';

    const verifyParams: Record<string, string> = {};
    for (const key in query) {
      if (key.startsWith('vnp_') && key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
        verifyParams[key] = query[key];
      }
    }

    const sortedVerifyParams = sortObject(verifyParams);
    let signData = '';
    for (const key in sortedVerifyParams) {
      if (signData.length > 0) {
        signData += '&' + key + '=' + sortedVerifyParams[key];
      } else {
        signData += key + '=' + sortedVerifyParams[key];
      }
    }

    const checkHash = await hmacSHA512(vnp_HashSecret, signData);

    // Kiểm tra checksum
    if (secureHash.toLowerCase() !== checkHash.toLowerCase()) {
      return c.json({ RspCode: '97', Message: 'Invalid signature' });
    }

    // Trả về kết quả thành công cho server VNPay theo đúng đặc tả
    if (responseCode === '00' && transactionStatus === '00') {
      return c.json({ RspCode: '00', Message: 'Confirm Success' });
    } else {
      return c.json({ RspCode: '00', Message: 'Confirm Success' });
    }
  } catch (err) {
    return c.json({ RspCode: '99', Message: 'Unknown error' });
  }
});

// ================= 2. CỔNG MOMO (NHẬP THẺ ATM NỘI ĐỊA - payWithATM) =================
paymentRouter.post('/momo', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const amount = Number(body.amount) || 0;
    const orderId = String(body.orderId || ('APL_' + Date.now()));
    const orderInfo = String(body.orderInfo || ('Thanh toan don hang Apple Store ' + orderId));

    if (amount <= 0) {
      return c.json({ error: 'Số tiền thanh toán không hợp lệ' }, 400);
    }

    const endpoint = c.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
    const partnerCode = c.env.MOMO_PARTNER_CODE || '<SET_YOUR_MOMO_PARTNER_CODE>';
    const accessKey = c.env.MOMO_ACCESS_KEY || '<SET_YOUR_MOMO_ACCESS_KEY>';
    const secretKey = c.env.MOMO_SECRET_KEY || '<SET_YOUR_MOMO_SECRET_KEY>';
    const origin = body.returnOrigin || new URL(c.req.url).origin;
    const redirectUrl = `${origin}/api/payment/momo/return`;
    const ipnUrl = `${origin}/api/payment/momo/return`;

    const requestId = partnerCode + Date.now();
    const requestType = 'payWithATM';
    const extraData = '';
    const bankCode = 'NCB';

    // Chuỗi ký chuẩn MoMo v2
    const rawSignature = `accessKey=${accessKey}&amount=${Math.round(amount)}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = await hmacSHA256(secretKey, rawSignature);

    const payload = {
      partnerCode,
      partnerName: 'Apple Store Demo',
      storeId: 'AppleStoreDemo',
      requestId,
      amount: Math.round(amount),
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      extraData,
      requestType,
      autoCapture: true,
      bankCode,
      signature,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as any;

    if (data && data.payUrl) {
      return c.json({
        paymentUrl: data.payUrl,
        orderId,
        testCard: {
          bank: 'NCB',
          cardNumber: '9704000000000018',
          cardHolder: 'NGUYEN VAN A',
          issueDate: '03/07',
          otp: '123456',
        },
      });
    } else {
      return c.json({ error: data.message || 'Không thể tạo liên kết thanh toán MoMo', details: data }, 400);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi tạo liên kết MoMo';
    return c.json({ error: msg }, 500);
  }
});

// Callback Return URL từ MoMo
paymentRouter.get('/momo/return', (c) => {
  const query = c.req.query();
  const resultCode = query['resultCode'];
  const orderId = query['orderId'] || '';
  const amount = query['amount'] || '0';

  if (resultCode === '0') {
    return c.redirect(`/?payment_status=success&gateway=momo&order_id=${encodeURIComponent(orderId)}&amount=${amount}`);
  } else {
    return c.redirect(`/?payment_status=cancel&gateway=momo&order_id=${encodeURIComponent(orderId)}`);
  }
});
