from django.urls import path, include

urlpatterns = [
    path('', include('checkout.urls')),
]
