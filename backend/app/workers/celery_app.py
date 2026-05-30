from celery import Celery
from celery.schedules import crontab
import os

# Read Redis URL directly from env to avoid importing full app settings
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "boli",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.workers.auction_tasks", "app.workers.email_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
)

# Beat schedule — check for ended auctions every minute
celery_app.conf.beat_schedule = {
    "close-ended-auctions": {
        "task": "app.workers.auction_tasks.close_ended_auctions",
        "schedule": 60.0,  # every 60 seconds
    },
}