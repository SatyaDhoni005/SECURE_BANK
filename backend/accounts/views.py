import random
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.hashers import make_password, check_password
from .serializers import RegisterSerializer, LoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OTP, BankAccount, Transaction
from .utils import (
    send_otp_email,
    send_forgot_password_otp_email,
    send_deactivation_otp_email,
    send_reactivation_otp_email,
    send_change_password_otp_email,
    send_pin_config_otp_email,
)
from django.core.mail import send_mail


class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        print("Send OTP API HIT")
        email = request.data.get("email")
        name = request.data.get("name")

        if not email:
            return Response(
                {"success": False, "message": "Email address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ensure email is not already registered
        if User.objects.filter(email=email.lower()).exists():
            return Response(
                {
                    "success": False,
                    "message": "This email address is already registered with Secure Bank.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            send_otp_email(email.lower(), full_name=name)
            return Response(
                {
                    "success": True,
                    "message": "A secure verification OTP has been sent to your email.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": f"Encountered an email delivery issue: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        otp_code = request.data.get("otp")

        if not email or not otp_code:
            return Response(
                {
                    "success": False,
                    "message": "Email and OTP verification code are required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # 1. OTP Verified
            otp_record = OTP.objects.filter(
                email=email.lower(),
                otp=otp_code,
                is_verified=False,
                expires_at__gt=timezone.now(),
            ).first()

            if not otp_record:
                return Response(
                    {
                        "success": False,
                        "message": "Invalid or expired OTP verification code. Please try again.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # 2. serializer.is_valid()
            serializer = RegisterSerializer(data=request.data)
            if not serializer.is_valid():
                # Extract first validation error message to return to UI alert banner
                error_msg = "Registration failed. Please check your information."
                if serializer.errors:
                    first_field = list(serializer.errors.keys())[0]
                    errors_list = serializer.errors[first_field]
                    if isinstance(errors_list, list) and len(errors_list) > 0:
                        error_msg = errors_list[0]
                    elif isinstance(errors_list, dict):
                        nested_first = list(errors_list.keys())[0]
                        error_msg = errors_list[nested_first][0]
                    else:
                        error_msg = str(errors_list)
                return Response(
                    {"success": False, "message": error_msg},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # 3. validated_data
            validated_data = serializer.validated_data

            # Auto-generate unique username from email prefix for Django AbstractUser compatibility
            signup_email = validated_data["email"]
            username = signup_email.split("@")[0]

            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            # 4. User.objects.create_user()
            user = User.objects.create_user(
                username=username,
                email=signup_email,
                first_name=validated_data[
                    "name"
                ],  # Store Full Name inside standard first_name
                phone=validated_data["phone"],
                date_of_birth=validated_data["dob"],
                address=validated_data["address"],
                password=validated_data["password"],
            )
            user.is_verified = True
            user.save()

            # Mark the OTP as successfully consumed
            otp_record.is_verified = True
            otp_record.save()

            # 5. BankAccount.objects.create()
            current_year = timezone.now().year
            acct_num = f"SBK{current_year}{random.randint(1, 9999999):07d}"
            while BankAccount.objects.filter(account_number=acct_num).exists():
                acct_num = f"SBK{current_year}{random.randint(1, 9999999):07d}"

            BankAccount.objects.create(
                user=user,
                account_number=acct_num,
                balance=500.00,  # $500 Welcome savings bonus!
                status="ACTIVE",
            )

            # Log the initial savings welcome credit as a Transaction
            ref_id = f"TXN-{random.randint(1000, 9999)}"
            while Transaction.objects.filter(reference_id=ref_id).exists():
                ref_id = f"TXN-{random.randint(1000, 9999)}"

            Transaction.objects.create(
                sender=None,
                receiver=user,
                amount=500.00,
                remarks="Vault Compliance Credit",
                reference_id=ref_id,
            )

            return Response(
                {
                    "success": True,
                    "message": "Account successfully verified and created! Redirecting to secure login.",
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"success": False, "message": f"Registration error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        name = request.data.get("name")
        print("Resend otp called for email:", email)
        if not email:
            return Response(
                {"success": False, "message": "Email address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        print("Resend otp called for email:", email)
        # Ensure email is not already registered
        if User.objects.filter(email=email.lower()).exists():
            return Response(
                {
                    "success": False,
                    "message": "This email address is already registered.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            send_otp_email(email.lower(), full_name=name)
            return Response(
                {
                    "success": True,
                    "message": "A fresh 6-digit OTP code has been sent to your email.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"success": False, "message": f"Failed to send email: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            error_msg = "Login failed. Please check your credentials."
            if serializer.errors:
                first_field = list(serializer.errors.keys())[0]
                error_msg = serializer.errors[first_field][0]
                if isinstance(error_msg, list) and len(error_msg) > 0:
                    error_msg = error_msg[0]
                else:
                    error_msg = str(error_msg)
            return Response(
                {"success": False, "message": error_msg},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"].lower()
        user = User.objects.filter(email=email).first()

        if not user:
            return Response(
                {"success": False, "message": "Invalid email or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "success": True,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "name": user.first_name,  # RegisterView stores full_name inside first_name
                    "email": user.email,
                },
            },
            status=status.HTTP_200_OK,
        )


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        # Safely fetch the bank account
        bank_account = getattr(user, "bank_account", None)

        if not bank_account:
            # Create a mock account dynamically in the premium SBK format if not present
            current_year = timezone.now().year
            acct_num = f"SBK{current_year}{random.randint(1, 9999999):07d}"
            while BankAccount.objects.filter(account_number=acct_num).exists():
                acct_num = f"SBK{current_year}{random.randint(1, 9999999):07d}"

            bank_account = BankAccount.objects.create(
                user=user, account_number=acct_num, balance=500.00, status="ACTIVE"
            )
        elif bank_account.account_number.startswith("9821"):
            # Automatically migrate legacy old-format accounts to the new premium SBK format!
            current_year = (
                bank_account.created_at.year
                if bank_account.created_at
                else timezone.now().year
            )
            acct_num = f"SBK{current_year}{random.randint(1, 9999999):07d}"
            while BankAccount.objects.filter(account_number=acct_num).exists():
                acct_num = f"SBK{current_year}{random.randint(1, 9999999):07d}"

            bank_account.account_number = acct_num
            bank_account.save()

        # Ensure card details exist in the BankAccount model
        if not bank_account.card_number:
            import hashlib

            user_hash = hashlib.sha256(user.username.encode()).hexdigest()
            # Derive 12 digits deterministically from username hash
            numeric_suffix = str(int(user_hash[:15], 16))[:12]
            if len(numeric_suffix) < 12:
                numeric_suffix = numeric_suffix.ljust(12, "5")
            # Format as a standard 16-digit card number: 9821 XXXX XXXX XXXX
            card_num = f"9821 {numeric_suffix[:4]} {numeric_suffix[4:8]} {numeric_suffix[8:12]}"
            bank_account.card_number = card_num
            bank_account.card_cvv = "392"
            bank_account.is_card_active = True
            bank_account.save()

        # Format masked card number for dashboard
        raw_card = bank_account.card_number
        parts = raw_card.split()
        masked_card = (
            f"{parts[0]} **** **** {parts[3]}"
            if len(parts) == 4
            else "9821 **** **** 0000"
        )

        # Format relative created date or default
        created_str = (
            bank_account.card_created_at.strftime("%d %b %Y")
            if bank_account.card_created_at
            else "01 Jun 2026"
        )

        # Find the last outgoing transaction by user
        last_txn = (
            Transaction.objects.filter(sender=user).order_by("-created_at").first()
        )
        last_used_str = (
            last_txn.created_at.strftime("%d %b %Y") if last_txn else "Never"
        )

        # Determine host machine's local network IP for external scannability (Google Lens, iPhone Camera, etc.)
        import socket

        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("10.255.255.255", 1))
            local_ip = s.getsockname()[0]
        except Exception:
            local_ip = "127.0.0.1"
        finally:
            s.close()

        return Response(
            {
                "name": user.first_name if user.first_name else user.username,
                "account_number": bank_account.account_number,
                "card_number": bank_account.card_number,
                "masked_card_number": masked_card,
                "card_cvv": bank_account.card_cvv,
                "is_card_active": bank_account.is_card_active,
                "card_created_at": created_str,
                "card_last_used": last_used_str,
                "balance": str(bank_account.balance),
                "status": bank_account.status,
                "pin_created": user.pin_created,
                "local_ip": local_ip,
            },
            status=status.HTTP_200_OK,
        )


class ForgotPasswordSendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")

        if not email:
            return Response(
                {"success": False, "message": "Email address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email.lower()).first()
        if not user:
            return Response(
                {
                    "success": False,
                    "message": "No account with this email exists in our records.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                {
                    "success": False,
                    "message": "This account is inactive. Please contact support.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            send_forgot_password_otp_email(user.email, full_name=user.first_name)
            return Response(
                {
                    "success": True,
                    "message": "A secure password reset OTP has been sent to your email.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": f"Encountered an email delivery issue: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ForgotPasswordVerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        otp_code = request.data.get("otp")

        if not email or not otp_code:
            return Response(
                {"success": False, "message": "Email and OTP code are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_record = OTP.objects.filter(
            email=email.lower(),
            otp=otp_code,
            is_verified=False,
            expires_at__gt=timezone.now(),
        ).first()

        if not otp_record:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or expired verification OTP. Please try again.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark as verified in this transition state
        otp_record.is_verified = True
        otp_record.save()

        return Response(
            {
                "success": True,
                "message": "OTP verification successful. Proceed to set your new password.",
            },
            status=status.HTTP_200_OK,
        )


class ForgotPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        otp_code = request.data.get("otp")
        password = request.data.get("password")

        if not email or not otp_code or not password:
            return Response(
                {
                    "success": False,
                    "message": "Email, OTP verification, and new password are required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify that the OTP record exists, is verified, and corresponds to this session
        otp_record = OTP.objects.filter(
            email=email.lower(),
            otp=otp_code,
            is_verified=True,
        ).first()

        if not otp_record:
            return Response(
                {
                    "success": False,
                    "message": "Verification session has expired or is invalid. Please restart the flow.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate password strength requirements on the backend
        if len(password) < 8:
            return Response(
                {
                    "success": False,
                    "message": "Password must be at least 8 characters long.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        import re

        if (
            not re.search(r"[A-Z]", password)
            or not re.search(r"[a-z]", password)
            or not re.search(r"[0-9]", password)
            or not re.search(r"[^A-Za-z0-9]", password)
        ):
            return Response(
                {
                    "success": False,
                    "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email.lower()).first()
        if not user:
            return Response(
                {
                    "success": False,
                    "message": "Associated wealth account was not found.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update the password securely
        user.set_password(password)
        user.save()

        # Delete consumed OTP record
        otp_record.delete()

        return Response(
            {
                "success": True,
                "message": "Your password has been successfully updated. Redirecting to sign in.",
            },
            status=status.HTTP_200_OK,
        )


class DeactivateSendOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        try:
            send_deactivation_otp_email(user.email, full_name=user.first_name)
            return Response(
                {
                    "success": True,
                    "message": "A secure deactivation authorization OTP has been sent to your email.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": f"Failed to deliver secure authorization OTP: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DeactivateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        otp_code = request.data.get("otp")

        if not otp_code:
            return Response(
                {
                    "success": False,
                    "message": "Secure deactivation verification OTP is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_record = OTP.objects.filter(
            email=user.email,
            otp=otp_code,
            is_verified=False,
            expires_at__gt=timezone.now(),
        ).first()

        if not otp_record:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or expired deactivation OTP. Authorization denied.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark user as inactive to suspend login portal access
        user.is_active = False
        user.save()

        # Mark BankAccount status as FROZEN or CLOSED for consistency
        bank_account = getattr(user, "bank_account", None)
        if bank_account:
            bank_account.status = "CLOSED"
            bank_account.save()

        # Delete consumed OTP record
        otp_record.delete()

        return Response(
            {
                "success": True,
                "message": "Your Secure Bank wealth account has been deactivated. Online access is suspended.",
            },
            status=status.HTTP_200_OK,
        )


class ReactivateSendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")

        if not email:
            return Response(
                {"success": False, "message": "Email address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email.lower()).first()
        if not user:
            return Response(
                {
                    "success": False,
                    "message": "No account with this email exists in our records.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.is_active:
            return Response(
                {
                    "success": False,
                    "message": "This account is already active. You can sign in directly.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            send_reactivation_otp_email(user.email, full_name=user.first_name)
            return Response(
                {
                    "success": True,
                    "message": "A secure reactivation OTP has been sent to your email.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": f"Encountered an email delivery issue: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ReactivateVerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        otp_code = request.data.get("otp")

        if not email or not otp_code:
            return Response(
                {"success": False, "message": "Email and OTP code are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_record = OTP.objects.filter(
            email=email.lower(),
            otp=otp_code,
            is_verified=False,
            expires_at__gt=timezone.now(),
        ).first()

        if not otp_record:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or expired reactivation OTP. Please try again.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark as verified in this transition state
        otp_record.is_verified = True
        otp_record.save()

        return Response(
            {
                "success": True,
                "message": "OTP verification successful. Proceed to reactivate your account.",
            },
            status=status.HTTP_200_OK,
        )


class ReactivateConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        otp_code = request.data.get("otp")

        if not email or not otp_code:
            return Response(
                {
                    "success": False,
                    "message": "Email and OTP verification are required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify that the OTP record exists, is verified, and corresponds to this session
        otp_record = OTP.objects.filter(
            email=email.lower(),
            otp=otp_code,
            is_verified=True,
        ).first()

        if not otp_record:
            return Response(
                {
                    "success": False,
                    "message": "Verification session has expired or is invalid. Please restart the flow.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email.lower()).first()
        if not user:
            return Response(
                {
                    "success": False,
                    "message": "Associated wealth account was not found.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Reactivate user and restore status
        user.is_active = True
        user.save()

        bank_account = getattr(user, "bank_account", None)
        if bank_account:
            bank_account.status = "ACTIVE"
            bank_account.save()

        # Delete consumed OTP record
        otp_record.delete()

        return Response(
            {
                "success": True,
                "message": "Your Secure Bank wealth account has been successfully reactivated! Please sign in.",
            },
            status=status.HTTP_200_OK,
        )


class ChangePasswordSendOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        try:
            send_change_password_otp_email(user.email, full_name=user.first_name)
            return Response(
                {
                    "success": True,
                    "message": "A secure password change OTP has been sent to your email.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": f"Failed to deliver secure authorization OTP: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChangePasswordConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        otp_code = request.data.get("otp")
        password = request.data.get("password")

        if not otp_code or not password:
            return Response(
                {
                    "success": False,
                    "message": "Secure OTP verification and new password are required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_record = OTP.objects.filter(
            email=user.email,
            otp=otp_code,
            is_verified=False,
            expires_at__gt=timezone.now(),
        ).first()

        if not otp_record:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or expired password change OTP. Authorization denied.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate password strength requirements on the backend
        if len(password) < 8:
            return Response(
                {
                    "success": False,
                    "message": "Password must be at least 8 characters long.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Set new password
        user.set_password(password)
        user.save()

        # Delete consumed OTP
        otp_record.delete()

        return Response(
            {
                "success": True,
                "message": "Your password has been successfully updated. Redirecting to sign in.",
            },
            status=status.HTTP_200_OK,
        )


class PinSendOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        try:
            send_pin_config_otp_email(user.email, full_name=user.first_name)
            return Response(
                {
                    "success": True,
                    "message": "A secure Transaction PIN verification OTP has been sent to your email.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": f"Failed to deliver secure authorization OTP: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CreatePINView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        pin = request.data.get("pin")
        otp_code = request.data.get("otp")

        if user.pin_created:
            return Response(
                {
                    "success": False,
                    "message": "Transaction PIN is already configured. Use Change PIN instead.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not pin or len(pin) != 4 or not pin.isdigit():
            return Response(
                {
                    "success": False,
                    "message": "Transaction PIN must be exactly 4 numeric digits.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not otp_code:
            return Response(
                {
                    "success": False,
                    "message": "Security verification OTP code is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate the OTP
        otp_record = OTP.objects.filter(
            email=user.email,
            otp=otp_code,
            is_verified=False,
            expires_at__gt=timezone.now(),
        ).first()

        if not otp_record:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or expired Transaction PIN OTP. Authorization denied.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.transaction_pin = make_password(pin)
        user.pin_created = True
        user.pin_created_at = timezone.now()
        user.save()

        # Delete consumed OTP
        otp_record.delete()

        return Response(
            {
                "success": True,
                "message": "Transaction PIN has been successfully configured and secured.",
            },
            status=status.HTTP_200_OK,
        )


class ChangePINView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        old_pin = request.data.get("old_pin")
        new_pin = request.data.get("new_pin")
        otp_code = request.data.get("otp")

        if not user.pin_created or not user.transaction_pin:
            return Response(
                {
                    "success": False,
                    "message": "No transaction PIN has been configured yet.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not old_pin or not new_pin:
            return Response(
                {
                    "success": False,
                    "message": "Both current PIN and new PIN are required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not check_password(old_pin, user.transaction_pin):
            return Response(
                {
                    "success": False,
                    "message": "Incorrect current Transaction PIN.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_pin) != 4 or not new_pin.isdigit():
            return Response(
                {
                    "success": False,
                    "message": "New PIN must be exactly 4 numeric digits.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not otp_code:
            return Response(
                {
                    "success": False,
                    "message": "Security verification OTP code is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate the OTP
        otp_record = OTP.objects.filter(
            email=user.email,
            otp=otp_code,
            is_verified=False,
            expires_at__gt=timezone.now(),
        ).first()

        if not otp_record:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or expired Transaction PIN OTP. Authorization denied.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.transaction_pin = make_password(new_pin)
        user.pin_created_at = timezone.now()
        user.save()

        # Delete consumed OTP
        otp_record.delete()

        return Response(
            {
                "success": True,
                "message": "Transaction PIN successfully updated.",
            },
            status=status.HTTP_200_OK,
        )


class ResetPINView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        password = request.data.get("password")
        new_pin = request.data.get("new_pin")
        otp_code = request.data.get("otp")

        if not password or not new_pin:
            return Response(
                {
                    "success": False,
                    "message": "Security password and new PIN are required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(password):
            return Response(
                {
                    "success": False,
                    "message": "Invalid password verification. Authorization denied.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_pin) != 4 or not new_pin.isdigit():
            return Response(
                {
                    "success": False,
                    "message": "New PIN must be exactly 4 numeric digits.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not otp_code:
            return Response(
                {
                    "success": False,
                    "message": "Security verification OTP code is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate the OTP
        otp_record = OTP.objects.filter(
            email=user.email,
            otp=otp_code,
            is_verified=False,
            expires_at__gt=timezone.now(),
        ).first()

        if not otp_record:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or expired Transaction PIN OTP. Authorization denied.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.transaction_pin = make_password(new_pin)
        user.pin_created = True
        user.pin_created_at = timezone.now()
        user.save()

        # Delete consumed OTP
        otp_record.delete()

        return Response(
            {
                "success": True,
                "message": "Transaction PIN successfully reset and updated.",
            },
            status=status.HTTP_200_OK,
        )


class VerifyPINView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from django.utils import timezone

        user = request.user
        pin = request.data.get("pin")

        if not pin:
            return Response(
                {
                    "success": False,
                    "message": "Transaction PIN is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.pin_created or not user.transaction_pin:
            return Response(
                {
                    "success": False,
                    "message": "Transaction PIN has not been configured.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Check if the user is currently locked out
        if user.pin_locked_until and user.pin_locked_until > timezone.now():
            remaining_seconds = int(
                (user.pin_locked_until - timezone.now()).total_seconds()
            )
            remaining_minutes = (remaining_seconds // 60) + 1
            return Response(
                {
                    "success": False,
                    "message": f"Account PIN verification is locked. Please try again in {remaining_minutes} minute(s).",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Reset expired lockout metadata
        if user.pin_locked_until:
            user.pin_locked_until = None
            user.failed_pin_attempts = 0
            user.save()

        # 3. Check PIN
        if check_password(pin, user.transaction_pin):
            user.failed_pin_attempts = 0
            user.save()
            return Response(
                {
                    "success": True,
                    "message": "PIN verified successfully.",
                },
                status=status.HTTP_200_OK,
            )
        else:
            user.failed_pin_attempts += 1
            if user.failed_pin_attempts >= 3:
                user.pin_locked_until = timezone.now() + timezone.timedelta(minutes=5)
                user.save()
                return Response(
                    {
                        "success": False,
                        "message": "Incorrect Transaction PIN. Account locked for 5 minutes.",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            else:
                user.save()
                attempts_left = 3 - user.failed_pin_attempts
                return Response(
                    {
                        "success": False,
                        "message": f"Incorrect Transaction PIN. {attempts_left} attempt(s) remaining.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )


class VerifyRecipientView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        recipient = request.data.get("recipient")
        if not recipient:
            return Response(
                {
                    "success": False,
                    "message": "Recipient email or account number is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        recipient = recipient.strip()

        user_match = None
        account_match = None

        # 1. Search by Email
        if "@" in recipient:
            user_match = User.objects.filter(email__iexact=recipient).first()
            if user_match:
                account_match = BankAccount.objects.filter(user=user_match).first()
        else:
            # 2. Search by Phone Number
            cleaned_phone = "".join(c for c in recipient if c.isdigit())
            if cleaned_phone:
                # Look for phone number matching or containing the digits
                user_match = User.objects.filter(phone__icontains=cleaned_phone).first()
                if user_match:
                    account_match = BankAccount.objects.filter(user=user_match).first()

            # 3. Search by Account Number (fallback)
            if not account_match:
                cleaned_acct = recipient.replace("-", "").replace(" ", "").upper()
                account_match = BankAccount.objects.filter(
                    account_number__iexact=cleaned_acct
                ).first()
                if account_match:
                    user_match = account_match.user

        if not account_match or not user_match:
            return Response(
                {
                    "success": False,
                    "message": "Recipient not found in the Secure Bank database.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if user_match == request.user:
            return Response(
                {
                    "success": False,
                    "message": "Self-transfers are not permitted. Please specify another recipient.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "name": (
                    user_match.first_name
                    if user_match.first_name
                    else f"{user_match.username}"
                ),
                "account_number": account_match.account_number,
                "email": user_match.email,
            },
            status=status.HTTP_200_OK,
        )


class ExecuteTransferView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from decimal import Decimal
        from django.db import transaction

        user = request.user
        recipient = request.data.get("recipient")
        amount_raw = request.data.get("amount")
        remarks = request.data.get("remarks", "")
        pin = request.data.get("pin")

        if not recipient or not amount_raw or not pin:
            return Response(
                {
                    "success": False,
                    "message": "Recipient, amount, and Transaction PIN are required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = Decimal(str(amount_raw))
            if amount <= Decimal("0.00"):
                raise ValueError()
        except (ValueError, TypeError):
            return Response(
                {
                    "success": False,
                    "message": "Transfer amount must be a positive number.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Enforce Per-Transaction Limit of ₹50,000
        if amount > Decimal("50000.00"):
            return Response(
                {
                    "success": False,
                    "message": "Transfer failed. Transaction amount exceeds the per-transaction limit of ₹50,000.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Enforce Daily Limit of ₹2,00,000
        from django.utils import timezone
        import datetime
        from django.db.models import Sum

        today_start = timezone.make_aware(
            datetime.datetime.combine(datetime.date.today(), datetime.time.min)
        )
        today_end = timezone.make_aware(
            datetime.datetime.combine(datetime.date.today(), datetime.time.max)
        )

        today_sent_total = Transaction.objects.filter(
            sender=user, created_at__range=(today_start, today_end)
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        if today_sent_total + amount > Decimal("200000.00"):
            remaining_limit = Decimal("200000.00") - today_sent_total
            return Response(
                {
                    "success": False,
                    "message": f"Transfer failed. Daily transfer limit of ₹2,00,000 would be exceeded. You can send up to ₹{remaining_limit:,.2f} more today.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.pin_created or not user.transaction_pin:
            return Response(
                {
                    "success": False,
                    "message": "You must create a Transaction PIN first from PIN Management.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Check if the user is currently locked out
        if user.pin_locked_until and user.pin_locked_until > timezone.now():
            remaining_seconds = int(
                (user.pin_locked_until - timezone.now()).total_seconds()
            )
            remaining_minutes = (remaining_seconds // 60) + 1
            return Response(
                {
                    "success": False,
                    "message": f"Account PIN verification is locked. Please try again in {remaining_minutes} minute(s).",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 4. Reset expired lockout metadata
        if user.pin_locked_until:
            user.pin_locked_until = None
            user.failed_pin_attempts = 0
            user.save()

        # 5. Check PIN
        if check_password(pin, user.transaction_pin):
            user.failed_pin_attempts = 0
            user.save()
        else:
            user.failed_pin_attempts += 1
            if user.failed_pin_attempts >= 3:
                user.pin_locked_until = timezone.now() + timezone.timedelta(minutes=5)
                user.save()
                return Response(
                    {
                        "success": False,
                        "message": "Incorrect Transaction PIN. Account locked for 5 minutes.",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            else:
                user.save()
                attempts_left = 3 - user.failed_pin_attempts
                return Response(
                    {
                        "success": False,
                        "message": f"Incorrect Transaction PIN. {attempts_left} attempt(s) remaining.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        sender_account = BankAccount.objects.filter(user=user).first()
        if not sender_account:
            return Response(
                {"success": False, "message": "Sender bank account not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        recipient = recipient.strip()
        user_match = None
        receiver_account = None

        # 1. Search by Email
        if "@" in recipient:
            user_match = User.objects.filter(email__iexact=recipient).first()
            if user_match:
                receiver_account = BankAccount.objects.filter(user=user_match).first()
        else:
            # 2. Search by Phone Number
            cleaned_phone = "".join(c for c in recipient if c.isdigit())
            if cleaned_phone:
                user_match = User.objects.filter(phone__icontains=cleaned_phone).first()
                if user_match:
                    receiver_account = BankAccount.objects.filter(
                        user=user_match
                    ).first()

            # 3. Search by Account Number (fallback)
            if not receiver_account:
                cleaned_acct = recipient.replace("-", "").replace(" ", "").upper()
                receiver_account = BankAccount.objects.filter(
                    account_number__iexact=cleaned_acct
                ).first()
                if receiver_account:
                    user_match = receiver_account.user

        if not receiver_account or not user_match:
            return Response(
                {"success": False, "message": "Recipient not found in database."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user_match == user:
            return Response(
                {"success": False, "message": "Self-transfers are not permitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                sender_acc_locked = BankAccount.objects.select_for_update().get(
                    id=sender_account.id
                )
                receiver_acc_locked = BankAccount.objects.select_for_update().get(
                    id=receiver_account.id
                )

                if sender_acc_locked.balance < amount:
                    return Response(
                        {
                            "success": False,
                            "message": f"Insufficient funds. Your current balance is ${sender_acc_locked.balance:.2f}.",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                sender_acc_locked.balance -= amount
                receiver_acc_locked.balance += amount

                sender_acc_locked.save()
                receiver_acc_locked.save()

                # Generate a unique cryptographic transaction reference ID
                ref_id = f"TXN-{random.randint(1000, 9999)}"
                while Transaction.objects.filter(reference_id=ref_id).exists():
                    ref_id = f"TXN-{random.randint(1000, 9999)}"

                # Log the active ledger transaction
                txn_record = Transaction.objects.create(
                    sender=user,
                    receiver=user_match,
                    amount=amount,
                    remarks=remarks,
                    reference_id=ref_id,
                )

                sender_remaining = sender_acc_locked.balance
                receiver_new_balance = receiver_acc_locked.balance

            from .utils import send_debit_alert_email, send_credit_alert_email

            sender_name = user.first_name if user.first_name else user.username
            receiver_name = (
                user_match.first_name if user_match.first_name else user_match.username
            )

            send_debit_alert_email(
                sender_email=user.email,
                sender_name=sender_name,
                receiver_name=receiver_name,
                receiver_account=receiver_acc_locked.account_number,
                amount=amount,
                remaining_balance=sender_remaining,
                remarks=remarks,
                transaction=txn_record,
            )

            send_credit_alert_email(
                receiver_email=user_match.email,
                receiver_name=receiver_name,
                sender_name=sender_name,
                sender_account=sender_acc_locked.account_number,
                amount=amount,
                remaining_balance=receiver_new_balance,
                remarks=remarks,
                transaction=txn_record,
            )

            # Trigger WebSockets real-time broadcasts for both users
            try:
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
                from django.utils import timezone
                from datetime import date

                def format_relative_date(dt):
                    local_dt = timezone.localtime(dt)
                    today_val = date.today()
                    dt_date = local_dt.date()
                    if dt_date == today_val:
                        return f"Today, {local_dt.strftime('%I:%M %p')}"
                    elif dt_date == today_val - timezone.timedelta(days=1):
                        return f"Yesterday, {local_dt.strftime('%I:%M %p')}"
                    else:
                        return local_dt.strftime("%b %d, %I:%M %p")

                channel_layer = get_channel_layer()
                if channel_layer:
                    # Sender group broadcast
                    async_to_sync(channel_layer.group_send)(
                        f"user_{user.id}",
                        {
                            "type": "transaction_update",
                            "data": {
                                "type": "balance_and_transaction",
                                "balance": f"{sender_remaining:.2f}",
                                "transaction": {
                                    "id": txn_record.reference_id,
                                    "description": f"Outbound Transfer to {receiver_name}",
                                    "type": "debit",
                                    "amount": f"{amount:.2f}",
                                    "date": format_relative_date(txn_record.created_at),
                                    "remarks": remarks,
                                },
                            },
                        },
                    )

                    # Receiver group broadcast
                    async_to_sync(channel_layer.group_send)(
                        f"user_{user_match.id}",
                        {
                            "type": "transaction_update",
                            "data": {
                                "type": "balance_and_transaction",
                                "balance": f"{receiver_new_balance:.2f}",
                                "transaction": {
                                    "id": txn_record.reference_id,
                                    "description": f"Inbound Transfer from {sender_name}",
                                    "type": "credit",
                                    "amount": f"{amount:.2f}",
                                    "date": format_relative_date(txn_record.created_at),
                                    "remarks": remarks,
                                },
                            },
                        },
                    )
            except Exception as ws_err:
                import logging

                logger = logging.getLogger(__name__)
                logger.error(f"WebSocket live updates broadcast failed: {str(ws_err)}")

            return Response(
                {
                    "success": True,
                    "message": f"Successfully authorized transfer of ${amount:.2f} to {receiver_name}.",
                    "new_balance": sender_remaining,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"success": False, "message": f"Database transaction failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TransactionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from django.db.models import Q
        from django.utils import timezone
        from datetime import date

        user = request.user

        # Get all transactions involving the user
        transactions = Transaction.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).order_by("-created_at")

        def format_relative_date(dt):
            local_dt = timezone.localtime(dt)
            today_val = date.today()
            dt_date = local_dt.date()
            if dt_date == today_val:
                return f"Today, {local_dt.strftime('%I:%M %p')}"
            elif dt_date == today_val - timezone.timedelta(days=1):
                return f"Yesterday, {local_dt.strftime('%I:%M %p')}"
            else:
                return local_dt.strftime("%b %d, %I:%M %p")

        txn_list = []
        for txn in transactions:
            is_debit = txn.sender == user

            # Format descriptions matching screenshot branding
            if not txn.sender:
                description = "Vault Compliance Credit"
            elif is_debit:
                description = f"Outbound Transfer to {txn.receiver.first_name or txn.receiver.username}"
            else:
                description = f"Inbound Transfer from {txn.sender.first_name or txn.sender.username}"

            txn_list.append(
                {
                    "id": txn.reference_id,
                    "description": description,
                    "type": "debit" if is_debit else "credit",
                    "amount": f"{txn.amount:.2f}",
                    "date": format_relative_date(txn.created_at),
                    "remarks": txn.remarks,
                }
            )

        return Response(
            {"success": True, "transactions": txn_list}, status=status.HTTP_200_OK
        )


class StatementListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        import datetime
        from django.utils import timezone

        user = request.user

        # Calculate closed statement periods from user creation date
        start_date = user.created_at or timezone.now()
        current_date = timezone.now()

        statements = []
        year, month = start_date.year, start_date.month
        curr_year, curr_month = current_date.year, current_date.month

        # Collect past completed/closed months
        while (year < curr_year) or (year == curr_year and month < curr_month):
            period_date = datetime.date(year, month, 1)
            period_str = period_date.strftime("%B %Y")

            if month == 12:
                next_month_date = datetime.date(year + 1, 1, 1)
            else:
                next_month_date = datetime.date(year, month + 1, 1)

            issued_str = next_month_date.strftime("%B %d, %Y")

            # Formulate deterministic sizes for screenshots
            mock_sizes = ["2.4 MB", "2.1 MB", "2.3 MB", "1.9 MB"]
            size_str = mock_sizes[(year + month) % len(mock_sizes)]

            statements.append(
                {
                    "period": period_str,
                    "date": issued_str,
                    "size": size_str,
                    "year": year,
                    "month": month,
                    "download_url": f"http://localhost:8000/api/accounts/statements/download/{year}/{month}/",
                }
            )

            # Step month forward
            if month == 12:
                year += 1
                month = 1
            else:
                month += 1

        # Always append the current active calendar month as an ongoing/real-time statement period
        active_date = datetime.date(curr_year, curr_month, 1)
        active_period_str = active_date.strftime("%B %Y")
        statements.append(
            {
                "period": f"{active_period_str} (Ongoing)",
                "date": "Real-time",
                "size": "In Progress",
                "year": curr_year,
                "month": curr_month,
                "download_url": f"http://localhost:8000/api/accounts/statements/download/{curr_year}/{curr_month}/",
            }
        )

        statements.reverse()
        return Response(
            {"success": True, "statements": statements}, status=status.HTTP_200_OK
        )


class DownloadStatementPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, year, month, *args, **kwargs):
        user = request.user

        try:
            year = int(year)
            month = int(month)
        except ValueError:
            return Response(
                {"success": False, "message": "Invalid statement period parameters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from .utils import generate_monthly_statement_pdf
            from django.http import HttpResponse

            pdf_bytes = generate_monthly_statement_pdf(user, year, month)

            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = (
                f'attachment; filename="Statement-{year}-{month:02d}.pdf"'
            )
            return response
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": f"Failed to generate statement download: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EmailStatementPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, year, month, *args, **kwargs):
        from django.conf import settings

        user = request.user

        try:
            year = int(year)
            month = int(month)
        except ValueError:
            return Response(
                {"success": False, "message": "Invalid statement period parameters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from .utils import generate_monthly_statement_pdf, send_mail_async
            import datetime

            period_date = datetime.date(year, month, 1)
            period_str = period_date.strftime("%B %Y")

            pdf_bytes = generate_monthly_statement_pdf(user, year, month)

            subject = f"Secure Bank - Certified Monthly Statement Audit ({period_str})"
            message = (
                f"Hello {user.first_name or user.username},\n\n"
                f"As requested, please find attached your certified monthly statement audit report for the period of {period_str}.\n\n"
                f"This document is a secure, official cryptographic record generated from the Secure Bank mainframe ledger accounts.\n\n"
                f"If you notice any discrepancies, please raise an audit query with our secure ledger support control.\n\n"
                f"Best regards,\n"
                f"Secure Bank Mainframe Operations"
            )

            html_message = f"""
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #333333;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h1 style="color: #0a2540; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Secure Bank</h1>
                    <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">❇️ Certified Monthly Statement</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 25px;" />
                <p style="font-size: 16px; line-height: 1.6; color: #0a2540; margin-bottom: 20px;">Hello <strong>{user.first_name or user.username}</strong>,</p>
                <p style="font-size: 15px; line-height: 1.6; color: #333333; margin-bottom: 25px;">
                    Per your request, we have exported your certified monthly statement audit report for <strong>{period_str}</strong> from the secure banking ledger vaults.
                </p>
                
                <p style="font-size: 15px; line-height: 1.6; color: #333333; margin-bottom: 25px;">
                    The dynamic ledger audit document is attached to this email as a PDF file. You can download and keep it for offline security compliance and record-keeping.
                </p>
                
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
                <p style="font-size: 14px; color: #64748b; margin-bottom: 5px;">Best regards,</p>
                <p style="font-size: 14px; font-weight: 700; color: #0a2540; margin-top: 0;">Secure Bank Ledger Security Control</p>
            </div>
            """

            filename = f"Statement-{year}-{month:02d}.pdf"
            attachments = [(filename, pdf_bytes, "application/pdf")]

            from_email = getattr(
                settings,
                "DEFAULT_FROM_EMAIL",
                getattr(settings, "EMAIL_HOST_USER", "security@securebank.com"),
            )
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=[user.email],
                html_message=html_message,
                attachments=attachments,
            )

            print(
                f"[EMAIL SENT] MONTHLY STATEMENT PDF EXPORTED TO {user.email} FOR {period_str}"
            )

            return Response(
                {
                    "success": True,
                    "message": f"Certified monthly statement for {period_str} has been successfully sent to your email address ({user.email}).",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"success": False, "message": f"Failed to export statement: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class FreezeUnfreezeCardView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        bank_account = getattr(request.user, "bank_account", None)
        if not bank_account:
            return Response(
                {"success": False, "message": "Bank account not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        bank_account.is_card_active = not bank_account.is_card_active
        bank_account.save()

        status_str = "ACTIVE" if bank_account.is_card_active else "FROZEN"
        return Response(
            {
                "success": True,
                "message": f"Virtual card has been successfully {'unfrozen' if bank_account.is_card_active else 'frozen'}.",
                "is_card_active": bank_account.is_card_active,
                "status": status_str,
            },
            status=status.HTTP_200_OK,
        )


class RegenerateCvvView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        bank_account = getattr(request.user, "bank_account", None)
        if not bank_account:
            return Response(
                {"success": False, "message": "Bank account not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        import random

        new_cvv = f"{random.randint(100, 999)}"
        bank_account.card_cvv = new_cvv
        bank_account.save()

        return Response(
            {
                "success": True,
                "message": "CVV regenerated successfully.",
                "card_cvv": new_cvv,
            },
            status=status.HTTP_200_OK,
        )


class ReplaceCardView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        bank_account = getattr(request.user, "bank_account", None)
        if not bank_account:
            return Response(
                {"success": False, "message": "Bank account not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        import random

        numeric_suffix = f"{random.randint(100000000000, 999999999999)}"
        new_card_num = (
            f"9821 {numeric_suffix[:4]} {numeric_suffix[4:8]} {numeric_suffix[8:12]}"
        )
        new_cvv = f"{random.randint(100, 999)}"

        bank_account.card_number = new_card_num
        bank_account.card_cvv = new_cvv
        bank_account.is_card_active = True
        from django.utils import timezone

        bank_account.card_created_at = timezone.now()
        bank_account.save()

        return Response(
            {
                "success": True,
                "message": "Virtual debit card replaced successfully. Old parameters invalidated.",
                "card_number": new_card_num,
                "card_cvv": new_cvv,
                "is_card_active": True,
                "card_created_at": bank_account.card_created_at.strftime("%d %b %Y"),
            },
            status=status.HTTP_200_OK,
        )


class AccountIdentityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, account_number, *args, **kwargs):
        try:
            bank_account = BankAccount.objects.select_related("user").get(
                account_number=account_number
            )
            user = bank_account.user
            full_name = f"{user.first_name} {user.last_name}".strip()
            if not full_name:
                full_name = user.username

            return Response(
                {
                    "account_holder": full_name,
                    "account_number": bank_account.account_number,
                    "status": bank_account.status,
                },
                status=status.HTTP_200_OK,
            )
        except BankAccount.DoesNotExist:
            return Response(
                {"success": False, "message": "Account identity not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
