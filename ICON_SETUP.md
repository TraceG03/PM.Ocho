# Icon Setup Instructions

## Quick Setup

1. **Generate Icons:**
   - Open `public/generate-icon.html` in your web browser
   - Click each download button to save the icon files:
     - `icon-192x192.png` (for Android)
     - `icon-512x512.png` (for Android)
     - `icon-180x180.png` (rename to `apple-touch-icon.png` for iOS)
     - `icon-48x48.png` (rename to `favicon.png` for favicon)

2. **Place Icons:**
   - Save all downloaded PNG files to the `public/` folder
   - Rename `icon-180x180.png` to `apple-touch-icon.png`
   - Rename `icon-48x48.png` to `favicon.png` (optional, you can also keep the SVG favicon)

3. **Build the App:**
   ```bash
   npm run build
   ```

4. **Test:**
   - The app icon should now show "ocho construction" on a black background
   - When you add the app to your phone's home screen, it will use this icon

## Icon Design

- **Background:** Pure black (#000000)
- **Text:** "ocho construction" in white
- **Font:** System font stack (clean, minimalistic)
- **Layout:** "ocho" on top, "construction" below (smaller, lighter weight)

## Files Created

- `public/icon.svg` - SVG version of the icon
- `public/icon-source.svg` - High-resolution source (1024x1024)
- `public/generate-icon.html` - Icon generator tool
- `vite.config.js` - Updated with PWA configuration
- `index.html` - Updated with PWA meta tags

