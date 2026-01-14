import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HighlightCard } from '@/ui/components/HighlightCard';
import { Highlight } from '@/types';

describe('ui/components HighlightCard', () => {
  test('allows editing note and calls onUpdate', () => {
    const highlight: Highlight = {
      id: 'h1',
      resourceId: 'r1',
      url: 'https://example.com',
      text: 'Some text',
      context: 'ctx',
      position: { startOffset: 0, endOffset: 4, selector: 'p:nth-child(1)' },
      color: '#ffff00',
      note: 'old',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const onUpdate = jest.fn();

    render(<HighlightCard highlight={highlight} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByTitle('Editar nota'));

    const textarea = screen.getByPlaceholderText('Adicionar nota...');
    fireEvent.change(textarea, { target: { value: 'new note' } });

    fireEvent.click(screen.getByText('💾 Salvar'));

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 'h1', note: 'new note' }));
  });
});
