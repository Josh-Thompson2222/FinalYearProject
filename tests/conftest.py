import os
import importlib
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# IMPORTANT: patch TF model load before importing app.main
@pytest.fixture(scope="session")
def patched_app_module():
    mp = pytest.MonkeyPatch()
    class DummyModel:
        def predict(self, x, verbose=0):
            return [[0.1, 0.2, 0.3, 0.4]]

    def fake_load_model(path):
        return DummyModel()

    mp.setattr("tensorflow.keras.models.load_model", fake_load_model, raising=False)
    mp.setattr("tensorflow.keras.models", "load_model", fake_load_model, raising=False)

    # Ensure test env is used
    os.environ["APP_ENV"] = "test"
    os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

    # Now import after patching
    import app.main as main
    importlib.reload(main)
    return main


@pytest.fixture()
def client(patched_app_module):
    main = patched_app_module

    # Build a fresh in-memory DB per test
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    # Create schema
    main.Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    main.app.dependency_overrides[main.get_db] = override_get_db

    with TestClient(main.app) as c:
        yield c

    main.app.dependency_overrides.clear()


def signup_and_login(client, email="josh_test@example.com", password="password123", name="Josh Test"):
    # signup
    r = client.post("/api/users/", json={"name": name, "email": email, "password": password})
    assert r.status_code == 201, r.text

    # login uses OAuth2PasswordRequestForm => form fields username/password
    r = client.post(
        "/api/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return token