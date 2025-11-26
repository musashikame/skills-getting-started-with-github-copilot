import copy
from fastapi.testclient import TestClient
import pytest

from src import app as app_module

# Keep an original copy of activities to reset between tests
ORIGINAL_ACTIVITIES = copy.deepcopy(app_module.activities)

@pytest.fixture()
def client():
    # Reset in-memory activities before each test
    app_module.activities = copy.deepcopy(ORIGINAL_ACTIVITIES)
    client = TestClient(app_module.app)
    yield client


def test_get_activities(client):
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_reflects_in_activities(client):
    activity = "Chess Club"
    email = "tester@mergington.edu"

    # Ensure not present initially
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]

    # Signup
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert "Signed up" in resp.json()["message"]

    # Check activities reflect the new participant
    resp = client.get("/activities")
    assert email in resp.json()[activity]["participants"]


def test_unregister_participant(client):
    activity = "Chess Club"
    email = "to_remove@mergington.edu"

    # Add participant first
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200

    # Now unregister using DELETE endpoint
    resp = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert resp.status_code == 200
    assert f"Unregistered {email}" in resp.json()["message"]

    # Verify participant removed
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]
