from app.workers.celery_app import celery_app

@celery_app.task
def send_verification_email_task(email: str, token: str):
    # Task to send verification email
    pass

@celery_app.task
def send_notification_email_task(email: str, subject: str, message: str):
    # Task to send notification emails
    pass
