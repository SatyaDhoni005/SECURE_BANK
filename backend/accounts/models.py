from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    transaction_pin = models.CharField(max_length=128, blank=True, null=True)
    pin_created = models.BooleanField(default=False)
    pin_created_at = models.DateTimeField(null=True, blank=True)
    
    # Banking security lockout tracking parameters
    failed_pin_attempts = models.IntegerField(default=0)
    pin_locked_until = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.email


class OTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"{self.email} - {self.otp}"


class BankAccount(models.Model):

    STATUS_CHOICES = (
        ("ACTIVE", "Active"),
        ("FROZEN", "Frozen"),
        ("CLOSED", "Closed"),
    )

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="bank_account"
    )

    account_number = models.CharField(max_length=20, unique=True)

    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="ACTIVE")

    created_at = models.DateTimeField(auto_now_add=True)

    # Virtual Debit Card credentials and security controls
    card_number = models.CharField(max_length=25, blank=True, null=True)
    card_cvv = models.CharField(max_length=4, default="392")
    is_card_active = models.BooleanField(default=True)
    card_created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    card_last_used = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.account_number


class Transaction(models.Model):
    # Null sender represents external credits, cash deposits, or system welcome bonuses
    sender = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="sent_transactions"
    )
    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_transactions"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    remarks = models.CharField(max_length=255, blank=True)
    reference_id = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        sender_email = self.sender.email if self.sender else "SYSTEM"
        return f"{self.reference_id}: {sender_email} -> {self.receiver.email} (${self.amount})"
