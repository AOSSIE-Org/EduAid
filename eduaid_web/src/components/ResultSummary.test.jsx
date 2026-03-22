import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ResultSummary from './ResultSummary';

describe('ResultSummary Component', () => {
    const mockQuestions = [
        { answer: 'A' },
        { answer: 'B' },
        { answer: 'C' }
    ];
    const mockUserAnswers = ['A', 'X', 'C'];
    const mockOnRestart = jest.fn();

    const renderWithRouter = (ui) => {
        return render(<BrowserRouter>{ui}</BrowserRouter>);
    };

    test('renders quiz complete message and score correctly', () => {
        renderWithRouter(<ResultSummary questions={mockQuestions} userAnswers={mockUserAnswers} onRestart={mockOnRestart} />);

        expect(screen.getByText(/Quiz Complete!/i)).toBeInTheDocument();
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
        expect(screen.getByText('67%')).toBeInTheDocument();
    });

    test('calls onRestart when Try Again button is clicked', async () => {
        renderWithRouter(<ResultSummary questions={mockQuestions} userAnswers={mockUserAnswers} onRestart={mockOnRestart} />);

        const restartButton = screen.getByText(/Try Again/i);
        await userEvent.click(restartButton);

        expect(mockOnRestart).toHaveBeenCalled();
    });

    test('renders link to review results', () => {
        renderWithRouter(<ResultSummary questions={mockQuestions} userAnswers={mockUserAnswers} onRestart={mockOnRestart} />);

        const reviewButton = screen.getByText(/Back to Review/i);
        expect(reviewButton.closest('a')).toHaveAttribute('href', '/output');
    });
});
