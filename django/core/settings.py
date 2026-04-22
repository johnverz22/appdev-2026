import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SECRET_KEY = 'django-insecure-checkout-demo-key'
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'rest_framework',
    'checkout',
]

MIDDLEWARE = [
    'django.middleware.common.CommonMiddleware',
]

# CORS is handled by the API Gateway — do not set CORS headers in Django.
# APPEND_SLASH=False allows paths without trailing slashes (e.g. /api/checkout).
APPEND_SLASH = False

ROOT_URLCONF = 'core.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'auth_db'),
        'USER': os.environ.get('DB_USER', 'user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'password'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
}

JWT_SECRET = os.environ.get(
    'JWT_SECRET',
    'Zm9ydHktdHdvLWlzLXRoZS1hbnN3ZXItdG8tbGlmZS10aGUtdW5pdmVyc2UtYW5kLWV2ZXJ5dGhpbmc='
)

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
