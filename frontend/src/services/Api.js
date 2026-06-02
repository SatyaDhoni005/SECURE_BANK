/**
 * API service communicating with the Django backend.
 * Provides authentication, registration, and OTP verification capabilities.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
console.log("API_BASE:",API_BASE)
const LATENCY_MS = 1500;

export const ApiService = {
  /**
   * Registers user credentials and returns active JWT token sets.
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{success: boolean, access: string, refresh: string, user: object}>}
   */
  signIn: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/accounts/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password. Please verify your credentials.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Fetches protected bank account and owner details from the backend.
   * @returns {Promise<{name: string, account_number: string, balance: string, status: string}>}
   */
  getDashboardData: async () => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/dashboard/?_=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to retrieve account details.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Requests a secure verification OTP from the Django backend.
   * @param {string} email
   * @param {string} name
   * @returns {Promise<{success: boolean, message: string}>}
   */
  sendOTP: async (email, name) => {
    try {
      const response = await fetch(`${API_BASE}/accounts/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to dispatch verification OTP.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Registers a new user with the Django backend after confirming OTP.
   * @param {object} userData - { name, email, phone, dob, address, password, otp }
   * @returns {Promise<{success: boolean, message: string}>}
   */
  signUp: async (userData) => {
    try {
      const response = await fetch(`${API_BASE}/accounts/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please check your inputs.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Triggers generation and emailing of a new OTP verification code.
   * @param {string} email
   * @param {string} name
   * @returns {Promise<{success: boolean, message: string}>}
   */
  resendOTP: async (email, name) => {
    try {
      const response = await fetch(`${API_BASE}/accounts/resend-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Resend request failed.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Dispatches a password reset verification OTP code.
   * @param {string} email
   * @returns {Promise<{success: boolean, message: string}>}
   */
  forgotPasswordSendOTP: async (email) => {
    try {
      const response = await fetch(`${API_BASE}/accounts/forgot-password/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to dispatch reset verification OTP.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Verifies the password reset OTP code.
   * @param {string} email
   * @param {string} otp
   * @returns {Promise<{success: boolean, message: string}>}
   */
  forgotPasswordVerify: async (email, otp) => {
    try {
      const response = await fetch(`${API_BASE}/accounts/forgot-password/verify-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Confirms password reset using OTP verification token.
   * @param {string} email
   * @param {string} otp
   * @param {string} password
   * @returns {Promise<{success: boolean, message: string}>}
   */
  forgotPasswordReset: async (email, otp, password) => {
    try {
      const response = await fetch(`${API_BASE}/accounts/forgot-password/reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Dispatches a secure account deactivation authorization OTP.
   * @returns {Promise<{success: boolean, message: string}>}
   */
  deactivateSendOTP: async () => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/deactivate/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to dispatch deactivation verification OTP.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Suspends and deactivates the logged-in user wealth account.
   * @param {string} otp
   * @returns {Promise<{success: boolean, message: string}>}
   */
  deactivateAccount: async (otp) => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/deactivate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Account deactivation failed.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Requests a secure reactivation OTP code for a deactivated account.
   * @param {string} email
   * @returns {Promise<{success: boolean, message: string}>}
   */
  reactivateSendOTP: async (email) => {
    try {
      const response = await fetch(`${API_BASE}/accounts/reactivate/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to dispatch reactivation OTP.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Verifies the reactivation OTP code.
   * @param {string} email
   * @param {string} otp
   * @returns {Promise<{success: boolean, message: string}>}
   */
  reactivateVerifyOTP: async (email, otp) => {
    try {
      const response = await fetch(`${API_BASE}/accounts/reactivate/verify-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Reactivation OTP verification failed.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Confirms reactivation of the deactivated account.
   * @param {string} email
   * @param {string} otp
   * @returns {Promise<{success: boolean, message: string}>}
   */
  reactivateConfirm: async (email, otp) => {
    try {
      const response = await fetch(`${API_BASE}/accounts/reactivate/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm account reactivation.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Requests a secure password change authorization OTP.
   * @returns {Promise<{success: boolean, message: string}>}
   */
  changePasswordSendOTP: async () => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/change-password/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to dispatch password change verification OTP.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Confirms user password change after verifying OTP authorization.
   * @param {string} otp
   * @param {string} password
   * @returns {Promise<{success: boolean, message: string}>}
   */
  changePasswordConfirm: async (otp, password) => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/change-password/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Password update failed.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Configures a new 4-digit Transaction PIN.
   * @param {string} pin
   * @param {string} otp
   * @returns {Promise<{success: boolean, message: string}>}
   */
  createPIN: async (pin, otp) => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/pin/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pin, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to configure transaction PIN.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Updates the 4-digit Transaction PIN.
   * @param {string} oldPin
   * @param {string} newPin
   * @param {string} otp
   * @returns {Promise<{success: boolean, message: string}>}
   */
  changePIN: async (oldPin, newPin, otp) => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/pin/change/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ old_pin: oldPin, new_pin: newPin, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update transaction PIN.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Resets the Transaction PIN using login password.
   * @param {string} password
   * @param {string} newPin
   * @param {string} otp
   * @returns {Promise<{success: boolean, message: string}>}
   */
  resetPIN: async (password, newPin, otp) => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/pin/reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password, new_pin: newPin, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset transaction PIN.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Dispatches a secure transaction PIN configuration OTP.
   * @returns {Promise<{success: boolean, message: string}>}
   */
  sendPinOTP: async () => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/pin/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to dispatch transaction PIN OTP.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Verifies the 4-digit Transaction PIN.
   * @param {string} pin
   * @returns {Promise<{success: boolean, message: string}>}
   */
  verifyPIN: async (pin) => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/pin/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'PIN verification failed.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Fetches public identity details for a given account number.
   * @param {string} accountNumber
   * @returns {Promise<{account_holder: string, account_number: string, status: string}>}
   */
  getAccountIdentity: async (accountNumber) => {
    try {
      const response = await fetch(`${API_BASE}/accounts/identity/${accountNumber}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Identity retrieval failed.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network connection failed. Please ensure the backend server is running.');
    }
  },

  /**
   * Queries and verifies a ledger recipient (email or account number).
   * @param {string} recipient
   * @returns {Promise<{success: boolean, name: string, account_number: string, email: string}>}
   */
  verifyRecipient: async (recipient) => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/transfer/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipient }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed. Recipient not found.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Recipient verification network failure.');
    }
  },

  /**
   * Authorizes and executes an outbound ledger transfer.
   * @param {string} recipient
   * @param {number|string} amount
   * @param {string} remarks
   * @param {string} pin
   * @returns {Promise<{success: boolean, message: string, new_balance: number}>}
   */
  executeTransfer: async (recipient, amount, remarks, pin) => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/transfer/execute/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipient, amount, remarks, pin }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Outbound transfer execution failed.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Outbound transfer network failure.');
    }
  },

  /**
   * Fetches real-time ledger transaction logs for the authenticated user.
   * @returns {Promise<{success: boolean, transactions: Array}>}
   */
  getTransactions: async () => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/transactions/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transaction history.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Transaction history network failure.');
    }
  },

  /**
   * Fetches the dynamic list of completed monthly account statements.
   * @returns {Promise<{success: boolean, statements: Array}>}
   */
  getStatements: async () => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/statements/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dynamic account statements.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Statements list network failure.');
    }
  },

  /**
   * Triggers background mailing of a completed monthly statement PDF to the user's email.
   * @param {number} year
   * @param {number} month
   * @returns {Promise<{success: boolean, message: string}>}
   */
  emailStatement: async (year, month) => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/statements/email/${year}/${month}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to email certified account statement.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Email statement network failure.');
    }
  },

  /**
   * Toggles the frozen/active status of the virtual card.
   * @returns {Promise<{success: boolean, message: string, is_card_active: boolean, status: string}>}
   */
  freezeCard: async () => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/card/freeze/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle virtual card state.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Card freeze connection failure.');
    }
  },

  /**
   * Regenerates a new CVV code for the virtual card.
   * @returns {Promise<{success: boolean, message: string, card_cvv: string}>}
   */
  regenerateCVV: async () => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/card/cvv/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to regenerate virtual card CVV.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'CVV regeneration connection failure.');
    }
  },

  /**
   * Replaces the virtual card, generating a new number, new CVV, and setting it to active.
   * @returns {Promise<{success: boolean, message: string, card_number: string, card_cvv: string, is_card_active: boolean, card_created_at: string}>}
   */
  replaceCard: async () => {
    try {
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(`${API_BASE}/accounts/card/replace/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to replace virtual card.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Replace card connection failure.');
    }
  }
};
