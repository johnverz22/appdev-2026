from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Order
from .serializers import OrderSerializer, OrderItemSerializer
from .auth import require_auth


class CheckoutView(APIView):
    """POST /checkout — place a new order (any authenticated user)."""

    @require_auth()
    def post(self, request):
        username = request.jwt_payload['sub']

        items_data = request.data.get('items', [])
        if not items_data:
            return Response({'error': 'Cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        item_serializer = OrderItemSerializer(data=items_data, many=True)
        if not item_serializer.is_valid():
            return Response(item_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        total = sum(
            Decimal(str(i['price'])) * i['qty']
            for i in item_serializer.validated_data
        )

        order = Order.objects.create(
            username=username,
            items=item_serializer.validated_data,
            total=total,
        )

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListView(APIView):
    """GET /orders — list the authenticated user's own orders."""

    @require_auth()
    def get(self, request):
        username = request.jwt_payload['sub']
        orders = Order.objects.filter(username=username)
        return Response(OrderSerializer(orders, many=True).data)


class AdminOrderListView(APIView):
    """GET /orders/all — list ALL orders (admin only)."""

    @require_auth(roles=['ROLE_ADMIN'])
    def get(self, request):
        orders = Order.objects.all()
        return Response(OrderSerializer(orders, many=True).data)
