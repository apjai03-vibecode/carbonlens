from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_status_code():
    """Verify that the root endpoint returns a 200 status code."""
    response = client.get("/")
    assert response.status_code == 200

def test_root_json_structure():
    """Verify that the root endpoint returns the correct JSON structure."""
    response = client.get("/")
    data = response.json()
    assert isinstance(data, dict)
    assert "status" in data
    assert "service" in data
    assert data["status"] == "ok"
    assert data["service"] == "CarbonLens API"
