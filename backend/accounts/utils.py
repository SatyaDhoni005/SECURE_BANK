import random
import string
import threading
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from .models import OTP


def send_mail_async(
    subject, message, from_email, recipient_list, html_message, attachments=None
):
    """
    Sends email asynchronously using a background thread so that SMTP connection
    delays or failures do not block the HTTP request thread. Supports file attachments.
    """
    from django.core.mail import EmailMessage

    def _send():
        try:
            print("Thread Started...")
            print("Attempting Email send")
            print(f"From: {from_email}")
            print(f"To: {recipient_list}")
            print(f"Subject: {subject}")
            print(f"Message: {message}")
            print(f"HTML message: {html_message}")
            print(f"Attachments: {attachments}")
            if attachments:
                email = EmailMessage(
                    subject=subject,
                    body=html_message or message,
                    from_email=from_email,
                    to=recipient_list,
                )
                if html_message:
                    email.content_subtype = "html"

                for filename, content, mimetype in attachments:
                    email.attach(filename, content, mimetype)

                email.send(fail_silently=False)
            else:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=from_email,
                    recipient_list=recipient_list,
                    html_message=html_message,
                    fail_silently=False,
                )
                print("Email Sent Successfully")
        except Exception as e:
            print("\n" + "!" * 60)
            print(f"[ERROR] SMTP SECURE MAIL DISPATCH ASYNC FAILURE: {str(e)}")
            print("!" * 60 + "\n")

    threading.Thread(target=_send, daemon=True).start()


def send_otp_email(email, full_name=None):
    """
    Generates a 6-digit secure OTP, deletes any previous active OTPs for the email,
    saves the new OTP in the database (valid for 5 minutes), and sends it to the user via email.
    """
    print("OTP Function Started")
    print("Email:", email)
    print("Full Name:", full_name)
    # 1. Generate a 6-digit numeric OTP
    otp_code = "".join(random.choices(string.digits, k=6))

    # 2. Set expiration time to 5 minutes from now
    expiration_time = timezone.now() + timezone.timedelta(minutes=5)

    # 3. Clean up any existing OTP records for this email to prevent spam/clutter
    OTP.objects.filter(email=email).delete()

    # 4. Save the new OTP to the database
    otp_record = OTP.objects.create(
        email=email, otp=otp_code, expires_at=expiration_time
    )

    # 5. Build and send the secure email
    subject = "Secure Bank - Your OTP Verification Code"

    # Personalize greeting
    greeting = f"Hello {full_name}," if full_name else "Hello,"

    # Elegant plain-text message
    message = (
        f"{greeting}\n\n"
        f"Thank you for choosing Secure Bank. To complete your secure registration, "
        f"please use the following One-Time Password (OTP):\n\n"
        f"🔐 Verification Code: {otp_code}\n\n"
        f"This OTP is highly confidential and valid for 5 minutes. "
        f"For your safety, do not share this code with anyone, including bank representatives.\n\n"
        f"Best regards,\n"
        f"Secure Bank Security Team"
    )

    # High-quality HTML formatted email
    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; color: #333333;">
        <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #1a73e8; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Secure Bank</h1>
            <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px;">Secure Wealth Portal</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin-bottom: 25px;" />
        <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 20px;">{greeting}</p>
        <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 25px;">To complete your secure registration, please use the following One-Time Password (OTP) to verify your email address:</p>
        
        <div style="text-align: center; background-color: #f4f6f9; border: 1px dashed #1a73e8; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1a73e8;">{otp_code}</span>
        </div>
        
        <p style="font-size: 13px; line-height: 1.5; color: #888888; background-color: #fff9e6; border-left: 4px solid #f2994a; padding: 12px; border-radius: 4px; margin-bottom: 25px;">
            <strong>⚠️ Security Notice:</strong> This code is valid for <strong>5 minutes</strong>. Never share this code with anyone. Secure Bank personnel will never ask for your OTP.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin-bottom: 20px;" />
        <p style="font-size: 14px; color: #666666; margin-bottom: 5px;">Best regards,</p>
        <p style="font-size: 14px; font-weight: 700; color: #333333; margin-top: 0;">Secure Bank Security Team</p>
    </div>
    """

    # Print the OTP clearly in the backend console so that local development and testing
    # is 100% possible even if SMTP settings are not active or internet is offline.
    print("\n" + "═" * 60)
    print(f"🔐 SECURE BANK GENERATED VERIFICATION OTP FOR {email}: {otp_code}")
    print("═" * 60 + "\n")

    # Send asynchronously using background thread
    from_email = getattr(
        settings,
        "DEFAULT_FROM_EMAIL",
        getattr(settings, "EMAIL_HOST_USER", "security@securebank.com"),
    )
    send_mail_async(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=[email],
        html_message=html_message,
    )

    return otp_record


def send_forgot_password_otp_email(email, full_name=None):
    """
    Generates a 6-digit secure OTP, deletes any previous active OTPs for the email,
    saves the new OTP in the database (valid for 5 minutes), and sends a password reset OTP email.
    """
    otp_code = "".join(random.choices(string.digits, k=6))
    expiration_time = timezone.now() + timezone.timedelta(minutes=5)
    OTP.objects.filter(email=email).delete()
    otp_record = OTP.objects.create(
        email=email, otp=otp_code, expires_at=expiration_time
    )

    subject = "Secure Bank - Password Reset Verification Code"
    greeting = f"Hello {full_name}," if full_name else "Hello,"
    message = (
        f"{greeting}\n\n"
        f"We received a request to reset the password for your Secure Bank account. "
        f"To verify this request, please use the following One-Time Password (OTP):\n\n"
        f"🔐 Verification Code: {otp_code}\n\n"
        f"This OTP is highly confidential and valid for 5 minutes. "
        f"If you did not request this, please secure your account immediately.\n\n"
        f"Best regards,\n"
        f"Secure Bank Security Team"
    )

    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; color: #333333;">
        <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #1a73e8; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Secure Bank</h1>
            <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px;">Secure Wealth Portal</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin-bottom: 25px;" />
        <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 20px;">{greeting}</p>
        <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 25px;">We received a request to reset your password. Please use the following One-Time Password (OTP) to complete the verification:</p>
        
        <div style="text-align: center; background-color: #f4f6f9; border: 1px dashed #1a73e8; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1a73e8;">{otp_code}</span>
        </div>
        
        <p style="font-size: 13px; line-height: 1.5; color: #888888; background-color: #fff9e6; border-left: 4px solid #f2994a; padding: 12px; border-radius: 4px; margin-bottom: 25px;">
            <strong>⚠️ Security Notice:</strong> This code is valid for <strong>5 minutes</strong>. If you did not make this request, please contact Secure Bank Support immediately.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin-bottom: 20px;" />
        <p style="font-size: 14px; color: #666666; margin-bottom: 5px;">Best regards,</p>
        <p style="font-size: 14px; font-weight: 700; color: #333333; margin-top: 0;">Secure Bank Security Team</p>
    </div>
    """

    print("\n" + "═" * 60)
    print(f"🔑 SECURE BANK PASSWORD RESET OTP FOR {email}: {otp_code}")
    print("═" * 60 + "\n")

    # Send asynchronously using background thread
    from_email = getattr(
        settings,
        "DEFAULT_FROM_EMAIL",
        getattr(settings, "EMAIL_HOST_USER", "security@securebank.com"),
    )
    send_mail_async(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=[email],
        html_message=html_message,
    )

    return otp_record


def send_deactivation_otp_email(email, full_name=None):
    """
    Generates a 6-digit secure OTP, deletes any previous active OTPs for the email,
    saves the new OTP in the database (valid for 5 minutes), and sends a deactivation warning OTP email.
    """
    otp_code = "".join(random.choices(string.digits, k=6))
    expiration_time = timezone.now() + timezone.timedelta(minutes=5)
    OTP.objects.filter(email=email).delete()
    otp_record = OTP.objects.create(
        email=email, otp=otp_code, expires_at=expiration_time
    )

    subject = "Secure Bank - Account Deactivation Request"
    greeting = f"Hello {full_name}," if full_name else "Hello,"
    message = (
        f"{greeting}\n\n"
        f"We received a request to deactivate your Secure Bank account. "
        f"To complete your deactivation request, please use the following One-Time Password (OTP):\n\n"
        f"🛡️ Deactivation Code: {otp_code}\n\n"
        f"This OTP is highly confidential and valid for 5 minutes. "
        f"If you did not request this, please report this immediately to prevent unauthorized access.\n\n"
        f"Best regards,\n"
        f"Secure Bank Security Team"
    )

    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #f5c2c2; border-radius: 12px; background-color: #fff8f8; color: #333333;">
        <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #d93025; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Secure Bank</h1>
            <p style="color: #d93025; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">Security Mainframe</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #f5c2c2; margin-bottom: 25px;" />
        <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 20px;">{greeting}</p>
        <p style="font-size: 16px; line-height: 1.6; color: #d93025; font-weight: 600; margin-bottom: 10px;">⚠️ CRITICAL ACTION: ACCOUNT DEACTIVATION REQUEST</p>
        <p style="font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 25px;">Please use the following One-Time Password (OTP) to authorize deactivation. Once authorized, your online portal access will be immediately suspended. Historical financial ledger details will be retained for regulatory compliance.</p>
        
        <div style="text-align: center; background-color: #ffffff; border: 2px solid #d93025; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #d93025;">{otp_code}</span>
        </div>
        
        <p style="font-size: 13px; line-height: 1.5; color: #888888; background-color: #fff9e6; border-left: 4px solid #f2994a; padding: 12px; border-radius: 4px; margin-bottom: 25px;">
            <strong>🛡️ Warning:</strong> This authorization expires in <strong>5 minutes</strong>. If you did not request this deactivation, please secure your login session and change your password immediately.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f5c2c2; margin-bottom: 20px;" />
        <p style="font-size: 14px; color: #666666; margin-bottom: 5px;">Best regards,</p>
        <p style="font-size: 14px; font-weight: 700; color: #333333; margin-top: 0;">Secure Bank Security Team</p>
    </div>
    """

    print("\n" + "═" * 60)
    print(f"🛑 SECURE BANK ACCOUNT DEACTIVATION OTP FOR {email}: {otp_code}")
    print("═" * 60 + "\n")

    # Send asynchronously using background thread
    from_email = getattr(
        settings,
        "DEFAULT_FROM_EMAIL",
        getattr(settings, "EMAIL_HOST_USER", "security@securebank.com"),
    )
    send_mail_async(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=[email],
        html_message=html_message,
    )

    return otp_record


def send_reactivation_otp_email(email, full_name=None):
    """
    Generates a 6-digit secure OTP, deletes any previous active OTPs for the email,
    saves the new OTP in the database (valid for 5 minutes), and sends a reactivation warning OTP email.
    """
    otp_code = "".join(random.choices(string.digits, k=6))
    expiration_time = timezone.now() + timezone.timedelta(minutes=5)
    OTP.objects.filter(email=email).delete()
    otp_record = OTP.objects.create(
        email=email, otp=otp_code, expires_at=expiration_time
    )

    subject = "Secure Bank - Account Reactivation Code"
    greeting = f"Hello {full_name}," if full_name else "Hello,"
    message = (
        f"{greeting}\n\n"
        f"Welcome back to Secure Bank! We received a request to reactivate your deactivated personal wealth portal.\n\n"
        f"To complete your reactivation request, please use the following One-Time Password (OTP):\n\n"
        f"✨ Reactivation Code: {otp_code}\n\n"
        f"This OTP is highly confidential and valid for 5 minutes.\n\n"
        f"Best regards,\n"
        f"Secure Bank Security Team"
    )

    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e0f2fe; border-radius: 12px; background-color: #f0fdf4; color: #333333;">
        <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #16a34a; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Secure Bank</h1>
            <p style="color: #15803d; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">Account Reactivation Desk</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #bbf7d0; margin-bottom: 25px;" />
        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">{greeting}</p>
        <p style="font-size: 16px; line-height: 1.6; color: #16a34a; font-weight: 600; margin-bottom: 10px;">✨ WELCOME BACK TO SECURE BANK ✨</p>
        <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 25px;">We are excited to have you back! Please use the following One-Time Password (OTP) to restore and reactivate your online portal access. Once authorized, your previous savings accounts and access keys will be fully operational.</p>
        
        <div style="text-align: center; background-color: #ffffff; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #16a34a;">{otp_code}</span>
        </div>
        
        <p style="font-size: 13px; line-height: 1.5; color: #6b7280; background-color: #fff9e6; border-left: 4px solid #f2994a; padding: 12px; border-radius: 4px; margin-bottom: 25px;">
            <strong>🛡️ Warning:</strong> This authorization OTP is confidential and valid for <strong>5 minutes</strong>. Never share this code with anyone.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #bbf7d0; margin-bottom: 20px;" />
        <p style="font-size: 14px; color: #4b5563; margin-bottom: 5px;">Best regards,</p>
        <p style="font-size: 14px; font-weight: 700; color: #1f2937; margin-top: 0;">Secure Bank Security Team</p>
    </div>
    """

    print("\n" + "═" * 60)
    print(f"✨ SECURE BANK ACCOUNT REACTIVATION OTP FOR {email}: {otp_code}")
    print("═" * 60 + "\n")

    # Send asynchronously using background thread
    from_email = getattr(
        settings,
        "DEFAULT_FROM_EMAIL",
        getattr(settings, "EMAIL_HOST_USER", "security@securebank.com"),
    )
    send_mail_async(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=[email],
        html_message=html_message,
    )

    return otp_record


def send_change_password_otp_email(email, full_name=None):
    """
    Generates a 6-digit secure OTP, deletes any previous active OTPs for the email,
    saves the new OTP in the database (valid for 5 minutes), and sends a password change OTP email.
    """
    otp_code = "".join(random.choices(string.digits, k=6))
    expiration_time = timezone.now() + timezone.timedelta(minutes=5)
    OTP.objects.filter(email=email).delete()
    otp_record = OTP.objects.create(
        email=email, otp=otp_code, expires_at=expiration_time
    )

    subject = "Secure Bank - Password Change Verification Code"
    greeting = f"Hello {full_name}," if full_name else "Hello,"
    message = (
        f"{greeting}\n\n"
        f"We received a request to change the password for your Secure Bank account.\n\n"
        f"To complete your password change request, please use the following One-Time Password (OTP):\n\n"
        f"🔐 Verification Code: {otp_code}\n\n"
        f"This OTP is highly confidential and valid for 5 minutes.\n\n"
        f"Best regards,\n"
        f"Secure Bank Security Team"
    )

    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; color: #333333;">
        <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #1a73e8; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Secure Bank</h1>
            <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px;">Security Mainframe</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin-bottom: 25px;" />
        <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 20px;">{greeting}</p>
        <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 25px;">To complete your password change authorization, please use the following One-Time Password (OTP) code:</p>
        
        <div style="text-align: center; background-color: #f4f6f9; border: 1px dashed #1a73e8; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1a73e8;">{otp_code}</span>
        </div>
        
        <p style="font-size: 13px; line-height: 1.5; color: #888888; background-color: #fff9e6; border-left: 4px solid #f2994a; padding: 12px; border-radius: 4px; margin-bottom: 25px;">
            <strong>⚠️ Security Notice:</strong> This code is valid for <strong>5 minutes</strong>. If you did not make this request, please change your login credentials immediately to secure your assets.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin-bottom: 20px;" />
        <p style="font-size: 14px; color: #666666; margin-bottom: 5px;">Best regards,</p>
        <p style="font-size: 14px; font-weight: 700; color: #333333; margin-top: 0;">Secure Bank Security Team</p>
    </div>
    """

    print("\n" + "═" * 60)
    print(f"🔐 SECURE BANK PASSWORD CHANGE OTP FOR {email}: {otp_code}")
    print("═" * 60 + "\n")

    # Send asynchronously using background thread
    from_email = getattr(
        settings,
        "DEFAULT_FROM_EMAIL",
        getattr(settings, "EMAIL_HOST_USER", "security@securebank.com"),
    )
    send_mail_async(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=[email],
        html_message=html_message,
    )

    return otp_record


def send_pin_config_otp_email(email, full_name=None):
    """
    Generates a secure 6-digit verification code, cleans up stale codes,
    saves the new record in the database, and emails the code asynchronously.
    """
    otp_code = "".join(random.choices(string.digits, k=6))
    expiration_time = timezone.now() + timezone.timedelta(minutes=5)
    OTP.objects.filter(email=email).delete()
    otp_record = OTP.objects.create(
        email=email, otp=otp_code, expires_at=expiration_time
    )

    subject = "Secure Bank - Transaction PIN Request Verification"
    greeting = f"Hello {full_name}," if full_name else "Hello,"
    message = (
        f"{greeting}\n\n"
        f"You have requested to configure, change, or reset your Transaction PIN on Secure Bank.\n"
        f"Please use the following One-Time Password (OTP) to authorize this security update:\n\n"
        f"🔐 Verification Code: {otp_code}\n\n"
        f"This code is confidential and valid for 5 minutes. Never share this code with anyone.\n\n"
        f"Best regards,\n"
        f"Secure Bank Security Team"
    )
    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; color: #333333;">
        <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #1a73e8; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Secure Bank</h1>
            <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px;">Transaction Security Control</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin-bottom: 25px;" />
        <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 20px;">{greeting}</p>
        <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 25px;">You have requested to configure, change, or reset your Transaction PIN on Secure Bank. Please use the following One-Time Password (OTP) to verify your request:</p>
        
        <div style="text-align: center; background-color: #f4f6f9; border: 1px dashed #1a73e8; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1a73e8;">{otp_code}</span>
        </div>
        
        <p style="font-size: 13px; line-height: 1.5; color: #888888; background-color: #fff9e6; border-left: 4px solid #f2994a; padding: 12px; border-radius: 4px; margin-bottom: 25px;">
            <strong>⚠️ Security Notice:</strong> This code is valid for <strong>5 minutes</strong>. Never share this code with anyone. Secure Bank personnel will never ask for your Transaction PIN or verification code.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin-bottom: 20px;" />
        <p style="font-size: 14px; color: #666666; margin-bottom: 5px;">Best regards,</p>
        <p style="font-size: 14px; font-weight: 700; color: #333333; margin-top: 0;">Secure Bank Security Team</p>
    </div>
    """

    print("\n" + "=" * 60)
    print(f"[SECURE PIN OTP] SECURE BANK TRANSACTION PIN OTP FOR {email}: {otp_code}")
    print("=" * 60 + "\n")

    from_email = getattr(
        settings,
        "DEFAULT_FROM_EMAIL",
        getattr(settings, "EMAIL_HOST_USER", "security@securebank.com"),
    )
    send_mail_async(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=[email],
        html_message=html_message,
    )

    return otp_record


def generate_transaction_receipt_pdf(transaction, is_debit):
    """
    Compiles a highly polished, branded PDF invoice receipt using ReportLab.
    Returns the binary content as bytes.
    """
    import io
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from django.utils import timezone

    buffer = io.BytesIO()

    # Page setup
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    story = []
    styles = getSampleStyleSheet()

    # Brand styles
    primary_color = colors.HexColor("#0A2540")  # Navy
    accent_green = colors.HexColor("#10B981")  # Green
    accent_red = colors.HexColor("#EF4444")  # Red
    text_dark = colors.HexColor("#1E293B")  # Charcoal
    text_muted = colors.HexColor("#64748B")  # Slate
    bg_light = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#E2E8F0")

    # Typography styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        textColor=primary_color,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=text_muted,
        spaceAfter=15,
    )

    heading_style = ParagraphStyle(
        "DocHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=primary_color,
        spaceAfter=8,
    )

    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=text_dark,
        leading=14,
    )

    body_bold = ParagraphStyle(
        "DocBodyBold", parent=body_style, fontName="Helvetica-Bold"
    )

    body_mono = ParagraphStyle(
        "DocBodyMono", parent=body_style, fontName="Courier", fontSize=9
    )

    # Document Header
    story.append(Paragraph("SECURE BANK", title_style))
    story.append(
        Paragraph("OFFICIAL TRANSACTION RECORD & AUDIT LEDGER", subtitle_style)
    )

    # Decorative line
    line_table = Table([[""]], colWidths=[500])
    line_table.setStyle(
        TableStyle(
            [
                ("LINEABOVE", (0, 0), (-1, -1), 1.5, primary_color),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(line_table)
    story.append(Spacer(1, 15))

    # Status Banner
    banner_bg = colors.HexColor("#FEE2E2") if is_debit else colors.HexColor("#D1FAE5")
    banner_border = (
        colors.HexColor("#FCA5A5") if is_debit else colors.HexColor("#A7F3D0")
    )
    banner_text_color = (
        colors.HexColor("#991B1B") if is_debit else colors.HexColor("#065F46")
    )
    banner_text = (
        "OUTBOUND DEBIT RECORD - FUNDS TRANSFERRED"
        if is_debit
        else "INBOUND CREDIT RECORD - FUNDS RECEIVED"
    )

    banner_style = ParagraphStyle(
        "BannerText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=banner_text_color,
        alignment=1,  # Centered
    )

    banner_p = Paragraph(banner_text, banner_style)
    banner_table = Table([[banner_p]], colWidths=[500])
    banner_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), banner_bg),
                ("BOX", (0, 0), (-1, -1), 1, banner_border),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 15),
                ("RIGHTPADDING", (0, 0), (-1, -1), 15),
            ]
        )
    )
    story.append(banner_table)
    story.append(Spacer(1, 20))

    # Details Grid
    story.append(Paragraph("Transaction Specifications", heading_style))

    local_time = timezone.localtime(transaction.created_at)
    date_str = local_time.strftime("%B %d, %Y")
    time_str = local_time.strftime("%I:%M %p %Z")

    sender_name = (
        transaction.sender.first_name
        if transaction.sender
        else "SYSTEM WELCOME DEPOSIT"
    )
    sender_email = (
        transaction.sender.email if transaction.sender else "mainframe@securebank.com"
    )
    sender_phone = transaction.sender.phone if transaction.sender else "N/A"
    sender_acct = (
        transaction.sender.bank_account.account_number if transaction.sender else "N/A"
    )

    receiver_name = (
        transaction.receiver.first_name if transaction.receiver else "SYSTEM"
    )
    receiver_email = transaction.receiver.email if transaction.receiver else "N/A"
    receiver_phone = transaction.receiver.phone if transaction.receiver else "N/A"
    receiver_acct = (
        transaction.receiver.bank_account.account_number
        if transaction.receiver
        else "N/A"
    )

    amount_style = ParagraphStyle(
        "AmountStyle",
        parent=body_style,
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=accent_red if is_debit else accent_green,
    )

    amount_prefix = "-" if is_debit else "+"
    amount_str = f"{amount_prefix}${transaction.amount:.2f}"

    grid_data = [
        [
            Paragraph("Transaction Reference", body_bold),
            Paragraph(transaction.reference_id, body_mono),
        ],
        [
            Paragraph("Date & Time", body_bold),
            Paragraph(f"{date_str} at {time_str}", body_style),
        ],
        [Paragraph("Transfer Amount", body_bold), Paragraph(amount_str, amount_style)],
        [
            Paragraph("Remarks / Memo", body_bold),
            Paragraph(transaction.remarks or "N/A", body_style),
        ],
        [
            Paragraph("Sender Details", body_bold),
            Paragraph(
                f"{sender_name}<br/>Acc: {sender_acct}<br/>Email: {sender_email}<br/>Phone: {sender_phone}",
                body_style,
            ),
        ],
        [
            Paragraph("Receiver Details", body_bold),
            Paragraph(
                f"{receiver_name}<br/>Acc: {receiver_acct}<br/>Email: {receiver_email}<br/>Phone: {receiver_phone}",
                body_style,
            ),
        ],
    ]

    grid_table = Table(grid_data, colWidths=[150, 350])
    grid_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg_light),
                ("BOX", (0, 0), (-1, -1), 1, border_color),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )

    story.append(grid_table)
    story.append(Spacer(1, 30))

    footer_notice_style = ParagraphStyle(
        "FooterNotice",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        textColor=text_muted,
        alignment=1,
        leading=12,
    )

    story.append(
        Paragraph(
            "This is an official cryptographically logged transaction receipt generated directly from the Secure Bank mainframe ledgers.<br/>"
            "If you did not authorize this activity, please freeze your credentials or notify mainframe security operations immediately.<br/>"
            "Support: support@securebank.com | Mainframe Access Security Control",
            footer_notice_style,
        )
    )

    doc.build(story)

    buffer.seek(0)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes


def send_debit_alert_email(
    sender_email,
    sender_name,
    receiver_name,
    receiver_account,
    amount,
    remaining_balance,
    remarks=None,
    transaction=None,
):
    """
    Sends an elegant, red-themed HTML debit alert email to the sender with a ReportLab PDF receipt attached.
    """
    subject = "Secure Bank - Outbound Transaction Debit Alert"
    remarks_str = remarks if remarks else "N/A"
    timestamp = timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    message = (
        f"Hello {sender_name},\n\n"
        f"This is a transaction security notification from Secure Bank.\n"
        f"An outbound transfer of ${amount:.2f} has been authorized and debited from your account.\n\n"
        f"--- Transaction Details ---\n"
        f"Recipient Name: {receiver_name}\n"
        f"Recipient Account: {receiver_account}\n"
        f"Amount: -${amount:.2f}\n"
        f"Remarks: {remarks_str}\n"
        f"Timestamp: {timestamp}\n"
        f"Remaining Balance: ${remaining_balance:.2f}\n\n"
        f"If you did not authorize this transaction, please secure your account immediately.\n\n"
        f"Best regards,\n"
        f"Secure Bank Security Team"
    )

    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #fecaca; border-radius: 12px; background-color: #fef2f2; color: #333333;">
        <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Secure Bank</h1>
            <p style="color: #991b1b; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">⚠️ Outbound Transaction Debit Alert</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #fca5a5; margin-bottom: 25px;" />
        <p style="font-size: 16px; line-height: 1.6; color: #7f1d1d; margin-bottom: 20px;">Hello <strong>{sender_name}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #333333; margin-bottom: 25px;">
            An outbound compliance ledger transfer has been authorized and successfully processed. The specified funds have been debited from your primary savings vault.
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #fecaca;">
            <tr style="background-color: #fee2e2;">
                <th colspan="2" style="text-align: left; padding: 12px; color: #991b1b; font-weight: 700; border-bottom: 1px solid #fecaca;">Ledger Transaction Record</th>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #666666; border-bottom: 1px solid #f5f5f5; width: 40%;"><strong>Receiver Name</strong></td>
                <td style="padding: 10px 12px; color: #333333; border-bottom: 1px solid #f5f5f5;">{receiver_name}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #666666; border-bottom: 1px solid #f5f5f5;"><strong>Receiver Account</strong></td>
                <td style="padding: 10px 12px; color: #333333; border-bottom: 1px solid #f5f5f5;">{receiver_account}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #666666; border-bottom: 1px solid #f5f5f5;"><strong>Transaction Amount</strong></td>
                <td style="padding: 10px 12px; color: #dc2626; font-weight: 700; border-bottom: 1px solid #f5f5f5;">-${amount:.2f}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #666666; border-bottom: 1px solid #f5f5f5;"><strong>Remarks</strong></td>
                <td style="padding: 10px 12px; color: #333333; border-bottom: 1px solid #f5f5f5;">{remarks_str}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #666666; border-bottom: 1px solid #f5f5f5;"><strong>Timestamp</strong></td>
                <td style="padding: 10px 12px; color: #333333; border-bottom: 1px solid #f5f5f5; font-family: monospace;">{timestamp}</td>
            </tr>
            <tr style="background-color: #fef2f2;">
                <td style="padding: 10px 12px; color: #7f1d1d; font-weight: 700;"><strong>Remaining Balance</strong></td>
                <td style="padding: 10px 12px; color: #7f1d1d; font-weight: 800; font-size: 15px;">${remaining_balance:.2f}</td>
            </tr>
        </table>
        
        <p style="font-size: 13px; line-height: 1.5; color: #854d0e; background-color: #fef9c3; border-left: 4px solid #ca8a04; padding: 12px; border-radius: 4px; margin-bottom: 25px;">
            <strong>⚠️ Fraud Alert Notice:</strong> If you did not authorize this transaction, please freeze your debit card or lock your account immediately from the Mainframe Navigation or contact Secure Bank hotline support.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #fca5a5; margin-bottom: 20px;" />
        <p style="font-size: 14px; color: #7f1d1d; margin-bottom: 5px;">Best regards,</p>
        <p style="font-size: 14px; font-weight: 700; color: #dc2626; margin-top: 0;">Secure Bank Ledger Security Control</p>
    </div>
    """

    attachments = None
    if transaction:
        try:
            pdf_data = generate_transaction_receipt_pdf(transaction, is_debit=True)
            filename = f"Receipt-{transaction.reference_id}.pdf"
            attachments = [(filename, pdf_data, "application/pdf")]
            print(
                f"[PDF ATTACHMENT] PDF RECEIPT ATTACHED SUCCESSFULLY FOR SENDER: {filename}"
            )
        except Exception as e:
            print(f"[ERROR] FAILED TO GENERATE PDF RECEIPT FOR SENDER: {str(e)}")

    print("\n" + "-" * 60)
    print(f"[EMAIL SENT] DEBIT ALERT EMAIL SENT TO {sender_email} (SENDER)")
    print(f"   Debited Amount: -${amount:.2f} | Remaining: ${remaining_balance:.2f}")
    print(f"   Receiver: {receiver_name} ({receiver_account})")
    print(f"   Remarks: {remarks_str}")
    print("-" * 60 + "\n")

    from_email = getattr(
        settings,
        "DEFAULT_FROM_EMAIL",
        getattr(settings, "EMAIL_HOST_USER", "security@securebank.com"),
    )
    send_mail_async(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=[sender_email],
        html_message=html_message,
        attachments=attachments,
    )


def send_credit_alert_email(
    receiver_email,
    receiver_name,
    sender_name,
    sender_account,
    amount,
    remaining_balance,
    remarks=None,
    transaction=None,
):
    """
    Sends an elegant, green-themed HTML credit alert email to the receiver with a ReportLab PDF receipt attached.
    """
    subject = "Secure Bank - Inbound Transaction Credit Alert"
    remarks_str = remarks if remarks else "N/A"
    timestamp = timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    message = (
        f"Hello {receiver_name},\n\n"
        f"This is a transaction security notification from Secure Bank.\n"
        f"An inbound transfer of ${amount:.2f} has been credited to your account.\n\n"
        f"--- Transaction Details ---\n"
        f"Sender Name: {sender_name}\n"
        f"Sender Account: {sender_account}\n"
        f"Amount: +${amount:.2f}\n"
        f"Remarks: {remarks_str}\n"
        f"Timestamp: {timestamp}\n"
        f"Available Balance: ${remaining_balance:.2f}\n\n"
        f"Best regards,\n"
        f"Secure Bank Operations Team"
    )

    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #dcfce7; border-radius: 12px; background-color: #f0fdf4; color: #333333;">
        <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #16a34a; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Secure Bank</h1>
            <p style="color: #14532d; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">❇️ Inbound Transaction Credit Alert</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #bbf7d0; margin-bottom: 25px;" />
        <p style="font-size: 16px; line-height: 1.6; color: #14532d; margin-bottom: 20px;">Hello <strong>{receiver_name}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #333333; margin-bottom: 25px;">
            Great news! An inbound transaction has been credited to your primary savings vault. The funds are immediately available for use.
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #dcfce7;">
            <tr style="background-color: #dcfce7;">
                <th colspan="2" style="text-align: left; padding: 12px; color: #14532d; font-weight: 700; border-bottom: 1px solid #dcfce7;">Deposit Transaction Record</th>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #666666; border-bottom: 1px solid #f5f5f5; width: 40%;"><strong>Sender Name</strong></td>
                <td style="padding: 10px 12px; color: #333333; border-bottom: 1px solid #f5f5f5;">{sender_name}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #666666; border-bottom: 1px solid #f5f5f5;"><strong>Sender Account</strong></td>
                <td style="padding: 10px 12px; color: #333333; border-bottom: 1px solid #f5f5f5;">{sender_account}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #666666; border-bottom: 1px solid #f5f5f5;"><strong>Transaction Amount</strong></td>
                <td style="padding: 10px 12px; color: #16a34a; font-weight: 700; border-bottom: 1px solid #f5f5f5;">+${amount:.2f}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #666666; border-bottom: 1px solid #f5f5f5;"><strong>Remarks</strong></td>
                <td style="padding: 10px 12px; color: #333333; border-bottom: 1px solid #f5f5f5;">{remarks_str}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #666666; border-bottom: 1px solid #f5f5f5;"><strong>Timestamp</strong></td>
                <td style="padding: 10px 12px; color: #333333; border-bottom: 1px solid #f5f5f5; font-family: monospace;">{timestamp}</td>
            </tr>
            <tr style="background-color: #f0fdf4;">
                <td style="padding: 10px 12px; color: #14532d; font-weight: 700;"><strong>Available Balance</strong></td>
                <td style="padding: 10px 12px; color: #14532d; font-weight: 800; font-size: 15px;">${remaining_balance:.2f}</td>
            </tr>
        </table>
        
        <hr style="border: 0; border-top: 1px solid #bbf7d0; margin-bottom: 20px;" />
        <p style="font-size: 14px; color: #14532d; margin-bottom: 5px;">Best regards,</p>
        <p style="font-size: 14px; font-weight: 700; color: #16a34a; margin-top: 0;">Secure Bank Ledger Operations</p>
    </div>
    """

    attachments = None
    if transaction:
        try:
            pdf_data = generate_transaction_receipt_pdf(transaction, is_debit=False)
            filename = f"Receipt-{transaction.reference_id}.pdf"
            attachments = [(filename, pdf_data, "application/pdf")]
            print(
                f"[PDF ATTACHMENT] PDF RECEIPT ATTACHED SUCCESSFULLY FOR RECEIVER: {filename}"
            )
        except Exception as e:
            print(f"[ERROR] FAILED TO GENERATE PDF RECEIPT FOR RECEIVER: {str(e)}")

    print("\n" + "+" * 60)
    print(f"[EMAIL SENT] CREDIT ALERT EMAIL SENT TO {receiver_email} (RECEIVER)")
    print(f"   Credited Amount: +${amount:.2f} | Balance: ${remaining_balance:.2f}")
    print(f"   Sender: {sender_name} ({sender_account})")
    print(f"   Remarks: {remarks_str}")
    print("+" * 60 + "\n")

    from_email = getattr(
        settings,
        "DEFAULT_FROM_EMAIL",
        getattr(settings, "EMAIL_HOST_USER", "security@securebank.com"),
    )
    send_mail_async(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=[receiver_email],
        html_message=html_message,
        attachments=attachments,
    )


def generate_monthly_statement_pdf(user, year, month):
    """
    Generates a certified monthly ledger statement PDF inside memory using ReportLab.
    Returns the binary content as bytes.
    """
    import io
    import datetime
    from django.db.models import Q
    from django.utils import timezone
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from .models import Transaction

    start_date = datetime.datetime(
        year, month, 1, 0, 0, 0, tzinfo=datetime.timezone.utc
    )
    if month == 12:
        end_date = datetime.datetime(
            year + 1, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc
        )
    else:
        end_date = datetime.datetime(
            year, month + 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc
        )

    transactions = Transaction.objects.filter(
        Q(sender=user) | Q(receiver=user),
        created_at__gte=start_date,
        created_at__lt=end_date,
    ).order_by("created_at")

    total_inflows = 0.00
    total_outflows = 0.00
    ledger_rows = []

    for txn in transactions:
        is_debit = txn.sender == user
        local_time = timezone.localtime(txn.created_at)
        date_str = local_time.strftime("%Y-%m-%d %H:%M")
        ref_str = txn.reference_id

        if not txn.sender:
            remarks_str = "Vault Compliance Credit"
        elif is_debit:
            remarks_str = (
                txn.remarks
                or f"Outbound Transfer to {txn.receiver.first_name or txn.receiver.username}"
            )
        else:
            remarks_str = (
                txn.remarks
                or f"Inbound Deposit from {txn.sender.first_name or txn.sender.username}"
            )

        amount_val = float(txn.amount)
        if is_debit:
            total_outflows += amount_val
            inflow_str = ""
            outflow_str = f"-${amount_val:.2f}"
        else:
            total_inflows += amount_val
            inflow_str = f"+${amount_val:.2f}"
            outflow_str = ""

        ledger_rows.append(
            [
                date_str,
                ref_str,
                remarks_str,
                inflow_str,
                outflow_str,
            ]
        )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    story = []
    styles = getSampleStyleSheet()

    primary_color = colors.HexColor("#0A2540")
    accent_green = colors.HexColor("#10B981")
    accent_red = colors.HexColor("#EF4444")
    text_dark = colors.HexColor("#1E293B")
    text_muted = colors.HexColor("#64748B")
    bg_light = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        textColor=primary_color,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=text_muted,
        spaceAfter=15,
    )

    heading_style = ParagraphStyle(
        "DocHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=primary_color,
        spaceAfter=10,
    )

    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=text_dark,
        leading=13,
    )

    body_bold = ParagraphStyle(
        "DocBodyBold", parent=body_style, fontName="Helvetica-Bold"
    )

    body_mono = ParagraphStyle(
        "DocBodyMono", parent=body_style, fontName="Courier", fontSize=8
    )

    # Build Document
    story.append(Paragraph("SECURE BANK", title_style))
    period_date = datetime.date(year, month, 1)
    period_str = period_date.strftime("%B %Y")
    story.append(
        Paragraph(
            f"CERTIFIED MONTHLY STATEMENT AUDIT - {period_str.upper()}", subtitle_style
        )
    )

    line_table = Table([[""]], colWidths=[500])
    line_table.setStyle(
        TableStyle(
            [
                ("LINEABOVE", (0, 0), (-1, -1), 1.5, primary_color),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(line_table)
    story.append(Spacer(1, 15))

    owner_name = user.first_name if user.first_name else user.username
    acct_num = (
        user.bank_account.account_number if hasattr(user, "bank_account") else "N/A"
    )

    spec_data = [
        [
            Paragraph("Account Holder", body_bold),
            Paragraph(owner_name, body_style),
            Paragraph("Statement Period", body_bold),
            Paragraph(period_str, body_style),
        ],
        [
            Paragraph("Bank Identifier", body_bold),
            Paragraph(acct_num, body_style),
            Paragraph("Generation Date", body_bold),
            Paragraph(timezone.now().strftime("%Y-%m-%d"), body_style),
        ],
    ]
    spec_table = Table(spec_data, colWidths=[110, 140, 110, 140])
    spec_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg_light),
                ("BOX", (0, 0), (-1, -1), 1, border_color),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(spec_table)
    story.append(Spacer(1, 20))

    story.append(Paragraph("Statement Period Activity Summary", heading_style))

    summary_data = [
        [
            Paragraph("Total Dynamic Deposits Inflow (+)", body_style),
            Paragraph(
                f"+${total_inflows:.2f}",
                ParagraphStyle("GreenText", parent=body_bold, textColor=accent_green),
            ),
        ],
        [
            Paragraph("Total Outbound Ledger Outflow (-)", body_style),
            Paragraph(
                f"-${total_outflows:.2f}",
                ParagraphStyle("RedText", parent=body_bold, textColor=accent_red),
            ),
        ],
        [
            Paragraph("Net Periodic Cash Flow Changes", body_style),
            Paragraph(f"${(total_inflows - total_outflows):+.2f}", body_bold),
        ],
    ]
    summary_table = Table(summary_data, colWidths=[250, 250])
    summary_table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 1, border_color),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    story.append(summary_table)
    story.append(Spacer(1, 25))

    story.append(Paragraph("Certified Ledger Audit Entries", heading_style))

    headers = [
        Paragraph("Timestamp", body_bold),
        Paragraph("Reference ID", body_bold),
        Paragraph("Transaction Details", body_bold),
        Paragraph("Inflow (+)", body_bold),
        Paragraph("Outflow (-)", body_bold),
    ]
    table_rows = [headers]

    for row in ledger_rows:
        table_rows.append(
            [
                Paragraph(row[0], body_style),
                Paragraph(row[1], body_mono),
                Paragraph(row[2], body_style),
                (
                    Paragraph(
                        row[3],
                        ParagraphStyle("G", parent=body_bold, textColor=accent_green),
                    )
                    if row[3]
                    else Paragraph("", body_style)
                ),
                (
                    Paragraph(
                        row[4],
                        ParagraphStyle("R", parent=body_bold, textColor=accent_red),
                    )
                    if row[4]
                    else Paragraph("", body_style)
                ),
            ]
        )

    if len(transactions) == 0:
        table_rows.append(
            [
                Paragraph("No transactions recorded during this period.", body_style),
                "",
                "",
                "",
                "",
            ]
        )

    col_widths = [90, 80, 170, 80, 80]
    ledger_table = Table(table_rows, colWidths=col_widths)

    ledger_style = TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), primary_color),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("BOX", (0, 0), (-1, -1), 1, border_color),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
        ]
    )

    for i in range(len(headers)):
        headers[i].style.textColor = colors.white

    ledger_table.setStyle(ledger_style)
    story.append(ledger_table)
    story.append(Spacer(1, 30))

    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        textColor=text_muted,
        alignment=1,
        leading=11,
    )
    story.append(
        Paragraph(
            "Certified by the Secure Bank Mainframe Cryptographic Ledger Administration.<br/>"
            "This statement serves as a regulatory-approved ledger record. For discrepancies, please raise an audit reference within 30 days of the generation date.<br/>"
            "Official Wealth Gateway Operations Portal",
            footer_style,
        )
    )

    doc.build(story)
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
