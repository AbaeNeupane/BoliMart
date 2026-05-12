from app.workers.celery_app import celery_app

@celery_app.task
def process_payment_task(payment_intent_id: str, listing_id: str):
    # Task to process payment and transfer funds
    pass

@celery_app.task
def handle_payment_failure_task(payment_intent_id: str):
    # Task to handle failed payments
    pass
