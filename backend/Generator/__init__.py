# Constructor for questgen
from __future__ import absolute_import
from Generator.question_generators import MCQGenerator, BoolQGenerator, ShortQGenerator
from Generator.answer_predictor import AnswerPredictor
from Generator.utilities import GoogleDocsService, FileProcessor
from Generator.advanced_qa import QuestionGenerator
