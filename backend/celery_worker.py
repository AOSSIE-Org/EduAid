"""
Celery worker configuration for distributed asynchronous inference pipeline.
"""
from celery import Celery
import os

# Redis configuration
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
REDIS_DB = os.getenv('REDIS_DB', '0')

# Construct Redis URL
REDIS_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}'

# Initialize Celery app
celery_app = Celery(
    'eduaid_inference',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['backend.tasks.inference_tasks']
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max per task
    task_soft_time_limit=540,  # 9 minutes soft limit
    worker_prefetch_multiplier=1,  # Process one task at a time
    worker_max_tasks_per_child=10,  # Restart worker after 10 tasks to prevent memory leaks
)

if __name__ == '__main__':
    celery_app.start()
