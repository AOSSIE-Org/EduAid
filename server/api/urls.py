from django.urls import path
from .views.getQuestions import get_boolq, get_mcq, get_problems, get_shortq, get_mcq_hard, get_shortq_hard
from .views.getAnswers import get_mcq_answer, get_shortq_answer, get_boolean_answer
from .views.getContent import get_content
from .views.googleForm import generate_gform
from .views.uploadFile import upload_file

urlpatterns = [
    path('get_mcq/', get_mcq, name='get_mcq'),
    path('get_boolq/', get_boolq, name='get_boolq'),
    path('get_problems/', get_problems, name='get_problems'),
    path('get_shortq/', get_shortq, name='get_shortq'),
    path('get_mcq_hard/', get_mcq_hard, name='get_mcq_hard'),
    path('get_mcq_answer/', get_mcq_answer, name='get_mcq_answer'),
    path('get_shortq_answer/', get_shortq_answer, name='get_shortq_answer'),
    path('get_boolean_answer/', get_boolean_answer, name='get_boolean_answer'),
    path('get_content/', get_content, name='get_content'),
    path('generate_gform/',generate_gform, name='generate_gform'),
    path('get_shortq_hard/', get_shortq_hard, name='get_shortq_hard'),
    path('upload/', upload_file, name='upload_file'),
]