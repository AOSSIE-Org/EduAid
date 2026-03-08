import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModeSelector from './ModeSelector';

describe('ModeSelector Component', () => {
    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders correctly with title and options', () => {
        render(<ModeSelector onSelect={mockOnSelect} onClose={mockOnClose} />);

        expect(screen.getByText(/Choose your/i)).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Challenge/i })).toBeInTheDocument();
        expect(screen.getByText(/Practice Mode/i)).toBeInTheDocument();
        expect(screen.getByText(/Test Mode/i)).toBeInTheDocument();
    });

    test('calls onSelect with "practice" when Practice Mode is clicked', async () => {
        render(<ModeSelector onSelect={mockOnSelect} onClose={mockOnClose} />);

        const practiceButton = screen.getByRole('button', { name: /Practice Mode/i });
        await userEvent.click(practiceButton);

        expect(mockOnSelect).toHaveBeenCalledWith('practice');
    });

    test('calls onSelect with "test" when Test Mode is clicked', async () => {
        render(<ModeSelector onSelect={mockOnSelect} onClose={mockOnClose} />);

        const testButton = screen.getByRole('button', { name: /Test Mode/i });
        await userEvent.click(testButton);

        expect(mockOnSelect).toHaveBeenCalledWith('test');
    });

    test('calls onClose when close button is clicked', async () => {
        render(<ModeSelector onSelect={mockOnSelect} onClose={mockOnClose} />);

        const buttons = screen.getAllByRole('button');
        await userEvent.click(buttons[0]);

        expect(mockOnClose).toHaveBeenCalled();
    });
});
