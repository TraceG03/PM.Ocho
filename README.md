# Construction Project Management Web Application

A comprehensive, mobile-first construction project management web application built with React, Tailwind CSS, and Lucide React icons.

## Features

### 1. Timeline View
- **List/Calendar Toggle**: Switch between list and calendar views
- **Manage Phases**: Create, edit, and delete project phases with custom colors
- **Add Milestones**: Create milestones with dates, phases, and notes
- **Calendar Timeline**: Visual vertical timeline with zoom controls

### 2. Daily Tasks View
- **Quick To-Do List**: Fast task entry with checkboxes
- **Task Management**: Full task creation with categories, priorities, crew assignments
- **Task Grouping**: Tasks organized by date (Today, Tomorrow, etc.)
- **Task Linking**: Link tasks to milestones or documents

### 3. Plans & Contracts View
- **Note Management**: Create notes with types (Plan Detail/Spec)
- **File Attachments**: Visual file attachment support
- **Quick Reference**: Grid view of all notes with quick access

### 4. Photos & Reports View
- **Photo Management**: Simulated camera and library photo capture
- **Report Generation**: Daily and weekly report generation with email
- **Date Selection**: Date picker for organizing photos and reports

### 5. AI Assistant View
- **AI Chat**: Interactive chat interface with suggested topics
- **Timeline Extractor**: Extract milestones from documents using AI simulation
- **Document Parsing**: Paste documents to automatically create milestones

## Tech Stack

- **React 18.3.1**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS 3.4.1**: Styling
- **Lucide React**: Icon library
- **Vite**: Build tool and dev server
- **Vite PWA Plugin**: Progressive Web App support
- **Context API**: State management
- **Supabase**: Backend database and storage
- **OpenAI**: AI-powered assistant features

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Design Features

- **Mobile-First**: Optimized for mobile devices
- **iOS-like Design**: Clean, modern white theme with rounded corners
- **Large Border Radius**: Cards use rounded-3xl (24px) for iOS-like appearance
- **Subtle Shadows**: Soft shadows for depth
- **Bottom Navigation**: Fixed bottom navigation bar for easy access
- **Smooth Transitions**: Polished animations and transitions

## Project Structure

```
src/
├── App.tsx                 # Main app component
├── main.tsx               # Entry point
├── index.css              # Global styles
├── context/
│   └── AppContext.tsx     # State management
├── components/
│   └── BottomNav.tsx      # Bottom navigation bar
└── views/
    ├── TimelineView.tsx
    ├── DailyTasksView.tsx
    ├── PlansContractsView.tsx
    ├── PhotosReportsView.tsx
    └── AIAssistantView.tsx
```

## State Management

The app uses React Context API for centralized state management. All data (phases, milestones, tasks, notes, photos) persists during the session and is shared across all views.

## Progressive Web App (PWA)

This application is a Progressive Web App that can be installed on your device for a native app-like experience.

### PWA Features

- **Installable**: Add to home screen on mobile and desktop
- **Offline Support**: Service worker caches assets for offline access
- **App-like Experience**: Standalone display mode, no browser UI
- **Fast Loading**: Cached resources load instantly
- **Network Caching**: Supabase API responses are cached for better performance

### Setting Up PWA Icons

To complete the PWA setup, you need to generate app icons:

1. Open `public/pwa-icon-generator.html` in your browser
2. Click the download buttons for each icon size
3. Save the downloaded files to the `public` folder:
   - `pwa-192x192.png`
   - `pwa-512x512.png`
   - `apple-touch-icon.png`

After adding the icons, rebuild the app:

```bash
npm run build
```

### Installing the PWA

**On Mobile (iOS/Android):**
- Open the app in Safari (iOS) or Chrome (Android)
- Tap the Share button
- Select "Add to Home Screen"

**On Desktop (Chrome/Edge):**
- Look for the install icon in the address bar
- Click "Install" when prompted

## Browser Support

- Chrome (latest) - Full PWA support
- Firefox (latest) - Full PWA support
- Safari (latest) - Full PWA support (iOS 11.3+)
- Edge (latest) - Full PWA support

## License

MIT
