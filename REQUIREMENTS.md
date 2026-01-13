# Notum — Project Requirements Document

## 1. Overview

**Notum** is a **local-first** browser extension for active study, note-taking, and knowledge organization from web pages and videos, with a strong focus on privacy, user control, and integration with tools such as **Obsidian**.

All processing must occur **100% on the client**, with no mandatory backend.  
The system must be designed to allow **future integration with paid LLM APIs** without rewriting the core logic.

---

## 2. Project Objectives

### Primary objectives
- Enable capturing, organizing, and reviewing web content (text and video).
- Support active learning (highlights, notes, flashcards, schedules).
- Provide **structured study plans (learning tracks)**.
- Work fully offline after the initial capture.
- Ensure **privacy by default**.

### Secondary objectives
- Export and import data in open formats (Markdown).
- Seamlessly integrate with Obsidian.
- Be extensible for local AI and, in the future, paid AI.
- Allow full customization of the study process.

---

## 3. Project Scope

### In scope (MVP)
- Capture user-selected text from web pages.
- Capture metadata from pages and videos.
- Highlights, annotations, and study progress tracking.
- Basic client-side translation.
- Predefined study plans.
- Manual creation of study tracks.
- Markdown export.
- Local storage (IndexedDB).

### Out of initial scope
- Mandatory backend.
- User login or accounts.
- Automatic cross-device synchronization.
- Automatic AI-based evaluation (future only).
- Project-hosted AI models.

---

## 4. General Architecture

### Base Architecture (Client-Only, Local-First)

Main components:

- **Content Script**
  - Capture text selections.
  - Detect videos (`<video>` and `textTracks`).
  - Extract page content.

- **Background Service Worker (Manifest V3)**
  - Message coordination.
  - Heavy task orchestration.
  - Study plan and track management.
  - File export.

- **UI (Popup / Side Panel)**
  - Visualization of saved resources.
  - Study tracks and schedules.
  - Progress, reviews, and flashcards.
  - Settings and export.

- **Storage**
  - IndexedDB as the main data source.
  - Local cache for translations, summaries, and evaluations.

- **Heavy processing**
  - Web Workers.
  - WASM (when necessary).

---

## 5. Supported Architectures

### 5.1 Local-First Extension (MVP)

- 100% client-side.
- No external communication.
- Fully local tracks and schedules.
- Ideal for fast iteration and maximum privacy.

### 5.2 Local-First Extension + Optional Sync (Future)

- Optional adapter for:
  - Paid LLM
  - External sync
- User explicitly provides an API key.

### 5.3 Local Integration with Obsidian (Optional)

- Markdown-based export/import.
- Optional use of the File System Access API.
- Tracks exported as structured folders.

---

## 6. Functional Requirements

### 6.1 Content Capture

- Capture user-selected text.
- Associate highlights with:
  - URL
  - Page title
  - Timestamp
- Detect videos and duration.
- Capture captions when available.
- Allow associating a resource with a study track.

---

### 6.2 Annotations and Study

- Create highlights and free-form notes.
- Progress tracking per resource and per track:
  - Time spent
  - Last visit
  - Completion percentage
- Organization by type (page, video, PDF).
- Manual flashcards (simple spaced repetition).
- Simple predefined quizzes per track.

---

### 6.3 Study Tracks and Plans

#### Predefined tracks
- The system must provide **ready-made study plans**, versioned and local.
- Each track must include:
  - Objective
  - Prerequisites
  - Suggested content order
  - Milestones

#### Manual tracks
- Users can create custom tracks.
- Captured resources can be manually added to any track.
- Allow reordering, removing, or pausing items in a track.
- A track may include multiple sources (pages, videos, PDFs).

---

### 6.4 Translation (Client-Side)

- Page translation by paragraph (chunking).
- Video caption translation when available.
- Visual overlay (do not replace original content).
- Option to translate only the selected excerpt.

---

### 6.5 Export / Import

- Export complete tracks to Markdown.
- Generate a ZIP containing:
  - `.md` files
  - `assets/` folder
  - Per-track folder structure
  - Progress metadata
- Import previously exported ZIP files.
- Resolve conflicts using `contentHash`.

---

## 7. Non-Functional Requirements

### 7.1 Performance

- Heavy processing must run in Web Workers.
- Only one heavy task at a time.
- Cache results by content hash.
- Visual feedback for progress and task queue.

### 7.2 Privacy

- No data sent to servers by default.
- Minimal permissions in the Manifest.
- External communication only when explicitly enabled.

### 7.3 Usability

- Clear, non-intrusive interface.
- Warnings before CPU-intensive tasks.
- “Battery-aware” mode for mobile devices.
- Clear transparency about what is automatic vs. manual.

---

## 8. Data Model (Summary)

### Main entities

- User (local)
- Resource (page, video, pdf)
- Highlight
- StudyPlan / StudyTrack
- Milestone
- Flashcard
- Asset (audio, image, etc.)

### Storage
- IndexedDB as the source of truth.
- AI cache based on hash (`sha256`).

---

## 9. LLM Integration (Future-Proof)

### Adapter Pattern

All AI operations must go through an abstraction layer.

#### Future AI functions
- Evaluate captured content.
- Suggest **where content fits** in the current track.
- Detect knowledge gaps in a track.
- Help **create a personalized track** based on:
  - User goals
  - Already studied content
  - Recorded progress

The initial implementation must be local (simple heuristics).  
Future implementations may call external APIs without changing the core.

---

## 10. Security

- No data collection without consent.
- API keys (future):
  - Stored locally.
  - Preferably encrypted using Web Crypto.
- Button to delete all local data.

---

## 11. Recommended Technologies

- Language: **TypeScript**
- Storage: IndexedDB (Dexie.js or idb)
- UI: React + TS or Vanilla
- ZIP: JSZip
- WASM / local AI: transformers.js, whisper.cpp (experimental)
- Workers: Web Workers (+ optional Comlink)

---

## 12. Initial Roadmap

1. MVP
   - Text capture
   - Highlights
   - IndexedDB
   - Simple predefined tracks
   - Markdown export
2. Manual tracks + scheduling
3. Local page translation
4. Video caption translation
5. Flashcards and quizzes
6. LLM adapter (stub)
7. AI for track suggestion and evaluation (optional/paid)

---

## 13. Project Principles

- Local-first
- User-owned data
- Explicit and editable tracks
- Open formats
- Privacy by default
- Extensible without rewriting the core
