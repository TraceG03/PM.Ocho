# Setup Instructions

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (will be installed with npm install)

## Installation Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
   ```
   
   Get your API key from: https://platform.openai.com/api-keys

3. **Create assets directory (optional):**
   The app expects some assets. You can create placeholder images or skip for now:
   ```bash
   mkdir assets
   ```
   
   Required assets (can be placeholders):
   - `assets/icon.png` (1024x1024)
   - `assets/splash.png` (1242x2436)
   - `assets/adaptive-icon.png` (1024x1024)
   - `assets/favicon.png` (48x48)

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
my-work-app/
├── App.tsx                    # Main entry point
├── index.js                   # Expo entry point
├── global.css                 # TailwindCSS styles
├── package.json               # Dependencies
├── app.json                   # Expo configuration
├── tsconfig.json              # TypeScript config
├── tailwind.config.js         # TailwindCSS config
├── babel.config.js            # Babel config
├── metro.config.js            # Metro bundler config
├── src/
│   ├── navigation/
│   │   └── RootNavigator.tsx  # Bottom tab navigation
│   ├── screens/
│   │   ├── TimelineScreen.tsx
│   │   ├── DailyTasksScreen.tsx
│   │   ├── PlansContractsScreen.tsx
│   │   ├── PhotosReportsScreen.tsx
│   │   └── AIScreen.tsx
│   └── store/
│       └── siteManagerStore.ts # Zustand state management
└── assets/                    # App icons and images
```

## Features Overview

### Timeline Screen
- Add/edit/delete project milestones
- Switch between List and Calendar views
- Assign phases with custom colors
- Date range selection

### Daily Tasks Screen
- Create tasks with priorities (Normal, High, Critical)
- Link tasks to milestones
- Filter by date
- Mark tasks as complete

### Plans & Contracts Screen
- Upload PDFs and images
- View documents in-app
- Add categorized notes
- Reference documents in notes

### Photos & Reports Screen
- Take photos or pick from gallery
- Add captions to photos
- Generate AI-powered daily/weekly reports
- Email reports with photo attachments

### AI Assistant Screen
- Chat mode: Ask construction-related questions
- Extractor mode: Extract milestones from document text
- Share responses via WhatsApp
- GPT-4o powered

## Troubleshooting

### Common Issues

1. **Metro bundler errors:**
   ```bash
   npm start -- --reset-cache
   ```

2. **NativeWind not working:**
   - Ensure `global.css` is imported in `App.tsx`
   - Check `metro.config.js` is configured correctly
   - Restart Metro bundler

3. **OpenAI API errors:**
   - Verify your API key in `.env`
   - Check you have credits in your OpenAI account
   - Ensure the key starts with `sk-`

4. **TypeScript errors:**
   - Run `npm install` to ensure all types are installed
   - Check `tsconfig.json` has `"jsx": "react-native"`

## Next Steps

1. Customize the default phases in `src/store/siteManagerStore.ts`
2. Add your OpenAI API key to `.env`
3. Test all features on a device
4. Customize colors and styling in `tailwind.config.js`

## Data Storage

All data is persisted locally using AsyncStorage. No backend required. Data persists across app restarts.

