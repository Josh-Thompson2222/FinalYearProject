import os
import unittest.mock as mock
import numpy as np

os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///./test_temp.db"
os.environ["MODEL_PATH"] = "models/tablet_model.keras"

class DummyModel:
    def predict(self, x, verbose=0):
        return np.array([[0.1, 0.2, 0.3, 0.4]])

mock.patch("tensorflow.keras.models.load_model", return_value=DummyModel()).start()

import app.database as _db_module
import app.main as _main
_main.model = DummyModel()

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.models import Base

TEST_ENGINE = create_engine("sqlite:///./test_temp.db", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=TEST_ENGINE)
_db_module.engine = TEST_ENGINE
_db_module.SessionLocal = sessionmaker(bind=TEST_ENGINE, autocommit=False, autoflush=False)


@pytest.fixture()
def client():
    TestingSessionLocal = sessionmaker(bind=TEST_ENGINE, autocommit=False, autoflush=False)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    _main.app.dependency_overrides[_main.get_db] = override_get_db

    with TestClient(_main.app) as c:
        yield c

    _main.app.dependency_overrides.clear()

    # Clean rows between tests
    with TEST_ENGINE.connect() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(text(f"DELETE FROM {table.name}"))
        conn.commit()


def signup_and_login(client, email="josh_test@example.com", password="pass123", name="Josh Test"):
    r = client.post("/api/users/", json={"name": name, "email": email, "password": password})
    assert r.status_code == 201, r.text

    r = client.post(
        "/api/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]