import base64
import functools
import jwt
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework import status


def decode_jwt(request):
    """
    Reads identity headers injected by the API Gateway.
    Returns a dictionary compatible with the existing decorator.
    """
    username = request.META.get('HTTP_X_USER_NAME')
    roles_str = request.META.get('HTTP_X_USER_ROLES', '')
    roles = roles_str.split(',') if roles_str else []

    if not username:
        raise AuthenticationFailed('Unauthorized: Missing identity header from Gateway.')

    return {
        'sub': username,
        'roles': roles
    }


def require_auth(roles=None):
    """
    Decorator for APIView methods that enforces JWT authentication
    and optional role-based access control.

    Usage — authentication only:
        @require_auth()
        def get(self, request): ...

    Usage — restrict to specific roles:
        @require_auth(roles=['ROLE_ADMIN'])
        def delete(self, request): ...

    The decorator injects `request.jwt_payload` so views can read
    claims (e.g. request.jwt_payload['sub']) without decoding again.
    """
    def decorator(view_method):
        @functools.wraps(view_method)
        def wrapper(self, request, *args, **kwargs):
            try:
                payload = decode_jwt(request)
            except AuthenticationFailed as e:
                return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

            # Role check — skip if no roles required
            if roles:
                user_roles = payload.get('roles', [])
                if not any(r in user_roles for r in roles):
                    return Response(
                        {'error': 'Forbidden: insufficient role.'},
                        status=status.HTTP_403_FORBIDDEN
                    )

            # Attach payload to request so the view can use it
            request.jwt_payload = payload
            return view_method(self, request, *args, **kwargs)
        return wrapper
    return decorator
