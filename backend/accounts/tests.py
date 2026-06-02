from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from accounts.models import BankAccount, Transaction, OTP
import datetime
from django.contrib.auth.hashers import make_password

User = get_user_model()

class LedgerAndStatementsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create primary test user
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@securebank.com",
            first_name="Test User",
            phone="+1234567890",
            date_of_birth=datetime.date(1995, 5, 10),
            address="123 Financial Blvd",
            password="securepassword123"
        )
        self.user.is_verified = True
        self.user.transaction_pin = make_password("1234")
        self.user.pin_created = True
        self.user.pin_created_at = timezone.now()
        self.user.save()

        # Create user's BankAccount
        self.user_account = BankAccount.objects.create(
            user=self.user,
            account_number="SBK20261234567",
            balance=1000.00,
            status="ACTIVE"
        )

        # Create secondary receiver user
        self.receiver = User.objects.create_user(
            username="receiver",
            email="receiver@securebank.com",
            first_name="Receiver User",
            phone="+9876543210",
            date_of_birth=datetime.date(1998, 8, 18),
            address="456 Ledger Lane",
            password="securepassword456"
        )
        self.receiver.is_verified = True
        self.receiver.save()

        self.receiver_account = BankAccount.objects.create(
            user=self.receiver,
            account_number="SBK20267654321",
            balance=500.00,
            status="ACTIVE"
        )

        # JWT authenticate client for requests
        self.client.force_authenticate(user=self.user)

    def test_signup_welcome_credit_prepopulation(self):
        """
        Verify that registering a new user creates a BankAccount with $500 savings welcome credit
        and pre-populates a matching Transaction ledger record of 'Vault Compliance Credit'.
        """
        # Unauthenticate client to test signup
        self.client.force_authenticate(user=None)

        email = "newclient@securebank.com"
        otp_code = "654321"
        
        # Insert OTP record in test database
        OTP.objects.create(
            email=email,
            otp=otp_code,
            is_verified=False,
            expires_at=timezone.now() + timezone.timedelta(minutes=5)
        )

        signup_data = {
            "name": "New Client",
            "email": email,
            "phone": "+1999999999",
            "dob": "1990-01-01",
            "address": "789 Compliance Rd",
            "password": "strongpassword99",
            "otp": otp_code
        }

        response = self.client.post(reverse("signup"), signup_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])

        # Check user database
        new_user = User.objects.get(email=email)
        self.assertTrue(new_user.is_verified)

        # Check BankAccount & welcome credit
        account = BankAccount.objects.get(user=new_user)
        self.assertEqual(account.balance, 500.00)

        # Check Transaction ledger
        welcome_txn = Transaction.objects.get(receiver=new_user)
        self.assertNilSender = welcome_txn.sender is None
        self.assertTrue(self.assertNilSender)
        self.assertEqual(welcome_txn.amount, 500.00)
        self.assertEqual(welcome_txn.remarks, "Vault Compliance Credit")
        self.assertTrue(welcome_txn.reference_id.startswith("TXN-"))

    def test_transaction_history_view(self):
        """
        Verify that TransactionHistoryView correctly returns all debits and credits relative-formatted.
        """
        # Create an inflow (credit) transaction
        Transaction.objects.create(
            sender=self.receiver,
            receiver=self.user,
            amount=150.00,
            remarks="Inflow payment",
            reference_id="TXN-9001"
        )

        # Create an outflow (debit) transaction
        Transaction.objects.create(
            sender=self.user,
            receiver=self.receiver,
            amount=50.00,
            remarks="Outflow expense",
            reference_id="TXN-9002"
        )

        response = self.client.get(reverse("transactions_history"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        
        txns = response.data["transactions"]
        self.assertEqual(len(txns), 2)
        
        # Verify formats and calculations
        debit_txn = next(t for t in txns if t["id"] == "TXN-9002")
        self.assertEqual(debit_txn["type"], "debit")
        self.assertEqual(debit_txn["amount"], "50.00")
        self.assertEqual(debit_txn["remarks"], "Outflow expense")
        self.assertIn("Outbound Transfer", debit_txn["description"])

        credit_txn = next(t for t in txns if t["id"] == "TXN-9001")
        self.assertEqual(credit_txn["type"], "credit")
        self.assertEqual(credit_txn["amount"], "150.00")
        self.assertEqual(credit_txn["remarks"], "Inflow payment")
        self.assertIn("Inbound Transfer", credit_txn["description"])

    def test_statement_list_view_and_download(self):
        """
        Verify StatementListView computes statements desde registration date up to previous month,
        and DownloadStatementPDFView generates the certified monthly audit PDF successfully.
        """
        # Deterministically set registration date to 3 months ago so statements are generated
        three_months_ago = timezone.now() - timezone.timedelta(days=90)
        User.objects.filter(pk=self.user.pk).update(created_at=three_months_ago)
        
        # Refresh self.user and re-authenticate to clear in-memory cache
        self.user.refresh_from_db()
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(reverse("statements_list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        
        statements = response.data["statements"]
        # Should have at least 1 or 2 completed closed calendar months
        self.assertGreater(len(statements), 0)
        
        first_stmt = statements[0]
        self.assertIn("year", first_stmt)
        self.assertIn("month", first_stmt)
        self.assertIn("download_url", first_stmt)

        # Attempt downloading the PDF statement
        download_url = reverse("statement_download_pdf", kwargs={"year": first_stmt["year"], "month": first_stmt["month"]})
        pdf_response = self.client.get(download_url)
        
        self.assertEqual(pdf_response.status_code, status.HTTP_200_OK)
        self.assertEqual(pdf_response["Content-Type"], "application/pdf")
        self.assertTrue(len(pdf_response.content) > 0)
        self.assertIn(b"PDF", pdf_response.content[:10])  # Check standard PDF header bytes

    def test_execute_transfer_logging_and_alerts(self):
        """
        Verify that Executing a transfer dynamically locks, deducts sender, credits receiver,
        logs transaction record, and schedules async email dispatch.
        """
        transfer_data = {
            "recipient": self.receiver.email,
            "amount": 200.00,
            "remarks": "Services Rendered",
            "pin": "1234"
        }

        response = self.client.post(reverse("transfer_execute"), transfer_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(float(response.data["new_balance"]), 800.00)

        # Check receiver balance
        self.receiver_account.refresh_from_db()
        self.assertEqual(self.receiver_account.balance, 700.00)

        # Check transaction logging record
        txn = Transaction.objects.get(sender=self.user, receiver=self.receiver)
        self.assertEqual(txn.amount, 200.00)
        self.assertEqual(txn.remarks, "Services Rendered")
        self.assertTrue(txn.reference_id.startswith("TXN-"))

    def test_email_statement_pdf_view(self):
        """
        Verify EmailStatementPDFView successfully compiles monthly ledger PDF in memory and sends it.
        """
        three_months_ago = timezone.now() - timezone.timedelta(days=90)
        User.objects.filter(pk=self.user.pk).update(created_at=three_months_ago)
        self.user.refresh_from_db()
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(reverse("statements_list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        first_stmt = response.data["statements"][0]
        
        email_url = reverse("statement_email_pdf", kwargs={"year": first_stmt["year"], "month": first_stmt["month"]})
        email_response = self.client.post(email_url)
        
        self.assertEqual(email_response.status_code, status.HTTP_200_OK)
        self.assertTrue(email_response.data["success"])
        self.assertIn("successfully sent", email_response.data["message"])

    def test_transfer_limits(self):
        """
        Verify that a single transfer exceeding ₹50,000 fails,
        and multiple transfers exceeding ₹2,00,000 in a single day are blocked.
        """
        # 1. Single transfer limit check (₹50,000)
        limit_data = {
            "recipient": self.receiver.email,
            "amount": 50001.00,
            "remarks": "Large Transfer Limit check",
            "pin": "1234"
        }
        response = self.client.post(reverse("transfer_execute"), limit_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("exceeds the per-transaction limit", response.data["message"])

        # 2. Daily accumulative limit check (₹2,00,000)
        self.user_account.balance = 300000.00
        self.user_account.save()

        # Let's create transactions sent today that add up to ₹1,80,000
        Transaction.objects.create(
            sender=self.user,
            receiver=self.receiver,
            amount=180000.00,
            remarks="Accumulating daily sent amount",
            reference_id="TXN-LIMIT-1"
        )

        # Now try to transfer ₹30,000 (total today would be ₹2,10,000)
        over_daily_data = {
            "recipient": self.receiver.email,
            "amount": 30000.00,
            "remarks": "Over Daily Limit check",
            "pin": "1234"
        }
        response2 = self.client.post(reverse("transfer_execute"), over_daily_data, format="json")
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Daily transfer limit of", response2.data["message"])

    def test_pin_lockout_mechanism(self):
        """
        Verify that entering 3 consecutive wrong PINs locks the account for 5 minutes,
        blocking PIN checks until the lockout period expires.
        """
        verify_url = reverse("pin_verify")

        # First incorrect PIN
        r1 = self.client.post(verify_url, {"pin": "9999"}, format="json")
        self.assertEqual(r1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("2 attempt(s) remaining", r1.data["message"])

        # Second incorrect PIN
        r2 = self.client.post(verify_url, {"pin": "8888"}, format="json")
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("1 attempt(s) remaining", r2.data["message"])

        # Third incorrect PIN -> triggers lockout
        r3 = self.client.post(verify_url, {"pin": "7777"}, format="json")
        self.assertEqual(r3.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Account locked for 5 minutes", r3.data["message"])

        # Check PIN verify block during active lockout
        r4 = self.client.post(verify_url, {"pin": "1234"}, format="json")
        self.assertEqual(r4.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Account PIN verification is locked", r4.data["message"])

        # Try executing transfer while locked
        transfer_data = {
            "recipient": self.receiver.email,
            "amount": 5.00,
            "remarks": "Transfer during lockout",
            "pin": "1234"
        }
        r5 = self.client.post(reverse("transfer_execute"), transfer_data, format="json")
        self.assertEqual(r5.status_code, status.HTTP_403_FORBIDDEN)

        # Mock-expire the lockout time in database
        six_minutes_ago = timezone.now() - timezone.timedelta(minutes=6)
        User.objects.filter(pk=self.user.pk).update(pin_locked_until=six_minutes_ago)
        self.user.refresh_from_db()

        # Validate that lockout has cleared and correct PIN is now accepted
        r6 = self.client.post(verify_url, {"pin": "1234"}, format="json")
        self.assertEqual(r6.status_code, status.HTTP_200_OK)

    def test_virtual_card_operations(self):
        """
        Verify the Virtual Card page endpoints for masking, freezing,
        CVV regeneration, and card replacing.
        """
        # Verify dashboard includes masked card number and details
        dash_response = self.client.get(reverse("dashboard"))
        self.assertEqual(dash_response.status_code, status.HTTP_200_OK)
        self.assertIn("masked_card_number", dash_response.data)
        self.assertTrue(dash_response.data["is_card_active"])
        self.assertEqual(dash_response.data["card_cvv"], "392")

        # 1. Freeze Virtual Card
        freeze_response = self.client.post(reverse("card_freeze"))
        self.assertEqual(freeze_response.status_code, status.HTTP_200_OK)
        self.assertFalse(freeze_response.data["is_card_active"])
        self.assertEqual(freeze_response.data["status"], "FROZEN")

        # 2. Unfreeze Virtual Card
        unfreeze_response = self.client.post(reverse("card_freeze"))
        self.assertEqual(unfreeze_response.status_code, status.HTTP_200_OK)
        self.assertTrue(unfreeze_response.data["is_card_active"])
        self.assertEqual(unfreeze_response.data["status"], "ACTIVE")

        # 3. Regenerate CVV
        cvv_response = self.client.post(reverse("card_cvv"))
        self.assertEqual(cvv_response.status_code, status.HTTP_200_OK)
        self.assertNotEqual(cvv_response.data["card_cvv"], "392")

        # 4. Replace Virtual Card
        old_card_num = dash_response.data["card_number"]
        replace_response = self.client.post(reverse("card_replace"))
        self.assertEqual(replace_response.status_code, status.HTTP_200_OK)
        self.assertNotEqual(replace_response.data["card_number"], old_card_num)
        self.assertTrue(replace_response.data["is_card_active"])

    def test_account_identity_endpoint(self):
        """
        Verify public retrieval of a bank account's identity using
        its account number.
        """
        # Create URL using reverse with argument
        url = reverse("account_identity", kwargs={"account_number": self.user_account.account_number})
        
        # Public request (without credentials)
        self.client.force_authenticate(user=None)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["account_holder"], "Test User")
        self.assertEqual(response.data["account_number"], self.user_account.account_number)
        self.assertEqual(response.data["status"], "ACTIVE")

        # Request with invalid account number
        invalid_url = reverse("account_identity", kwargs={"account_number": "SBK-9999-NOTFOUND"})
        response_invalid = self.client.get(invalid_url)
        self.assertEqual(response_invalid.status_code, status.HTTP_404_NOT_FOUND)



