import React from 'react';
import { Resource } from '@/types';
import { formatRelativeTime, formatDuration, extractDomain, truncateText } from '@/lib/utils';

interface ResourceCardProps {
  resource: Resource;
  onSelect?: (resource: Resource) => void;
  onAddToTrack?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void; // Change to expect full resource object
  showActions?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onSelect,
  onAddToTrack,
  onDelete,
  showActions = true,
}) => {
  const getTypeIcon = (type: Resource['type']) => {
    switch (type) {
      case 'page': return '📄';
      case 'video': return '🎥';
      case 'pdf': return '📋';
      default: return '📄';
    }
  };

  const getTypeColor = (type: Resource['type']) => {
    switch (type) {
      case 'page': return '#3b82f6';
      case 'video': return '#ef4444';
      case 'pdf': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="resource-card" onClick={() => onSelect?.(resource)}>
      <div className="resource-card-header">
        <div className="resource-type" style={{ color: getTypeColor(resource.type) }}>
          <span className="type-icon">{getTypeIcon(resource.type)}</span>
          <span className="type-label">{resource.type}</span>
        </div>
        <div className="resource-domain">
          {extractDomain(resource.url)}
        </div>
      </div>
      
      <div className="resource-card-body">
        <h3 className="resource-title">
          {truncateText(resource.title, 80)}
        </h3>
        
        {resource.content && (
          <p className="resource-excerpt">
            {truncateText(resource.content, 150)}
          </p>
        )}
        
        <div className="resource-metadata">
          {resource.metadata.duration && (
            <span className="metadata-item">
              Duration: {formatDuration(resource.metadata.duration)}
            </span>
          )}
          {resource.metadata.wordCount && (
            <span className="metadata-item">
              {resource.metadata.wordCount} words
            </span>
          )}
        </div>
      </div>
      
      <div className="resource-card-footer">
        <div className="resource-progress">
          <div className="progress-info">
            <span>Progress: {resource.studyProgress.completionPercentage}%</span>
            {resource.studyProgress.timeSpent > 0 && (
              <span>Time: {formatDuration(resource.studyProgress.timeSpent)}</span>
            )}
          </div>
          <div 
            className="progress-bar"
            style={{ 
              width: '100%', 
              height: '4px', 
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <div 
              className="progress-fill"
              style={{ 
                width: `${resource.studyProgress.completionPercentage}%`,
                height: '100%',
                backgroundColor: getTypeColor(resource.type),
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
        
        <div className="resource-actions">
          <span className="last-visited">
            {formatRelativeTime(resource.studyProgress.lastVisited)}
          </span>
          
          {showActions && (
            <div className="action-buttons">
              {onAddToTrack && (
                <button 
                  className="action-btn add-to-track"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToTrack(resource);
                  }}
                  title="Add to track"
                >
                  📚
                </button>
              )}
              <button 
                className="action-btn view"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(resource.url, '_blank');
                }}
                title="Open original"
              >
                🔗
              </button>
              {onDelete && (
                <button 
                  className="action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this resource?')) {
                      onDelete(resource);
                    }
                  }}
                  title="Delete"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};