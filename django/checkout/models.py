from django.db import models


class Order(models.Model):
    username = models.CharField(max_length=150)
    items = models.JSONField()          # list of {product_id, name, price, qty}
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=30, default='confirmed')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} by {self.username}"
