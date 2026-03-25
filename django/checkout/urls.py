from django.urls import path
from .views import CheckoutView, OrderListView, AdminOrderListView

urlpatterns = [
    path('checkout', CheckoutView.as_view()),
    path('orders', OrderListView.as_view()),
    path('orders/all', AdminOrderListView.as_view()),   # admin only
]
