from django.urls import path
from . import views
 
urlpatterns = [
    path('', views.main,name='main_page'),
    path('<int:num>/', views.index),
    path('<int:num>/save_memo', views.save_memo, name='save_memo'),
    path('<int:num>/update_checked', views.update_checked, name='update_checked'),
    path('<int:num>/savenode', views.savenode, name='savenode'),
    path('<int:num>/delnode', views.delnode, name='delnode'),
    path('<int:num>/changesetblock', views.changesetblock, name='changesetblock'),
    path('<int:num>/changesetblockall', views.changesetblockall, name='changesetblockall'),
    path('<int:num>/filter', views.filter),
    path('map', views.map_main),
    path("save_node_positions", views.save_node_positions, name="save_node_positions"),
    path('load_mymap', views.load_mymap, name='load_mymap'),
    path('get_mymap_titles', views.get_mymap_titles, name='get_mymap_titles'),
]
