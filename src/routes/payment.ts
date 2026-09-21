import { Hono } from 'hono';
import type { Env } from '../types';
import { hmacSHA512, hmacSHA256 } from '../utils/crypto';

export const paymentRouter = new Hono<Env>();

// Helper lấy thời gian thực GMT+7 (Asia/Ho_Chi_Minh) cho VNPay (vnp_CreateDate & vnp_ExpireDate)
// Cloudflare Worker chạy giờ UTC -> Cộng thêm 7 tiếng (7 * 60 * 60 * 1000) vào Date.now()
function getVnDates(): { createDate: string; expireDate: string } {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const format = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = pad(d.getUTCMonth() + 1);
    const day = pad(d.getUTCDate());
    const h = pad(d.getUTCHours());
    const min = pad(d.getUTCMinutes());
    const s = pad(d.getUTCSeconds());
    return `${y}${m}${day}${h}${min}${s}`;
  };

  const gmt7Time = Date.now() + 7 * 60 * 60 * 1000;
  const createDate = format(new Date(gmt7Time));
  const expireDate = format(new Date(gmt7Time + 15 * 60 * 1000));
  return { createDate, expireDate };
}

// Helper lấy IP client chuẩn IPv4 cho VNPay (loại bỏ hoàn toàn IPv6 gây lỗi VNPay sandbox)
function getClientIp(c: any): string {
  const forwarded = c.req.header('x-forwarded-for');
  let ip = forwarded ? forwarded.split(',')[0].trim() : '';
  if (!ip) ip = c.req.header('cf-connecting-ip') || '';
  if (!ip || ip.includes(':')) {
    ip = '127.0.0.1';
  }
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
    const vnp_TmnCode = c.env.VNPAY_TMN_CODE && !c.env.VNPAY_TMN_CODE.includes('<SET') ? c.env.VNPAY_TMN_CODE : 'T5GUNJMO';
    const vnp_HashSecret = c.env.VNPAY_HASH_SECRET && !c.env.VNPAY_HASH_SECRET.includes('<SET') ? c.env.VNPAY_HASH_SECRET : 'CVUTUJNGXAJVTAFASXYHRJTCXOQIIMON';
    const origin = body.returnOrigin || new URL(c.req.url).origin;
    const vnp_ReturnUrl = `${origin}/api/payment/vnpay/return`;

    const { createDate, expireDate } = getVnDates();

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
  const vnp_HashSecret = c.env.VNPAY_HASH_SECRET && !c.env.VNPAY_HASH_SECRET.includes('<SET') ? c.env.VNPAY_HASH_SECRET : 'CVUTUJNGXAJVTAFASXYHRJTCXOQIIMON';

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
    const vnp_HashSecret = c.env.VNPAY_HASH_SECRET && !c.env.VNPAY_HASH_SECRET.includes('<SET') ? c.env.VNPAY_HASH_SECRET : 'CVUTUJNGXAJVTAFASXYHRJTCXOQIIMON';

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

    const endpoint = c.env.MOMO_ENDPOINT && !c.env.MOMO_ENDPOINT.includes('<SET') ? c.env.MOMO_ENDPOINT : 'https://test-payment.momo.vn/v2/gateway/api/create';
    const partnerCode = c.env.MOMO_PARTNER_CODE && !c.env.MOMO_PARTNER_CODE.includes('<SET') ? c.env.MOMO_PARTNER_CODE : 'MOMO';
    const accessKey = c.env.MOMO_ACCESS_KEY && !c.env.MOMO_ACCESS_KEY.includes('<SET') ? c.env.MOMO_ACCESS_KEY : 'F8BBA842ECF85';
    let secretKey = c.env.MOMO_SECRET_KEY && !c.env.MOMO_SECRET_KEY.includes('<SET') ? c.env.MOMO_SECRET_KEY : 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    if (secretKey === 'K951B6PE1waDMi640xX08PD3vg6Ekvlz') {
      secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    }
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
