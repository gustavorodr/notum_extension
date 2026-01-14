import React from 'react';
import { StudyTrack } from '@/types';

interface StudyTrackCardProps {
  track: StudyTrack;
  onClick?: (track: StudyTrack) => void;
  onStart?: (track: StudyTrack) => void;
  onDelete?: (track: StudyTrack) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const StudyTrackCard: React.FC<StudyTrackCardProps> = ({
  track,
  onClick,
  onStart,
  onDelete,
  showActions = true,
  compact = false,
}) => {
  const completionPercentage = Math.round(
    (track.progress.completedLessons / Math.max(1, track.lessons.length)) * 100
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const difficultyColors = {
    beginner: '#10b981',
    intermediate: '#f59e0b', 
    advanced: '#ef4444',
  };

  return (
    <div 
      className={`track-card ${compact ? 'compact' : ''}`}
      onClick={() => onClick?.(track)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="track-header">
        <div className="track-info">
          <h3 className="track-title">{track.title}</h3>
          {track.isTemplate && <span className="template-badge">Template</span>}
          <div className="track-meta">
            <span 
              className="difficulty-badge" 
              style={{ backgroundColor: difficultyColors[track.difficulty] }}
            >
              {track.difficulty}
            </span>
            <span className="lesson-count">{track.lessons.length} lições</span>
          </div>
        </div>
      </div>

      {!compact && track.description && (
        <p className="track-description">{track.description}</p>
      )}

      {!compact && track.objective && (
        <div className="track-objective">
          <strong>Objetivo:</strong> {track.objective}
        </div>
      )}

      {!compact && track.prerequisites && track.prerequisites.length > 0 && (
        <div className="track-prerequisites">
          <strong>Pré-requisitos:</strong> {track.prerequisites.join(', ')}
        </div>
      )}

      <div className="track-stats">
        <div className="stat-item">
          <div className="stat-value">{track.lessons.length}</div>
          <div className="stat-label">Lições</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{track.progress.completedLessons}</div>
          <div className="stat-label">Concluídas</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{completionPercentage}%</div>
          <div className="stat-label">Progresso</div>
        </div>
      </div>

      <div className="track-card-footer">
        <div className="track-progress">
          <div className="progress-info">
            <span>Progresso</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="track-actions">
          <span className="last-updated">
            Atualizado em {formatDate(track.updatedAt)}
          </span>
          
          {showActions && (
            <div className="action-buttons">
              {!track.isTemplate && !track.progress.completedAt && onStart && (
                <button 
                  className="action-btn start"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart(track);
                  }}
                  title={track.progress.startedAt ? "Continue" : "Start track"}
                >
                  {track.progress.startedAt ? '▶️' : '🚀'}
                </button>
              )}
              
              {track.isTemplate && (
                <button 
                  className="action-btn duplicate"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle template duplication
                  }}
                  title="Create from template"
                >
                  📄
                </button>
              )}
              
              {onDelete && !track.isTemplate && (
                <button 
                  className="action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(track);
                  }}
                  title="Delete track"
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