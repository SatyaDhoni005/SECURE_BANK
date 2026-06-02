# Secure Bank - Premium Digital Banking & Cryptographic Ledger System

Secure Bank is a state-of-the-art, high-security digital banking portal designed to handle secure transactions, real-time balance updates, multi-factor authorization, and offline ledger audits. The application features a premium dark glassmorphic design and has been built from the ground up to be fully responsive on mobile devices down to 320px width viewports (e.g., iPhone SE).

## 🎯 Project Highlights

- Full-Stack Banking Application
- React + Django REST Framework
- PostgreSQL Database
- Real-Time WebSockets
- Email OTP Authentication
- Virtual Card Management
- PDF Statement Generation
- Responsive Mobile Design

---

## Key System Features

### 1. Authentication & Multi-Factor Security

- **OTP Validation**: Secure sign-up, sign-in, password recovery, and secure parameter changes require verification via temporary One-Time Passwords (OTPs) dispatched to the user's registered email address.
- **Transaction PIN Protection**: Sensitive actions, such as unmasking account balances, performing outbound transfers, or changing system settings, require dynamic authorization via a custom 4-digit Transaction PIN.
- **User Block State**: The system temporarily blocks access to accounts if anomalous authentication patterns are detected.

### 2. Premium Interactive Dashboard

- **Glassmorphic UI**: High-fidelity dark gradient aesthetics using harmonized color palettes (Deep Navy `#0A2540` and Emerald Green `#10B981`) combined with micro-animations.
- **Balance Concealment**: Visual balances are masked by default (`₹ ********`) and require secure transaction PIN authorization to unlock.
- **Virtual Debit Card**: Displays cardholder parameters, card numbers, and expiration dates. Includes live active/frozen state toggles.
- **QR Companion Sync**: Generates a dynamic QR code mapping to a secure companion identity endpoint. Includes a clipboard copy button for rapid account sync.
- **Sliding Navigation Drawer**: Replaces standard absolute dropdown boxes on mobile to present profile info and audit logs in a clean sliding sidebar.

### 3. Outbound Transfer Gateway & WebSockets Sync

- **Recipient Search**: Instantly query transaction routes using a recipient's registered email, phone number, or account number.
- **Dynamic Limits**: Outbound transfers validate system parameters to prevent over-drafting.
- **Real-Time Updates**: Balance deductions and credit inflow notifications sync dynamically using WebSockets (Django Channels & Daphne).
- **Email Receipts**: Dispatches automated transaction credit/debit alerts to both parties with detailed cryptographic PDF receipts attached.

### 4. Audits & Certified Statements

- **Interactive Ledger Logs**: The `/transactions` portal allows users to search the cryptographic ledger by hash, description, or reference ID, and export records directly to CSV.
- **Certified PDF Statements**: Displays generated PDF statements at the end of each closed calendar month. Statements can be downloaded for offline review or shared via automated SMTP emails.

---

## Technology Stack

### Backend Mainframe (Python / Django)

- **Framework**: Django `6.0.5`
- **APIs**: Django REST Framework `3.17.1` (using SimpleJWT for session validation)
- **Real-time Engine**: Django Channels `4.3.2` & Daphne `4.2.1` (ASGI application server)
- **Database**: PostgreSQL (driver: `psycopg2-binary 2.9.12`)
- **Utilities**: `reportlab` (PDF generation) & `pillow` (image/QR generation)
- **Environment Loader**: `python-dotenv` (loads `.env` securely)

### Client Application (React / Vite)

- **Libraries**: React `19.2.6` & React DOM `19.2.6`
- **Build System**: Vite `8.0.12` (with Hot Module Replacement support)
- **Routing**: React Router DOM `7.16.0`
- **Animations**: Anime.js `4.4.1` (smooth transitions and hover states)
- **Icons**: Lucide React `1.17.0`
- **Styles**: Native Vanilla CSS

---

## Directory Structure

```text
Banking-APP/
├── backend/                  # Django backend mainframe application
│   ├── accounts/             # User authentication, transactions, and statements app
│   │   ├── migrations/       # Database schema migrations
│   │   ├── models.py         # Database model definitions (User, Transaction, OTP)
│   │   ├── views.py          # API View controllers (Login, PIN, transfers, etc.)
│   │   └── utils.py          # SMTP email templates & PDF generation scripts
│   ├── backend/              # Core Django project settings and routing
│   │   ├── settings.py       # Configuration settings (CORS, simplejwt, database)
│   │   ├── urls.py           # URL mapping definitions
│   │   └── asgi.py           # Daphne ASGI configuration
│   ├── manage.py             # Django CLI manager
│   └── .env                  # Backend environment secrets (SECRET_KEY, DB credentials)
│
├── frontend/                 # React frontend application
│   ├── public/               # Static assets (custom favicon.svg, icons.svg)
│   ├── src/
│   │   ├── assets/           # Client-side image and styles assets
│   │   ├── components/       # Reusable UI widgets (RecentTransactions, VirtualCard, QRCodeCard)
│   │   ├── pages/            # View pages (dashboard, Settings, Transfer, Statements, Transactions)
│   │   ├── services/         # API Service wrappers (Api.js)
│   │   └── main.jsx          # Entry point script
│   ├── package.json          # Frontend npm package dependencies
│   ├── vite.config.js        # Vite bundler configurations
│   └── .env                  # Frontend environment variables (VITE_API_URL)
│
├── venv/                     # Python virtual environment folder
├── .gitignore                # Global git ignore configuration
└── README.md                 # Project documentation
```

---

## Environment Configuration

Both backend and frontend apps run configurations loaded from local `.env` files. Ensure these exist before launching.

### Backend `.env` (`backend/.env.example`)

```env
SECRET_KEY=your_django_secret_key_here
DEBUG=True
DB_NAME=secure_bank_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
EMAIL_HOST_USER=your_gmail_address
EMAIL_HOST_PASSWORD=your_gmail_app_password
```

### Frontend `.env` (`frontend/.env.example`)

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Secure Bank
VITE_SUPPORT_EMAIL=support@securebank.com
```

---

## Installation & Setup Guide

### 1. Prerequisite Installations

- Install **Node.js** (v18+)
- Install **Python** (v3.11+)
- Set up a running **PostgreSQL** database server

### 2. Backend Mainframe Startup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   - **Windows Powershell**:
     ```powershell
     ..\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source ../venv/bin/activate
     ```
3. Run migrations to provision database models:
   ```bash
   python manage.py migrate
   ```
4. Start the development ASGI server (Daphne):
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

### 3. Frontend Client Startup

1. Open a new terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm package dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev -- --host
   ```
4. Access the web app in your browser at:
   `http://localhost:5173` or your network IP address.

---

## Verification & Testing

### Automated Test Suite

To run the automated Django test cases (covering OTP flows, PIN validation, debit/credit transactions, and PDF generation):

1. Navigate to the `backend/` folder.
2. Run the test suite:
   ```bash
   python manage.py test
   ```

### Production Compilation

To compile the client application assets for production delivery:

1. Navigate to the `frontend/` folder.
2. Build the optimized static assets:
   ```bash
   npm run build
   ```
   All static files will compile into the `frontend/dist/` directory, ready for Nginx or CDN deployment.
