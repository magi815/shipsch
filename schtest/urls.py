from django.urls import path
from . import views
 
urlpatterns = [
    path('', views.main),
    path('test/<int:num>', views.index),
    path('test/filter', views.filter)
]
