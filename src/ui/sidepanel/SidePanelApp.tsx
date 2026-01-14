import React, { useState, useEffect } from 'react';
import { StudyTrackCard } from '../components/StudyTrackCard';
import { ResourceCard } from '../components/ResourceCard';
import { HighlightCard } from '../components/HighlightCard';
import { ResourceService } from '../../storage/ResourceService';
import { StudyTrackService } from '../../storage/StudyTrackService';
import { HighlightService } from '../../storage/HighlightService';
import { FlashcardService } from '../../storage/FlashcardService';
import { Resource, StudyTrack, Highlight, Flashcard } from '../../types';
import { formatRelativeTime } from '../../lib/utils';

type ViewType = 'overview' | 'resources' | 'tracks' | 'highlights' | 'flashcards' | 'settings';

interface Stats {
  totalResources: number;
  totalTracks: number;
  totalHighlights: number;
  totalFlashcards: number;
  completedTracks: number;
  studyTime: number;
}

export const SidePanelApp: React.FC = () => {
  // Create service instances
  const resourceService = new ResourceService();
  const studyTrackService = new StudyTrackService();
  const highlightService = new HighlightService();
  const flashcardService = new FlashcardService();
  
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalResources: 0,
    totalTracks: 0,
    totalHighlights: 0,
    totalFlashcards: 0,
    completedTracks: 0,
    studyTime: 0,
  });
  const [recentResources, setRecentResources] = useState<Resource[]>([]);
  const [tracks, setTracks] = useState<StudyTrack[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        allResources,
        allTracks,
        allHighlights,
        allFlashcards
      ] = await Promise.all([
        resourceService.getAllResources(),
        studyTrackService.getAllTracks(),
        highlightService.getAllHighlights(),
        flashcardService.getAllFlashcards()
      ]);

      setResources(allResources);
      setTracks(allTracks);
      setHighlights(allHighlights);
      setFlashcards(allFlashcards);

      // Get recent resources (last 5)
      const recent = [...allResources]
        .sort((a, b) => b.studyProgress.lastVisited.getTime() - a.studyProgress.lastVisited.getTime())
        .slice(0, 5);
      setRecentResources(recent);

      // Calculate stats
      const completedTracks = allTracks.filter((t: StudyTrack) => t.progress.completedAt).length;
      const totalStudyTime = allTracks.reduce((sum: number, t: StudyTrack) => sum + t.progress.totalTimeSpent, 0);

      setStats({
        totalResources: allResources.length,
        totalTracks: allTracks.length,
        totalHighlights: allHighlights.length,
        totalFlashcards: allFlashcards.length,
        completedTracks,
        studyTime: totalStudyTime,
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
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

  const handleAddResourceToTrack = async (resource: Resource) => {
    // TODO: Implement add to track functionality
    console.log('Add to track:', resource);
  };

  const filteredResources = resources.filter(r => 
    searchQuery === '' || 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTracks = tracks.filter(t =>
    searchQuery === '' ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHighlights = highlights.filter(h =>
    searchQuery === '' ||
    h.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.note && h.note.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderOverview = () => (
    <div className="overview-content">
      <h2>Study Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalResources}</div>
          <div className="stat-label">Resources</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalTracks}</div>
          <div className="stat-label">Study Tracks</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalHighlights}</div>
          <div className="stat-label">Highlights</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalFlashcards}</div>
          <div className="stat-label">Flashcards</div>
        </div>
      </div>

      <div className="recent-section">
        <h3>Recent Resources</h3>
        <div className="recent-items">
          {recentResources.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onDelete={handleDeleteResource}
              onAddToTrack={handleAddResourceToTrack}
              showActions
            />
          ))}
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="action-btn primary"
            onClick={() => setCurrentView('resources')}
          >
            📚 Browse All Resources
          </button>
          <button 
            className="action-btn"
            onClick={() => setCurrentView('tracks')}
          >
            🎯 View Study Tracks
          </button>
          <button 
            className="action-btn"
            onClick={() => setCurrentView('highlights')}
          >
            ✨ Review Highlights
          </button>
          <button 
            className="action-btn"
            onClick={() => setCurrentView('flashcards')}
          >
            🗃️ Study Flashcards
          </button>
        </div>
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="resources-content">
      <h2>All Resources ({filteredResources.length})</h2>
      <div className="content-list">
        {filteredResources.map(resource => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onDelete={handleDeleteResource}
            onAddToTrack={handleAddResourceToTrack}
            showActions
          />
        ))}
      </div>
    </div>
  );

  const renderTracks = () => (
    <div className="tracks-content">
      <h2>Study Tracks ({filteredTracks.length})</h2>
      <div className="content-list">
        {filteredTracks.map(track => (
          <StudyTrackCard
            key={track.id}
            track={track}
            onDelete={handleDeleteTrack}
            showActions
          />
        ))}
      </div>
    </div>
  );

  const renderHighlights = () => (
    <div className="highlights-content">
      <h2>Highlights ({filteredHighlights.length})</h2>
      <div className="content-list">
        {filteredHighlights.map(highlight => (
          <HighlightCard
            key={highlight.id}
            highlight={highlight}

            onDelete={handleDeleteHighlight}
            showActions
          />
        ))}
      </div>
    </div>
  );

  const renderFlashcards = () => (
    <div className="flashcards-content">
      <h2>Flashcards ({flashcards.length})</h2>
      <p>Flashcard study interface coming soon...</p>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-content">
      <h2>Settings</h2>
      <div className="settings-groups">
        <div className="settings-group">
          <h3>Data Management</h3>
          <button className="settings-btn">Export All Data</button>
          <button className="settings-btn">Import Data</button>
          <button className="settings-btn danger">Clear All Data</button>
        </div>
        <div className="settings-group">
          <h3>Study Preferences</h3>
          <button className="settings-btn">Notification Settings</button>
          <button className="settings-btn">Study Reminders</button>
          <button className="settings-btn">Default Track Settings</button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your study data...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'overview':
        return renderOverview();
      case 'resources':
        return renderResources();
      case 'tracks':
        return renderTracks();
      case 'highlights':
        return renderHighlights();
      case 'flashcards':
        return renderFlashcards();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="sidepanel-app">
      <header className="sidepanel-header">
        <h1>Notum</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search resources, tracks, highlights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <nav className="sidepanel-nav">
        <button
          className={`nav-btn ${currentView === 'overview' ? 'active' : ''}`}
          onClick={() => setCurrentView('overview')}
        >
          🏠 Overview
        </button>
        <button
          className={`nav-btn ${currentView === 'resources' ? 'active' : ''}`}
          onClick={() => setCurrentView('resources')}
        >
          📚 Resources
        </button>
        <button
          className={`nav-btn ${currentView === 'tracks' ? 'active' : ''}`}
          onClick={() => setCurrentView('tracks')}
        >
          🎯 Tracks
        </button>
        <button
          className={`nav-btn ${currentView === 'highlights' ? 'active' : ''}`}
          onClick={() => setCurrentView('highlights')}
        >
          ✨ Highlights
        </button>
        <button
          className={`nav-btn ${currentView === 'flashcards' ? 'active' : ''}`}
          onClick={() => setCurrentView('flashcards')}
        >
          🗃️ Flashcards
        </button>
        <button
          className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>

      <main className="sidepanel-main">
        {renderContent()}
      </main>
    </div>
  );
};