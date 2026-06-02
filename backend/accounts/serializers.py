from rest_framework import serializers
from django.contrib.auth import get_user_model
from datetime import date

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer to represent complete User profile details.
    Maps first_name back as 'name' for frontend consumption.
    """

    name = serializers.CharField(source="first_name")

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "name",
            "email",
            "phone",
            "date_of_birth",
            "address",
            "is_verified",
            "created_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer to validate the complete user signup data.
    Ensures that no records are saved to the database unless validation passes.
    """

    name = serializers.CharField(
        write_only=True, error_messages={"required": "Full Name is required."}
    )
    phone = serializers.CharField(
        write_only=True, error_messages={"required": "Phone Number is required."}
    )
    dob = serializers.DateField(
        write_only=True, error_messages={"required": "Date of Birth is required."}
    )
    address = serializers.CharField(
        write_only=True, error_messages={"required": "Residential Address is required."}
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={
            "required": "Password is required.",
            "min_length": "Password must be at least 8 characters long.",
        },
    )

    class Meta:
        model = User
        fields = ["name", "email", "phone", "dob", "address", "password"]
        extra_kwargs = {
            "email": {
                "required": True,
                "error_messages": {"required": "Email address is required."},
            },
        }

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError(
                "This email address is already registered with Secure Bank."
            )
        return value.lower()

    def validate_dob(self, value):
        # Double-check 18+ age limits on the backend too for maximum security compliance
        today = date.today()
        age = (
            today.year
            - value.year
            - ((today.month, today.day) < (value.month, value.day))
        )
        if age < 18:
            raise serializers.ValidationError(
                "You must be at least 18 years old to open an account."
            )
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
        error_messages={
            "required": "Email is required",
            "invalid": "Enter a valid email",
        },
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        error_messages={
            "required": "Password is required",
        },
    )

    def validate(self, attrs):
        email = attrs.get("email").lower()
        password = attrs.get("password")

        user = User.objects.filter(email=email).first()

        if not user:
            raise serializers.ValidationError("Invalid credentials")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials")

        if not user.is_verified:
            raise serializers.ValidationError("Account is not verified")

        if not user.is_active:
            raise serializers.ValidationError(
                "This account has been deactivated. [Reactivate Account]"
            )

        return attrs
