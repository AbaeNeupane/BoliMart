"""
Rate limiting middleware to prevent abuse and DDoS attacks.
Implements sliding window rate limiting per IP address and user.
"""
from fastapi import Request, HTTPException, status
from functools import wraps
import time
from typing import Dict, Tuple, Optional
from collections import defaultdict
import asyncio

# In-memory rate limit storage: key -> list of (timestamp, count) tuples
# For production, consider using Redis
RATE_LIMITS: Dict[str, list] = defaultdict(list)
LOCK = asyncio.Lock()

# Rate limit configurations (requests per time window in seconds)
RATE_LIMIT_CONFIG = {
    "auth_login": (5, 900),  # 5 requests per 15 minutes
    "auth_register": (3, 3600),  # 3 requests per hour
    "auth_refresh": (10, 60),  # 10 requests per minute
    "bid_place": (20, 60),  # 20 requests per minute
    "listing_create": (10, 3600),  # 10 listings per hour
    "payment_checkout": (5, 300),  # 5 checkouts per 5 minutes
    "general_api": (100, 60),  # 100 requests per minute
}


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, accounting for proxies."""
    if request.client:
        return request.client.host
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return "unknown"


def get_rate_limit_key(request: Request, user_id: Optional[str] = None, endpoint: str = "general_api") -> str:
    """Generate a unique rate limit key."""
    client_ip = get_client_ip(request)
    if user_id:
        return f"{endpoint}:user:{user_id}"
    return f"{endpoint}:ip:{client_ip}"


async def check_rate_limit(
    key: str,
    max_requests: int,
    window_seconds: int,
) -> Tuple[bool, int, int]:
    """
    Check if request is within rate limit.
    Returns: (is_allowed, remaining_requests, retry_after_seconds)
    """
    async with LOCK:
        now = time.time()
        window_start = now - window_seconds

        # Clean old entries
        if key in RATE_LIMITS:
            RATE_LIMITS[key] = [
                (ts, count) for ts, count in RATE_LIMITS[key]
                if ts > window_start
            ]

        current_count = sum(count for _, count in RATE_LIMITS[key])

        if current_count >= max_requests:
            # Find the oldest timestamp to calculate retry_after
            oldest_ts = RATE_LIMITS[key][0][0] if RATE_LIMITS[key] else now
            retry_after = max(1, int(oldest_ts + window_seconds - now))
            remaining = 0
        else:
            # Add this request
            if RATE_LIMITS[key] and RATE_LIMITS[key][-1][0] == now:
                # Same second, increment count
                RATE_LIMITS[key][-1] = (now, RATE_LIMITS[key][-1][1] + 1)
            else:
                RATE_LIMITS[key].append((now, 1))

            remaining = max_requests - current_count - 1
            retry_after = 0

        is_allowed = current_count < max_requests
        return is_allowed, remaining, retry_after


async def rate_limit_middleware(
    request: Request,
    endpoint: str = "general_api",
    user_id: Optional[str] = None,
):
    """
    Middleware to enforce rate limiting.
    Raises HTTPException if rate limit exceeded.
    """
    max_requests, window_seconds = RATE_LIMIT_CONFIG.get(endpoint, RATE_LIMIT_CONFIG["general_api"])

    key = get_rate_limit_key(request, user_id, endpoint)
    is_allowed, remaining, retry_after = await check_rate_limit(key, max_requests, window_seconds)

    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    # Optionally add rate limit info to request state for response headers
    request.state.rate_limit_remaining = remaining
    request.state.rate_limit_reset = int(time.time()) + window_seconds


def rate_limit_decorator(endpoint: str = "general_api"):
    """
    Decorator for rate limiting individual endpoints.
    Usage: @rate_limit_decorator("auth_login")
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            await rate_limit_middleware(request, endpoint)
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator
