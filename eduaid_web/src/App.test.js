jest.mock('./pages/Home', () => () => <div>EduAid</div>);
jest.mock('./pages/Question_Type', () => () => <div>Question Type</div>);
jest.mock('./pages/Text_Input', () => () => <div>Text Input</div>);
jest.mock('./pages/Output', () => () => <div>Output</div>);
jest.mock('./pages/Previous', () => () => <div>Previous</div>);
jest.mock('./pages/PageNotFound', () => () => <div>Not Found</div>);

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders EduAid title', () => {
  render(<App />);
  const titleElement = screen.getByText(/EduAid/i);
  expect(titleElement).toBeInTheDocument();
});
