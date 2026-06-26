# FocusPix 📸

FocusPix is a high-performance, premium, offline-first photo and video gallery application designed for a smooth, native-like experience. Built with **React Native + Expo**, it features a gorgeous **Obsidian-inspired dark theme** with custom transitions, gesture-driven controls, and sophisticated background media syncing.

---

## 🎨 Design System & Aesthetics
FocusPix implements a sleek, high-contrast, tactile design system inspired by Obsidian's dark palette:
*   **Pure Pitch-Black Background** (`#000000`) for absolute contrast, showcasing media content vibrantly.
*   **Charcoal Cards** (`#16171b`) and **Elevated Elements** (`#22252a`) to create clear structural depth.
*   **Vibrant Mint-Teal Accent** (`#24e0b0`) used for pill states, active icons, interactive switches, and sliders.
*   **Custom Tab Bar**: A responsive bottom navigation bar utilizing custom native SVG icons, where the active tab dynamically expands into a horizontal pill.

---

## 📱 Navigation Structure (3-Tab Layout)

FocusPix is organized around a highly efficient **3-tab layout**:

### 1. 📅 Timeline
Your media library, ordered newest first and grouped neatly by local calendar day (e.g., *Today*, *Yesterday*, *24 June 2026*).
*   **Integrated Search**: Search by date (*"June 2026"*, *"last week"*, *"yesterday"*) or folder name directly from the search bar pinned to the top of the timeline.
*   **Camera Integration**: A circular `+` button in the header requests camera permissions and launches the device camera using `expo-image-picker`, instantly saving new photos to the device gallery.
*   **Multi-Select**: Long-press any thumbnail to enter select mode. Share multiple items via the system share sheet or batch delete them.
*   **Media Viewer**: Tap any photo or video to open a full-screen viewer. Supports swipe navigation (left/right) and a swipe-down-to-dismiss gesture. Videos show a play icon and duration badge.

### 2. 📁 Albums
Organizes and aggregates photos/videos by folders and custom collections.
*   **System Albums**: Auto-discovers folder structures like *Camera*, *Screenshots*, *Downloads*, etc.
*   **Custom Albums**: Create user-defined collections, add or remove media items, and delete albums without affecting original media files on the device.

### 3. ⚙️ Settings
A clean, centralized control center for user options:
*   **Display Preferences**: Toggle video visibility inside the main timeline and choose between Light, Dark, or System Auto themes.
*   **Folder Exclusions**: Easily exclude specific directories (e.g., *Downloads* or *WhatsApp Images*) from showing up in the timeline or albums.
*   **Safety & Deletion**: 
    *   Toggle between **Permanent Delete** and **Recycle Bin**.
    *   Customize Recycle Bin retention days (from 1 to 90 days) with a tactile drag slider.
    *   Access the **Recycle Bin** interface directly to view, restore, or empty recycled items.

---

## ⚡ Performance & Reliability Optimizations

FocusPix is built to look, feel, and run like a native device application:

### 🚀 Instant Startup Sync
Standard device galleries load photos immediately. FocusPix accomplishes this by:
1.  Fetching the first **60 media assets** instantly on startup.
2.  Rendering the timeline with the initial batch to provide immediate interactive feedback.
3.  Fetching and syncing the remaining media library in the background, updating the UI smoothly as new items resolve.

### 🛡️ Crash & Hang Immunity
*   **Dynamic Module Loading**: Solves common startup crashes (e.g., missing native modules on simulator or web) by dynamically importing `expo-media-library` at runtime. The app remains fully functional on unsupported platforms.
*   **Async Deletion Safety**: Custom state busy-locks in deleting callbacks are wrapped in robust `try...catch...finally` blocks. This guarantees that loading and selection overlays are properly dismissed even if permission requests or native filesystem actions fail.
*   **Timezone & Grouping Consistency**: Grouping offsets are calculated on normalized local midnights, converting timestamps accurately between unix seconds and milliseconds.

---

## 🛠️ Technical Stack
*   **Core**: Expo SDK 56 + React Native + TypeScript
*   **File Routing**: `expo-router` (file-based navigation)
*   **Media Access**: Dynamic imports of `expo-media-library`
*   **Fast Caching**: `expo-image` for high-performance memory and disk caching of media thumbnails
*   **Video Playback**: `expo-video` for native full-screen video rendering
*   **Shared Actions**: `expo-sharing` and `expo-image-picker`
*   **Gestures & Animation**: `react-native-gesture-handler` + `react-native-reanimated`
*   **State Management**: `Zustand` with AsyncStorage persistence for settings, custom albums, and recycle bin

---

## 🏃 Getting Started

### 1. Installation
Navigate to the root directory and install dependencies:
```bash
npm install
```

### 2. Launch Developer Server
```bash
npm start
```
This runs `expo start --dev-client`. Open the app in Expo Go or your emulator.

### 3. Build & Run on Device
To experience full native features (including `expo-media-library` folder scanning, deletion control, and video playback):
```bash
# For Android
npm run android

# For iOS (macOS + Xcode required)
npm run ios
```

---

## 📂 Project Directory Structure

```
focuspix/
├── app/                      # Expo Router Navigation Pages
│   ├── _layout.tsx           # Root navigation layout (Provider initializations)
│   ├── (tabs)/               # Bottom Tabs
│   │   ├── _layout.tsx       # Bottom tabs custom bar configuration
│   │   ├── index.tsx         # Timeline Tab (Search, Camera, and Day-Grouped Grid)
│   │   ├── albums.tsx        # Albums List Tab
│   │   └── settings.tsx      # Settings Tab (Display, Hidden Foldles, Delete)
│   ├── album/
│   │   ├── [id].tsx          # Album detailed grid
│   │   └── new.tsx           # Create custom album flow
│   ├── viewer/
│   │   └── [id].tsx          # Full-screen gesture media viewer
│   └── recycle.tsx           # Recycle Bin screen (Restore/Empty actions)
├── src/
│   ├── components/           # Reusable UI elements (PhotoGrid, DaySection, MediaThumb, CustomSlider)
│   ├── services/             # Core media services (Dynamic expo-media-library integration)
│   ├── store/                # Zustand stores (Settings, Recycle Bin, Custom Albums)
│   ├── theme/                # Global styling theme (Obsidian light/dark palette, spacing, radii)
│   ├── utils/                # Helper utilities (Date conversion, layout grid sizing)
│   └── types.ts              # Global TypeScript models
├── app.json                  # Expo app configuration
└── package.json              # Project script & package dependencies
```
