import { render, screen } from '@testing-library/react';
import App from './App';

test('renders EduAid title and start button', () => {
  render(<App />);
  
  // Check for the EduAid title
  const eduElement = screen.getByText(/Edu/i);
  const aidElement = screen.getByText(/Aid/i);
  expect(eduElement).toBeInTheDocument();
  expect(aidElement).toBeInTheDocument();

  // Check for the "Let's get Started" button
  const startButton = screen.getByText(/Let's get Started/i);
  expect(startButton).toBeInTheDocument();

  // Check for the description text
  const descriptionElement = screen.getByText(/A tool that can auto-generate short quizzes based on user input/i);
  expect(descriptionElement).toBeInTheDocument();
});

