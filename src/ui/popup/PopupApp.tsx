import React, { useState, useEffect } from 'react';
import { ResourceCard } from '../components/ResourceCard';
import { StudyTrackCard } from '../components/StudyTrackCard';
import { HighlightCard } from '../components/HighlightCard';
import { ResourceService } from '../../storage/ResourceService';
import { StudyTrackService } from '../../storage/StudyTrackService';
import { HighlightService } from '../../storage/HighlightService';
import { Resource, StudyTrack, Highlight } from '../../types';
import { sendMessage } from '../../lib/messaging';
import { formatRelativeTime } from '../../lib/utils';

type TabType = 'overview' | 'capture' | 'resources' | 'tracks';

interface PopupData {
  recentResources: Resource[];
  activeTracks: StudyTrack[];
  recentHighlights: Highlight[];
  totalResources: number;
  totalTracks: number;
  totalHighlights: number;
}

export const PopupApp: React.FC = () => {
  // Create service instances
  const resourceService = new ResourceService();
  const studyTrackService = new StudyTrackService();
  const highlightService = new HighlightService();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [data, setData] = useState<PopupData>({
    recentResources: [],
    activeTracks: [],
    recentHighlights: [],
    totalResources: 0,
    totalTracks: 0,
    totalHighlights: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resources, tracks, highlights] = await Promise.all([
        resourceService.getAllResources(),
        studyTrackService.getAllTracks(),
        highlightService.getAllHighlights()
      ]);

      // Get recent items (last 3 for popup)
      const recentResources = resources
        .sort((a: Resource, b: Resource) => b.studyProgress.lastVisited.getTime() - a.studyProgress.lastVisited.getTime())
        .slice(0, 3);

      const activeTracks = tracks
        .filter((t: StudyTrack) => !t.progress.completedAt)
        .sort((a: StudyTrack, b: StudyTrack) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 3);

      const recentHighlights = highlights
        .sort((a: Highlight, b: Highlight) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 3);

      setData({
        recentResources,
        activeTracks,
        recentHighlights,
        totalResources: resources.length,
        totalTracks: tracks.length,
        totalHighlights: highlights.length,
      });
    } catch (error) {
      console.error('Error loading popup data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSidePanel = async () => {
    await sendMessage({ type: 'open-side-panel' });
  };

  const handleCaptureCurrentPage = async () => {
    await sendMessage({ type: 'capture-current-page' });
    await loadData(); // Refresh data after capture
  };

  const handleCreateQuickNote = async () => {
    const note = prompt('Enter your quick note:');
    if (note?.trim()) {
      await sendMessage({ type: 'create-quick-note', data: { note: note.trim() } });
      await loadData();
    }
  };

  const handleDeleteResource = async (resource: Resource) => {
    try {
      await resourceService.deleteResource(resource.id);
      await loadData();
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const handleDeleteTrack = async (track: StudyTrack) => {
    try {
      await studyTrackService.deleteTrack(track.id);
      await loadData();
    } catch (error) {
      console.error('Error deleting track:', error);
    }
  };

  const handleDeleteHighlight = async (highlight: Highlight) => {
    try {
      await highlightService.deleteHighlight(highlight.id);
      await loadData();
    } catch (error) {
      console.error('Error deleting highlight:', error);
    }
  };

  const renderOverviewTab = () => (
    <div className="overview-tab">
      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-number">{data.totalResources}</span>
          <span className="stat-label">Resources</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{data.totalTracks}</span>
          <span className="stat-label">Tracks</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{data.totalHighlights}</span>
          <span className="stat-label">Highlights</span>
        </div>
      </div>

      {data.recentResources.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h3>Recent Resources</h3>
            <button 
              className="btn-secondary"
              onClick={() => setActiveTab('resources')}
            >
              View All
            </button>
          </div>
          <div className="content-list">
            {data.recentResources.map(resource => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onDelete={handleDeleteResource}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}

      {data.activeTracks.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h3>Active Tracks</h3>
            <button 
              className="btn-secondary"
              onClick={() => setActiveTab('tracks')}
            >
              View All
            </button>
          </div>
          <div className="content-list">
            {data.activeTracks.map(track => (
              <StudyTrackCard
                key={track.id}
                track={track}
                onDelete={handleDeleteTrack}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCaptureTab = () => (
    <div className="capture-tab">
      <div className="capture-tools">
        <h3>Capture Current Page</h3>
        
        <div className="tool-card">
          <h4>📚 Save as Resource</h4>
          <p>Add this page to your resource library for later study.</p>
          <button 
            className="btn-primary"
            onClick={handleCaptureCurrentPage}
          >
            Capture Page
          </button>
        </div>

        <div className="tool-card">
          <h4>✨ Highlight Text</h4>
          <p>Select text on this page to create highlights with notes.</p>
          <button 
            className="btn-secondary"
            onClick={() => sendMessage({ type: 'enable-text-selection' })}
          >
            Enable Selection
          </button>
        </div>

        <div className="tool-card">
          <h4>📝 Quick Note</h4>
          <p>Create a quick note about this page or topic.</p>
          <button 
            className="btn-secondary"
            onClick={handleCreateQuickNote}
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  );

  const renderResourcesTab = () => (
    <div className="resources-tab">
      <div className="section-header">
        <h3>All Resources ({data.totalResources})</h3>
      </div>
      <div className="content-list">
        {data.recentResources.map(resource => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onDelete={handleDeleteResource}
            showActions
          />
        ))}
      </div>
      {data.totalResources > 3 && (
        <div className="view-more">
          <button 
            className="btn-secondary"
            onClick={handleOpenSidePanel}
          >
            View All Resources in Side Panel
          </button>
        </div>
      )}
    </div>
  );

  const renderTracksTab = () => (
    <div className="tracks-tab">
      <div className="section-header">
        <h3>Study Tracks ({data.totalTracks})</h3>
      </div>
      <div className="content-list">
        {data.activeTracks.map(track => (
          <StudyTrackCard
            key={track.id}
            track={track}
            onDelete={handleDeleteTrack}
            showActions
          />
        ))}
      </div>
      {data.totalTracks > 3 && (
        <div className="view-more">
          <button 
            className="btn-secondary"
            onClick={handleOpenSidePanel}
          >
            View All Tracks in Side Panel
          </button>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="loading">
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'capture':
        return renderCaptureTab();
      case 'resources':
        return renderResourcesTab();
      case 'tracks':
        return renderTracksTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="popup-app">
      <header className="popup-header">
        <div className="header-content">
          <h1>Notum</h1>
          <button 
            className="side-panel-btn"
            onClick={handleOpenSidePanel}
            title="Open side panel"
          >
            📋
          </button>
        </div>
        
        <nav className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'capture' ? 'active' : ''}`}
            onClick={() => setActiveTab('capture')}
          >
            Capture
          </button>
          <button
            className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            Resources
          </button>
          <button
            className={`tab-btn ${activeTab === 'tracks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracks')}
          >
            Tracks
          </button>
        </nav>
      </header>

      <main className="popup-main">
        {renderTabContent()}
      </main>
    </div>
  );
};