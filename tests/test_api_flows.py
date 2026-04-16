from datetime import datetime

from tests.conftest import signup_and_login


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_signup_then_login_returns_token(client):
    token = signup_and_login(client)
    assert isinstance(token, str) and len(token) > 10


def test_protected_route_requires_token(client):
    r = client.get("/api/schedules/me/")
    assert r.status_code == 401


def test_create_and_list_schedule(client):
    token = signup_and_login(client)

    payload = {
        "morning": [{"name": "Bioflu", "qty": 1}],
        "afternoon": [],
        "evening": [{"name": "Medicol", "qty": 2}],
    }

    r = client.post("/api/schedules/", json=payload, headers=auth_headers(token))
    assert r.status_code == 201, r.text
    schedule = r.json()
    assert schedule["morning"][0]["name"] == "Bioflu"

    r = client.get("/api/schedules/me/", headers=auth_headers(token))
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["id"] == schedule["id"]


def test_update_and_delete_schedule(client):
    token = signup_and_login(client)

    r = client.post(
        "/api/schedules/",
        json={"morning": [], "afternoon": [], "evening": []},
        headers=auth_headers(token),
    )
    schedule_id = r.json()["id"]

    r = client.put(
        f"/api/schedules/{schedule_id}/",
        json={"morning": [{"name": "DayZinc", "qty": 1}]},
        headers=auth_headers(token),
    )
    assert r.status_code == 200, r.text
    assert r.json()["morning"][0]["name"] == "DayZinc"

    r = client.delete(f"/api/schedules/{schedule_id}/", headers=auth_headers(token))
    assert r.status_code == 204, r.text


def test_create_intake_and_get_today(client):
    token = signup_and_login(client)

    r = client.post(
        "/api/intake/",
        json={"tablet_name": "Bioflu", "time_of_day": "morning", "qty_taken": 1},
        headers=auth_headers(token),
    )
    assert r.status_code == 201, r.text
    intake = r.json()
    assert intake["tablet_name"] == "Bioflu"

    r = client.get("/api/intake/today/", headers=auth_headers(token))
    assert r.status_code == 200, r.text
    items = r.json()
    assert any(it["id"] == intake["id"] for it in items)


def test_predict_accepts_image_and_returns_probs(client):
    # Build a tiny valid PNG in-memory
    import io
    from PIL import Image

    img = Image.new("RGB", (10, 10), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    files = {"file": ("test.png", buf.read(), "image/png")}
    r = client.post("/api/predict", files=files)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "predicted_class" in data
    assert "confidence" in data
    assert len(data["all_confidences"]) == 4