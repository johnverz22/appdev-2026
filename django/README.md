# Django Checkout Microservice

This is the checkout service in the microservice demo project.
It is built with **Django REST Framework** and handles order placement and order history.

---

## How it fits in the project

| Service | Tech | Port | Responsibility |
|---------|------|------|----------------|
| `sb` | Spring Boot | 8080 | Auth — login, register, issues JWT |
| `php` | PHP | 8081 | Products — catalog listing + CRUD |
| `django` | Django | 8082 | Checkout — place orders, order history |
| `react` | React + Vite | 3000 | Frontend for all services |

Authentication is shared. Spring Boot issues a JWT stored in an **HttpOnly cookie**.
Every service validates that same cookie using the shared `JWT_SECRET`.
The JWT contains a `roles` claim so this service can enforce role-based access without a DB lookup.

---

## Roles

| Role | Can access |
|------|-----------|
| `ROLE_USER` | `POST /checkout`, `GET /orders` |
| `ROLE_ADMIN` | All of the above + `GET /orders/all` |

---

## Project structure

```
django/
├── core/                   # Django project config
│   ├── settings.py         # DB, installed apps, JWT secret
│   └── urls.py             # Root URL dispatcher
├── checkout/               # The checkout app (your main working area)
│   ├── models.py           # Order model → becomes a DB table
│   ├── serializers.py      # Validates request data and shapes responses
│   ├── views.py            # Request handlers (business logic lives here)
│   ├── urls.py             # Route definitions for this app
│   └── auth.py             # JWT decoding + @require_auth decorator
├── manage.py
├── requirements.txt
└── Dockerfile
```

---

## Running the service

```bash
docker-compose up --build django
```

Or run all services:

```bash
docker-compose up --build
```

On startup the container automatically runs:
1. `makemigrations checkout` — generates migration files from your models
2. `migrate` — applies them to the database
3. `runserver` — starts the dev server on port 8000 (mapped to 8082 on your machine)

---

## Available endpoints

| Method | URL | Role | Description |
|--------|-----|------|-------------|
| POST | `/checkout` | `ROLE_USER` or `ROLE_ADMIN` | Place a new order |
| GET | `/orders` | `ROLE_USER` or `ROLE_ADMIN` | List your own orders |
| GET | `/orders/all` | `ROLE_ADMIN` only | List every order from all users |

### POST /checkout — request body

```json
{
  "items": [
    { "product_id": 1, "name": "Headphones", "price": "89.99", "qty": 2 }
  ]
}
```

Response `201`:
```json
{
  "id": 1,
  "username": "john",
  "items": [...],
  "total": "179.98",
  "status": "confirmed",
  "created_at": "2024-01-01T12:00:00Z"
}
```

---

## How authentication works

Every protected view uses the `@require_auth()` decorator from `checkout/auth.py`.

```python
from .auth import require_auth

class MyView(APIView):
    @require_auth()
    def get(self, request):
        username = request.jwt_payload['sub']
        roles    = request.jwt_payload.get('roles', [])
        ...
```

The decorator:
1. Reads the `jwt` HttpOnly cookie (set by Spring Boot on login)
2. Decodes and verifies it using the shared `JWT_SECRET`
3. Attaches the full payload to `request.jwt_payload`
4. Returns `401` if the token is missing or invalid

---

## How to add role-based protection

Pass a `roles` list to the decorator:

```python
@require_auth(roles=['ROLE_ADMIN'])
def get(self, request):
    # only ROLE_ADMIN reaches here — others get 403
    ...
```

The `roles` claim comes from the JWT signed by Spring Boot. No extra config needed here.

---

## How to add a new route

**Step 1** — Add a view in `checkout/views.py`:

```python
class CancelOrderView(APIView):
    @require_auth()
    def post(self, request, order_id):
        username = request.jwt_payload['sub']
        try:
            order = Order.objects.get(id=order_id, username=username)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=404)
        order.status = 'cancelled'
        order.save()
        return Response(OrderSerializer(order).data)
```

**Step 2** — Register it in `checkout/urls.py`:

```python
path('orders/<int:order_id>/cancel', CancelOrderView.as_view()),
```

That's it.

---

## How to add a new model (database table)

**Step 1** — Define it in `checkout/models.py`:

```python
class Coupon(models.Model):
    code = models.CharField(max_length=20, unique=True)
    discount_percent = models.IntegerField()
    active = models.BooleanField(default=True)

    class Meta:
        db_table = 'coupons'
```

**Step 2** — The next container start runs `makemigrations` + `migrate` automatically.
No SQL needed.

---

## How to add a new Django app (for a bigger feature)

```bash
python manage.py startapp shipping
```

Register it in `core/settings.py`:

```python
INSTALLED_APPS = [..., 'checkout', 'shipping']
```

Wire its URLs in `core/urls.py`:

```python
path('', include('shipping.urls')),
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_NAME` | `auth_db` | Database name |
| `DB_USER` | `user` | Database user |
| `DB_PASSWORD` | `password` | Database password |
| `JWT_SECRET` | *(see docker-compose)* | Base64-encoded secret, must match Spring Boot |
