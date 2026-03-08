import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionCard from './QuestionCard';

describe('QuestionCard Component', () => {
    const mockQuestion = {
        question: 'What is React?',
        options: ['A library', 'A framework', 'A language'],
        answer: 'A library',
        question_type: 'Multiple Choice'
    };
    const mockOnAnswer = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders question and options correctly', () => {
        render(<QuestionCard question={mockQuestion} onAnswer={mockOnAnswer} selectedAnswer={null} mode="practice" />);

        expect(screen.getByText('What is React?')).toBeInTheDocument();
        expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
        mockQuestion.options.forEach(option => {
            expect(screen.getByText(option)).toBeInTheDocument();
        });
    });

    test('calls onAnswer when an option is clicked', async () => {
        render(<QuestionCard question={mockQuestion} onAnswer={mockOnAnswer} selectedAnswer={null} mode="practice" />);

        const optionButton = screen.getByText('A library');
        await userEvent.click(optionButton);

        expect(mockOnAnswer).toHaveBeenCalledWith('A library');
    });

    test('shows correct feedback in practice mode when correct answer is selected', () => {
        render(<QuestionCard question={mockQuestion} onAnswer={mockOnAnswer} selectedAnswer="A library" mode="practice" />);

        expect(screen.getByText(/The correct answer is/i)).toBeInTheDocument();
        expect(screen.getAllByText('A library').length).toBeGreaterThan(1);
    });

    test('shows incorrect feedback in practice mode when wrong answer is selected', () => {
        render(<QuestionCard question={mockQuestion} onAnswer={mockOnAnswer} selectedAnswer="A framework" mode="practice" />);

        expect(screen.getByText(/The correct answer is/i)).toBeInTheDocument();
        expect(screen.getAllByText('A library').length).toBeGreaterThan(0);
    });

    test('does not show explanation in test mode even if answer is selected', () => {
        render(<QuestionCard question={mockQuestion} onAnswer={mockOnAnswer} selectedAnswer="A library" mode="test" />);

        expect(screen.queryByText(/The correct answer is/i)).not.toBeInTheDocument();
    });

    test('disables buttons after an answer is selected', () => {
        render(<QuestionCard question={mockQuestion} onAnswer={mockOnAnswer} selectedAnswer="A library" mode="practice" />);

        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
            expect(button).toBeDisabled();
        });
    });
});
