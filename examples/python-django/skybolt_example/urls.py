"""URL configuration for Skybolt example project."""

from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("skybolt-sw.js", views.service_worker, name="service_worker"),
]
