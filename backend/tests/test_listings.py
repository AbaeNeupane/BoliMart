import pytest
from app.core.config import settings

def test_get_listings(test_client):
    response = test_client.get(f"{settings.API_V1_STR}/listings/")
    assert response.status_code == 200

def test_create_listing(test_client):
    # This would require auth
    pass

def test_get_listing_detail(test_client):
    pass
