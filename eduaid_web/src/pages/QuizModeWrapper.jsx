import React from 'react';
import { useLocation } from 'react-router-dom';
import InteractiveQuiz from './InteractiveQuiz';
import StaticQuiz from './StaticQuiz';

const QuizModeWrapper = () => {
  const location = useLocation();
  const { mode, questions } = location.state || { mode: 'static', questions: [] };

  if (mode === 'interactive') {
    return <InteractiveQuiz questions={questions} />;
  }

  return <StaticQuiz questions={questions} />;
};

export default QuizModeWrapper;
