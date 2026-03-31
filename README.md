# FinalYearProject – Backend API

A FastAPI backend with PostgreSQL (via SQLAlchemy) that supports user authentication and tablet schedule management.

## Running with Docker Compose

```powershell
docker compose --env-file .env.docker up --build
```

The API will be available at `http://localhost:8000`.

---

## Authentication

### Register a new user
```http
POST /api/users/
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
```

### Login (get JWT token)
```http
POST /api/login
Content-Type: application/x-www-form-urlencoded

username=jane@example.com&password=secret123
```

Response:
```json
{
  "access_token": "<jwt-token>",
  "token_type": "bearer"
}
```

Use the token in subsequent requests via the `Authorization: Bearer <token>` header.

---

## Tablet Schedules

All schedule endpoints require a valid JWT (`Authorization: Bearer <token>`).

### Create a schedule
```http
POST /api/schedules/
Authorization: Bearer <token>
Content-Type: application/json

{
  "morning":   ["Medicol", "DayZinc"],
  "afternoon": ["Bioflu"],
  "evening":   ["Bactidol", "Medicol"]
}
```

Response `201 Created`:
```json
{
  "id": 1,
  "user_id": 3,
  "morning":   ["Medicol", "DayZinc"],
  "afternoon": ["Bioflu"],
  "evening":   ["Bactidol", "Medicol"],
  "created_at": "2026-01-01T10:00:00Z",
  "updated_at": "2026-01-01T10:00:00Z"
}
```

### Get my schedules
```http
GET /api/schedules/me/
Authorization: Bearer <token>
```

Response `200 OK`: array of schedule objects (see above).

### Update a schedule
Only supply fields you want to change.
```http
PUT /api/schedules/{schedule_id}/
Authorization: Bearer <token>
Content-Type: application/json

{
  "morning": ["DayZinc"],
  "evening": ["Medicol", "Bactidol"]
}
```

Returns `404` if not found, `403` if the schedule belongs to a different user.

### Delete a schedule
```http
DELETE /api/schedules/{schedule_id}/
Authorization: Bearer <token>
```

Returns `204 No Content` on success, `404` if not found, `403` if unauthorised.

---

## Image Classification

### Predict tablet from image
```http
POST /api/predict
Content-Type: multipart/form-data

file=<image.jpg>
```

Response:
```json
{
  "predicted_class": "Bioflu",
  "confidence": 0.92,
  "class_index": 2,
  "all_confidences": [0.01, 0.03, 0.92, 0.04]
}
```
