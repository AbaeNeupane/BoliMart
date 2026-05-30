from app.workers.celery_app import celery_app
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
import os
import resend

DATABASE_URL = os.getenv("DATABASE_URL", "").replace(
    "postgresql+asyncpg://", "postgresql+psycopg2://"
)


def get_sync_session():
    engine = create_engine(DATABASE_URL)
    return Session(engine)


@celery_app.task(name="app.workers.email_tasks.send_verification_email_task")
def send_verification_email_task(email: str, token: str):
    """Send email verification link."""
    resend.api_key = os.getenv("RESEND_API_KEY", "")
    verification_url = f"http://localhost:5173/verify-email?token={token}"
    try:
        resend.Emails.send({
            "from": f"{os.getenv('EMAIL_FROM_NAME', 'Boli')} <{os.getenv('EMAIL_FROM', 'onboarding@resend.dev')}>",
            "to": [email],
            "subject": "Verify your Boli account",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to Boli!</h2>
                <p>Please verify your email address to complete your registration.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}"
                       style="background-color: #F97316; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        Verify Email
                    </a>
                </div>
                <p>Link expires in 24 hours.</p>
            </div>
            """
        })
    except Exception as e:
        print(f"Failed to send verification email: {e}")


@celery_app.task(name="app.workers.email_tasks.send_notification_email_task")
def send_notification_email_task(email: str, subject: str, html: str):
    """Generic notification email."""
    resend.api_key = os.getenv("RESEND_API_KEY", "")
    try:
        resend.Emails.send({
            "from": f"{os.getenv('EMAIL_FROM_NAME', 'Boli')} <{os.getenv('EMAIL_FROM', 'onboarding@resend.dev')}>",
            "to": [email],
            "subject": subject,
            "html": html,
        })
    except Exception as e:
        print(f"Failed to send notification email: {e}")


@celery_app.task(name="app.workers.email_tasks.send_outbid_email_task")
def send_outbid_email_task(user_id: str, listing_title: str, listing_id: str, new_amount: float):
    """Notify a bidder they've been outbid."""
    from app.models.user import User

    db = get_sync_session()
    try:
        user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
        if not user:
            return

        resend.api_key = os.getenv("RESEND_API_KEY", "")
        listing_url = f"http://localhost:5173/listings/{listing_id}"

        try:
            resend.Emails.send({
                "from": f"{os.getenv('EMAIL_FROM_NAME', 'Boli')} <{os.getenv('EMAIL_FROM', 'onboarding@resend.dev')}>",
                "to": [user.email],
                "subject": f"You've been outbid on {listing_title}",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>You've been outbid 😮</h2>
                    <p>Hi {user.full_name},</p>
                    <p>Someone placed a higher bid of <strong>${new_amount:.2f}</strong> on <strong>{listing_title}</strong>.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{listing_url}"
                           style="background-color: #F97316; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;">
                            Bid Again
                        </a>
                    </div>
                </div>
                """
            })
        except Exception as e:
            print(f"Failed to send outbid email: {e}")
    finally:
        db.close()