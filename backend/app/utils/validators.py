from pydantic import field_validator

class Validators:
    @staticmethod
    def validate_email(email: str) -> bool:
        # Simple email validation
        return "@" in email and "." in email.split("@")[1]

    @staticmethod
    def validate_price(price: float) -> bool:
        return price > 0

    @staticmethod
    def validate_password(password: str) -> bool:
        # Password should be at least 8 characters
        return len(password) >= 8

    @staticmethod
    def validate_username(username: str) -> bool:
        # Username should be 3-20 characters and alphanumeric
        return 3 <= len(username) <= 20 and username.isalnum()
