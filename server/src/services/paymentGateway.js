import crypto from 'crypto';

/**
 * Custom Payment Gateway Service
 * Handles multiple payment methods without external APIs
 * Supports: Credit Card, UPI, Wallet
 */

// Payment method types
const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  UPI: 'upi',
  WALLET: 'wallet'
};

// Transaction status
const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

/**
 * Generate a unique transaction ID
 */
function generateTransactionId() {
  return 'TXN' + Date.now() + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Validate credit card number (Luhn algorithm)
 */
function validateCreditCard(cardNumber) {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate expiry date
 */
function validateExpiry(expiry) {
  const [month, year] = expiry.split('/').map(Number);
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (month < 1 || month > 12) return false;
  if (year < currentYear || (year === currentYear && month < currentMonth)) return false;

  return true;
}

/**
 * Validate CVV
 */
function validateCVV(cvv) {
  return /^\d{3,4}$/.test(cvv);
}

/**
 * Validate UPI ID
 */
function validateUPI(upiId) {
  return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/.test(upiId);
}

/**
 * Process credit card payment
 */
async function processCreditCard({ cardNumber, expiry, cvv, amount, name }) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Validate card details
  if (!validateCreditCard(cardNumber)) {
    throw new Error('Invalid credit card number');
  }

  if (!validateExpiry(expiry)) {
    throw new Error('Card has expired or invalid expiry date');
  }

  if (!validateCVV(cvv)) {
    throw new Error('Invalid CVV');
  }

  // Simulate 90% success rate
  if (Math.random() > 0.9) {
    throw new Error('Payment declined by bank');
  }

  return {
    success: true,
    transactionId: generateTransactionId(),
    maskedCard: '**** **** **** ' + cardNumber.slice(-4),
    message: 'Payment successful'
  };
}

/**
 * Process UPI payment
 */
async function processUPI({ upiId, amount }) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (!validateUPI(upiId)) {
    throw new Error('Invalid UPI ID');
  }

  // Simulate 95% success rate
  if (Math.random() > 0.95) {
    throw new Error('UPI transaction failed');
  }

  return {
    success: true,
    transactionId: generateTransactionId(),
    upiId: upiId,
    message: 'UPI payment successful'
  };
}

/**
 * Process wallet payment
 */
async function processWallet({ userId, amount, currentBalance }) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (currentBalance < amount) {
    throw new Error('Insufficient wallet balance');
  }

  return {
    success: true,
    transactionId: generateTransactionId(),
    previousBalance: currentBalance,
    newBalance: currentBalance - amount,
    message: 'Wallet payment successful'
  };
}

/**
 * Main payment processing function
 */
async function processPayment({ method, amount, ...paymentDetails }) {
  const transactionId = generateTransactionId();

  try {
    let result;

    switch (method) {
      case PAYMENT_METHODS.CREDIT_CARD:
        result = await processCreditCard(paymentDetails);
        break;
      case PAYMENT_METHODS.UPI:
        result = await processUPI(paymentDetails);
        break;
      case PAYMENT_METHODS.WALLET:
        result = await processWallet(paymentDetails);
        break;
      default:
        throw new Error('Unsupported payment method');
    }

    return {
      status: TRANSACTION_STATUS.SUCCESS,
      transactionId: result.transactionId,
      amount,
      method,
      ...result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: TRANSACTION_STATUS.FAILED,
      transactionId,
      amount,
      method,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Refund payment
 */
async function refundPayment(transactionId, amount) {
  // Simulate refund processing
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    status: TRANSACTION_STATUS.REFUNDED,
    originalTransactionId: transactionId,
    refundTransactionId: generateTransactionId(),
    amount,
    timestamp: new Date().toISOString()
  };
}

export {
  PAYMENT_METHODS,
  TRANSACTION_STATUS,
  processPayment,
  refundPayment,
  generateTransactionId,
  validateCreditCard,
  validateExpiry,
  validateCVV,
  validateUPI
};
