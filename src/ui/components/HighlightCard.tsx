import React, { useState } from 'react';
import { Highlight } from '@/types';

interface HighlightCardProps {
  highlight: Highlight;
  onClick?: (highlight: Highlight) => void;
  onDelete?: (highlight: Highlight) => void;
  onUpdate?: (highlight: Highlight) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const HighlightCard: React.FC<HighlightCardProps> = ({
  highlight,
  onClick,
  onDelete,
  onUpdate,
  showActions = true,
  compact = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState(highlight.note || '');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleSaveNote = () => {
    if (onUpdate) {
      onUpdate({ ...highlight, note: editedNote });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedNote(highlight.note || '');
    setIsEditing(false);
  };

  return (
    <div 
      className={`highlight-card ${compact ? 'compact' : ''}`}
      onClick={() => !isEditing && onClick?.(highlight)}
      style={{ cursor: !isEditing && onClick ? 'pointer' : 'default' }}
    >
      <div className="highlight-header">
        <div className="highlight-text">
          "{highlight.text}"
        </div>
        {highlight.metadata?.title && (
          <div className="highlight-source">
            de: {highlight.metadata.title}
          </div>
        )}
      </div>

      {!compact && (
        <div className="highlight-context">
          <div className="context-info">
            <span>URL:</span>
            <a 
              href={highlight.url} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {new URL(highlight.url).hostname}
            </a>
          </div>
          <div className="context-info">
            <span>Capturado:</span>
            <span>{formatDate(highlight.createdAt)}</span>
          </div>
        </div>
      )}

      <div className="note-section">
        {isEditing ? (
          <div className="note-editor">
            <textarea
              value={editedNote}
              onChange={(e) => setEditedNote(e.target.value)}
              placeholder="Adicionar nota..."
              onClick={(e) => e.stopPropagation()}
              rows={3}
            />
            <div className="editor-actions">
              <button 
                className="btn-save"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveNote();
                }}
              >
                💾 Salvar
              </button>
              <button 
                className="btn-cancel"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelEdit();
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="note-display">
            <div className="note-header">
              <span>Nota</span>
              {showActions && (
                <button 
                  className="edit-note-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  title="Editar nota"
                >
                  ✏️
                </button>
              )}
            </div>
            {highlight.note ? (
              <div className="note-text">{highlight.note}</div>
            ) : (
              <div className="no-note">Nenhuma nota adicionada</div>
            )}
          </div>
        )}
      </div>

      {showActions && !isEditing && (
        <div className="highlight-actions">
          <div className="action-buttons">
            {onDelete && (
              <button 
                className="action-btn delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(highlight);
                }}
                title="Delete highlight"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};