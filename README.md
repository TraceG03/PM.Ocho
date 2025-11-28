# My Work App

A comprehensive construction site management app built with Expo, React Native, and TypeScript.

## Features

- **Timeline Management**: Track project milestones with calendar and list views
- **Daily Tasks**: Manage daily to-dos with priority levels
- **Plans & Contracts**: Upload and view PDFs and images with notes
- **Photos & Reports**: Document progress with photos and AI-generated reports
- **AI Assistant**: GPT-4o powered assistant for construction questions and milestone extraction

## Tech Stack

- Expo SDK 53
- React Native 0.76.7
- TypeScript
- NativeWind (TailwindCSS) for styling
- Zustand for state management
- React Navigation for routing
- OpenAI GPT-4o for AI features

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory:
```
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

3. Start the development server:
```bash
npm start
```

## Project Structure

```
├── App.tsx                 # Main entry point
├── src/
│   ├── navigation/         # Navigation setup
│   ├── screens/            # Screen components
│   │   ├── TimelineScreen.tsx
│   │   ├── DailyTasksScreen.tsx
│   │   ├── PlansContractsScreen.tsx
│   │   ├── PhotosReportsScreen.tsx
│   │   └── AIScreen.tsx
│   └── store/              # Zustand store
│       └── siteManagerStore.ts
└── package.json
```

## Features in Detail

### Timeline Screen
- Add/edit/delete milestones
- List and Calendar (Gantt-style) views
- Phase management with custom colors
- Date picker integration

### Daily Tasks Screen
- Quick to-do checklist
- Priority levels (Normal, High, Critical)
- Link to milestones and documents
- Date filtering

### Plans & Contracts Screen
- Upload PDFs and images
- Built-in PDF viewer
- Categorized notes with document references

### Photos & Reports Screen
- Photo documentation with captions
- AI-powered daily/weekly report generation
- Email reports with photo attachments

### AI Assistant Screen
- Two modes: Chat and Timeline Extractor
- GPT-4o powered construction assistant
- Extract milestones from documents
- WhatsApp integration for sharing

## Data Persistence

All data is stored locally using AsyncStorage. No backend required.

## Default Phases

1. Site Prep
2. Foundation
3. Masonry
4. Roof
5. Electrical
6. Plumbing/PTAR
7. Finishes
8. Inspection

## License

Private project

