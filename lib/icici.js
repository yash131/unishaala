/**
 * ICICI Orange Payment Gateway - Clean Implementation
 * Handles all ICICI payment operations including:
 * - Payment initiation
 * - Callback verification
 * - Status checking
 * - Refund processing
 */

import crypto from 'crypto';

// ICICI Configuration from environment
const getConfig = () => ({
  merchantId: process.env.ICICI_MID,
  aggregatorId: process.env.ICICI_AGG_ID,
  secretKey: process.env.ICICI_KEY,
  saleApiUrl: process.env.ICICI_SALE_API || 'https://pgpayuat.icicibank.com/tsp/pg/api/v2/initiateSale',
  commandApiUrl: process.env.ICICI_COMMAND_API || 'https://pgpayuat.icicibank.com/tsp/pg/api/command',
});

/**
 * Generate HMAC-SHA256 hash for ICICI requests
 * @param {string} data - Data string to hash
 * @param {string} key - Secret key
 * @returns {string} Hex-encoded hash
 */
export function generateHash(data, key) {
  return crypto.createHmac('sha256', key)
    .update(data, 'utf8')
    .digest('hex');
}

/**
 * Verify HMAC-SHA256 hash from ICICI response
 * @param {string} data - Original data
 * @param {string} receivedHash - Hash received from ICICI
 * @param {string} key - Secret key
 * @returns {boolean} True if hash matches
 */
export function verifyHash(data, receivedHash, key) {
  const expectedHash = generateHash(data, key);
  return crypto.timingSafeEqual(
    Buffer.from(expectedHash, 'hex'),
    Buffer.from(receivedHash, 'hex')
  );
}

/**
 * Format date as YYYYMMDDHHMMSS for ICICI
 * @returns {string} Formatted date
 */
export function formatTxnDate() {
  const now = new Date();
  return now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
}

/**
 * Generate unique merchant transaction number
 * Format: 12 digit numeric string
 * @returns {string} Transaction number
 */
export function generateMerchantTxnNo() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return timestamp + random;
}

/**
 * Format phone number for ICICI (91XXXXXXXXXX)
 * @param {string} phone - Input phone number
 * @returns {string} Formatted phone
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '919999999999';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) return '91' + cleaned;
  if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned;
  return '919999999999';
}

/**
 * Initiate a payment with ICICI
 * @param {Object} params - Payment parameters
 * @returns {Promise<Object>} ICICI response with payment URL
 */
export async function initiatePayment({
  merchantTxnNo,
  amount,
  customerEmail,
  customerName,
  customerMobile,
  returnUrl,
  addlParam1 = '000',
  addlParam2 = '111'
}) {
  const config = getConfig();
  const txnDate = formatTxnDate();
  const amountStr = parseFloat(amount).toFixed(2);
  const formattedPhone = formatPhoneNumber(customerMobile);
  const cleanName = (customerName || 'Customer').replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50);
  
  // Hash generation - alphabetically sorted fields:
  // addlParam1 + addlParam2 + aggregatorID + amount + currencyCode + customerEmailID + 
  // customerMobileNo + customerName + merchantId + merchantTxnNo + 
  // payType + returnURL + transactionType + txnDate
  const hashText = addlParam1 + addlParam2 + config.aggregatorId + amountStr + '356' + 
    customerEmail + formattedPhone + cleanName + config.merchantId + 
    merchantTxnNo + '0' + returnUrl + 'SALE' + txnDate;
  
  const secureHash = generateHash(hashText, config.secretKey);

  console.log('=== ICICI Payment Initiation ===');
  console.log('merchantTxnNo:', merchantTxnNo);
  console.log('amount:', amountStr);
  console.log('returnUrl:', returnUrl);
  console.log('hashText:', hashText);
  console.log('secureHash:', secureHash);

  const payload = {
    merchantId: config.merchantId,
    aggregatorID: config.aggregatorId,
    merchantTxnNo,
    amount: amountStr,
    currencyCode: '356',
    payType: '0',
    customerEmailID: customerEmail,
    transactionType: 'SALE',
    returnURL: returnUrl,
    txnDate,
    customerMobileNo: formattedPhone,
    customerName: cleanName,
    addlParam1,
    addlParam2,
    secureHash
  };

  try {
    const response = await fetch(config.saleApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('ICICI Response:', JSON.stringify(result, null, 2));

    if (result.responseCode === 'R1000' && result.redirectURI) {
      return {
        success: true,
        paymentUrl: `${result.redirectURI}?tranCtx=${result.tranCtx}`,
        tranCtx: result.tranCtx,
        merchantTxnNo,
        rawResponse: result
      };
    } else {
      return {
        success: false,
        error: result.respDescription || result.errorMsg || 'Payment initiation failed',
        rawResponse: result
      };
    }
  } catch (error) {
    console.error('ICICI API Error:', error);
    return {
      success: false,
      error: error.message || 'Connection to payment gateway failed'
    };
  }
}

/**
 * Check payment status with ICICI Command API
 * @param {string} merchantTxnNo - Transaction number
 * @returns {Promise<Object>} Status response
 */
export async function checkPaymentStatus(merchantTxnNo) {
  const config = getConfig();
  
  // Hash: aggregatorID + merchantId + merchantTxnNo + transactionType
  const hashText = config.aggregatorId + config.merchantId + merchantTxnNo + 'STATUS';
  const secureHash = generateHash(hashText, config.secretKey);

  console.log('=== ICICI Status Check ===');
  console.log('merchantTxnNo:', merchantTxnNo);
  console.log('hashText:', hashText);

  const payload = {
    merchantId: config.merchantId,
    aggregatorID: config.aggregatorId,
    merchantTxnNo,
    transactionType: 'STATUS',
    secureHash
  };

  try {
    const response = await fetch(config.commandApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();
    console.log('ICICI Status Raw:', rawText);

    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      return { success: false, error: 'Invalid response from ICICI', rawResponse: rawText };
    }

    // Determine status
    let status = 'PENDING';
    if (result.responseCode === '0000' || result.txnStatus === 'SUC') {
      status = 'SUCCESS';
    } else if (result.txnStatus === 'FAL' || (result.responseCode && result.responseCode !== '0000' && result.responseCode !== 'P0001')) {
      status = 'FAILED';
    }

    return {
      success: true,
      status,
      merchantTxnNo,
      iciciTxnId: result.txnID || result.paymentID,
      responseCode: result.responseCode,
      responseDescription: result.respDescription,
      rawResponse: result
    };
  } catch (error) {
    console.error('ICICI Status Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Parse ICICI callback data (form-encoded or JSON)
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object>} Parsed callback data
 */
export async function parseCallback(request) {
  const contentType = request.headers.get('content-type') || '';
  let data = {};

  try {
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
    } else {
      data = await request.json().catch(() => ({}));
    }
  } catch (e) {
    // Try URL-encoded parsing
    try {
      const text = await request.text();
      const params = new URLSearchParams(text);
      for (const [key, value] of params.entries()) {
        data[key] = value;
      }
    } catch {
      console.error('Failed to parse callback:', e);
    }
  }

  console.log('=== Parsed ICICI Callback ===');
  console.log(JSON.stringify(data, null, 2));

  return data;
}

/**
 * Determine payment status from callback data
 * @param {Object} data - Callback data
 * @returns {Object} Status info
 */
export function determineStatus(data) {
  const responseCode = data.responseCode || data.txnResponseCode;
  const txnStatus = data.txnStatus;
  const description = data.respDescription || data.txnRespDescription || '';

  const isSuccess = txnStatus === 'SUC' || responseCode === '0000';
  const isPending = txnStatus === 'PEN';

  return {
    status: isSuccess ? 'SUCCESS' : (isPending ? 'PENDING' : 'FAILED'),
    isSuccess,
    responseCode,
    description,
    iciciTxnId: data.txnID || data.paymentID,
    authCode: data.txnAuthID || data.authCode,
    paymentMethod: data.paymentMode,
    paymentSubType: data.paymentSubInstType,
    paymentDateTime: data.paymentDateTime,
    otherCharges: data.oth_charge
  };
}

export default {
  generateHash,
  verifyHash,
  formatTxnDate,
  generateMerchantTxnNo,
  formatPhoneNumber,
  initiatePayment,
  checkPaymentStatus,
  parseCallback,
  determineStatus
};
