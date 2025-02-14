from django.urls import path
from .views.getQuestions import get_boolq, get_mcq, get_problems

urlpatterns = [
    path('get_mcq/', get_mcq, name='get_mcq'),
    path('get_boolq/', get_boolq, name='get_boolq'),
    path('get_problems/', get_problems, name='get_problems'),
    # path('get_mcq_answer/', views.get_mcq_answer, name='get_mcq_answer'),
    # path('get_shortq_answer/', views.get_shortq_answer, name='get_shortq_answer'),
    # path('get_boolean_answer/', views.get_boolean_answer, name='get_boolean_answer'),
    # path('get_content/', views.get_content, name='get_content'),
    # path('generate_gform/', views.generate_gform, name='generate_gform'),
    # path('get_shortq_hard/', views.get_shortq_hard, name='get_shortq_hard'),
    # path('get_mcq_hard/', views.get_mcq_hard, name='get_mcq_hard'),
    # path('upload/', views.upload_file, name='upload_file'),
    # path('', views.hello, name='hello'),
]