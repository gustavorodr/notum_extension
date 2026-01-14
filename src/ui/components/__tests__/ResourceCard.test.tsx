import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResourceCard } from '@/ui/components/ResourceCard';
import { Resource } from '@/types';

describe('ui/components ResourceCard', () => {
  test('calls onAddToTrack and onDelete with resource', () => {
    const resource: Resource = {
      id: 'r1',
      type: 'page',
      url: 'https://example.com/a',
      title: 'My Title',
      content: 'Hello',
      metadata: { domain: 'example.com', wordCount: 1 },
      contentHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
      studyProgress: {
        timeSpent: 0,
        lastVisited: new Date(),
        completionPercentage: 0,
        reviewCount: 0,
      },
    };

    const onAddToTrack = jest.fn();
    const onDelete = jest.fn();

    render(
      <ResourceCard
        resource={resource}
        onAddToTrack={onAddToTrack}
        onDelete={onDelete}
      />
    );

    // Add-to-track button
    fireEvent.click(screen.getByTitle('Add to track'));
    expect(onAddToTrack).toHaveBeenCalledWith(resource);

    // Delete button (confirm is mocked to true in setup)
    fireEvent.click(screen.getByTitle('Delete'));
    expect(onDelete).toHaveBeenCalledWith(resource);
  });
});
