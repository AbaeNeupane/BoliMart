from typing import Any, Dict
import resend
from app.core.config import settings

class EmailService:
    def __init__(self):
        resend.api_key = settings.RESEND_API_KEY

    async def send_verification_email(self, email: str, verification_token: str) -> Dict[str, Any]:
        """Send email verification link to user"""
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"

        params = {
            "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
            "to": [email],
            "subject": "Verify your AuctionHub account",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to AuctionHub!</h2>
                <p>Please verify your email address to complete your registration.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}"
                       style="background-color: #4F46E5; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">{verification_url}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
            </div>
            """
        }

        try:
            response = resend.Emails.send(params)
            return {"success": True, "message_id": response.get("id")}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def send_password_reset_email(self, email: str, reset_token: str) -> Dict[str, Any]:
        """Send password reset email"""
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

        params = {
            "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
            "to": [email],
            "subject": "Reset your AuctionHub password",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>You requested to reset your password for your AuctionHub account.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}"
                       style="background-color: #DC2626; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">{reset_url}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this reset, please ignore this email.</p>
            </div>
            """
        }

        try:
            response = resend.Emails.send(params)
            return {"success": True, "message_id": response.get("id")}
        except Exception as e:
            return {"success": False, "error": str(e)}

email_service = EmailService()