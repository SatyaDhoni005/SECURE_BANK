from django.contrib import admin
from .models import User, OTP, BankAccount


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "phone", "is_verified", "created_at")

    search_fields = ("username", "email", "phone")


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ("email", "otp", "is_verified", "created_at", "expires_at")

    search_fields = ("email",)


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ("account_number", "user", "balance", "status", "created_at")

    search_fields = ("account_number", "user__email")
