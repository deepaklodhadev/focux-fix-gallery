# Foco Gallery 📸

Foco Gallery is a high-performance, premium, offline-first photo and video gallery application designed for a smooth, native-like experience. Built with **React Native + Expo**, it features a gorgeous **Obsidian-inspired dark theme** with custom transitions, gesture-driven controls, and sophisticated background media syncing.

---

## 🎨 Design System & Aesthetics
Foco Gallery implements a sleek, high-contrast, tactile design system inspired by Obsidian's dark palette:
*   **Pure Pitch-Black Background** (`#000000`) for absolute contrast, showcasing media content vibrantly.
*   **Charcoal Cards** (`#16171b`) and **Elevated Elements** (`#22252a`) to create clear structural depth.
*   **Vibrant Mint-Teal Accent** (`#24e0b0`) used for pill states, active icons, interactive switches, and stepper buttons.
*   **Custom Tab Bar**: A responsive bottom navigation bar utilizing custom native SVG icons, where the active tab dynamically expands into a horizontal pill.
*   **Floating Selection Capsule Bar**: A glassmorphic, rounded bottom capsule bar that floats above the screen, complete with drop shadows and mapping actions directly to clean, minimalist inline SVG icons (Share, Set as Private, Unlock, Trash/Delete, Close/Cancel).

---

## 📱 Navigation & Features

Foco Gallery is organized around a highly efficient navigation structure:

### 1. 📅 Timeline
Your media library, ordered newest first and grouped neatly by local calendar day (e.g., *Today*, *Yesterday*, *24 June 2026*).
*   **Integrated Search**: Search by date (*"June 2026"*, *"last week"*, *"yesterday"*) or folder name directly from the search bar pinned to the top of the timeline.
*   **Camera Integration**: A circular `+` button requests camera permissions and launches the device camera using `expo-image-picker`, saving captured photos directly to the gallery.
*   **Modern Selection & Sharing**: Long-press any thumbnail to enter select mode. Share selected items via the system sheet, set them as private, or batch delete them.
*   **Media Viewer**: Tap any photo or video to open a full-screen viewer. Supports swipe navigation (left/right) and a swipe-down-to-dismiss gesture. Videos show a play icon and duration badge.
*   **Global Fast-Scrollbar**: Slide or tap the right-hand scroll track (featuring a wide 24px invisible hitbox and a thin 6px visual indicator) to instantly scroll through large datasets.

### 2. 📁 Albums
Organizes and aggregates photos/videos by folders and custom collections.
*   **System Albums**: Auto-discovers folder structures like *Camera*, *Screenshots*, *Downloads*, etc.
*   **Custom Albums**: Create user-defined collections, add/remove media items, and delete custom albums without affecting the original files on disk.

### 3. 🔐 Private Vault (`/vault`)
A secure space hidden behind a custom 4-digit passcode keypad.
*   **Total Exclusion**: Media items moved to the vault are hidden automatically from the timeline, albums, search, and viewer swipes.
*   **Passcode Management**: Features passcode creation, confirmation, and verification modes. Includes dot-indicators with 150ms entry feedback delay.
*   **Manage Private Items**: Day-grouped grid listing. Support multi-select **Unlock** (to restore back to the library) and permanent **Delete** (via `CustomAlert` confirmation dialogs).
*   **Vault Swipes Integration**: When viewing photos inside the vault, swiping left/right is restricted strictly to other locked vault items.

### 4. ⚙️ Settings
A clean, centralized control center for user options:
*   **Display Preferences**: Toggle video visibility inside the main timeline and choose between Light, Dark, or System Auto themes.
*   **Folder Exclusions**: Easily exclude specific directories (e.g., *Downloads* or *WhatsApp Images*) from showing up in the timeline or albums.
*   **Safety & Deletion**: 
    *   Toggle between **Permanent Delete** and **Recycle Bin**.
    *   **Tactile Stepper Counter**: Customize Recycle Bin retention days (from 1 to 90 days) using a precise decrement/increment stepper capsule instead of a buggy slider.
    *   Link to **Recycle Bin**: Displays dynamic item counts, routing to the bin.
    *   Link to **Private Vault**: Set up passcodes and access private vault assets.

### 5. 🗑️ Recycle Bin (`/recycle`)
An aggregated space for recently deleted assets.
*   **Perfect Centered Header**: Implements a centered header layout mapping back button, bin auto-deletion status, and Empty/All action targets correctly.
*   **Countdown Badges**: Every grid cell renders a countdown badge on the top-left indicating remaining days before auto-purge (e.g. `24d left`).
*   **Selection & Single Action Manager**: Tap an item to trigger a CustomAlert prompting to Restore or Delete Permanently. Long-press to select multiple items for batch restores or purges.

---

## ⚡ Performance & Reliability Optimizations

Foco Gallery is built to look, feel, and run like a native device application:

*   **🚀 Instant Startup Sync**: Syncs the first 60 assets immediately for interactive visual rendering, continuing the remainder of library loading in incremental background batches of 100 items (separated by 50ms gaps) to prevent UI frame drops.
*   **🏃 Fast-Scrolling**: Custom right-side fast-scrollbar track immediately scrolls the `FlatList` to corresponding offsets, glowing mint-teal when active and fading to a low-contrast opacity when idle.
*   **⚡ Paged Viewer Carousel**: Uses horizontal `FlatList` with `pagingEnabled` for smooth, native-feeling gestures. Mounts and plays video elements only on the active slide, releasing player resources instantly on swipe.
*   **🛡️ Platform Immunity**: Solves simulator/web crashes by dynamically importing `expo-media-library` at runtime. Wraps filesystem deletions in strict safety checks so loading indicators dismiss properly even on filesystem failure.

---

## 🛠️ Technical Stack
*   **Core**: Expo SDK 56 + React Native + TypeScript
*   **File Routing**: `expo-router` (file-based navigation)
*   **Media Access**: Dynamic runtime imports of `expo-media-library`
*   **Fast Caching**: `expo-image` for high-performance memory and disk caching of media thumbnails
*   **Video Playback**: `expo-video` for native full-screen video rendering
*   **Shared Actions**: `expo-sharing` and `expo-image-picker`
*   **Gestures & Animation**: `react-native-gesture-handler` + `react-native-reanimated`
*   **State Management**: `Zustand` with AsyncStorage persistence for settings, custom albums, recycle bin, and private vault

---

## 📂 Project Directory Structure

```
foco-gallery/
├── app/                      # Expo Router Navigation Pages
│   ├── _layout.tsx           # Root navigation layout (Provider initializations)
│   ├── (tabs)/               # Bottom Tabs
│   │   ├── _layout.tsx       # Bottom tabs custom bar configuration
│   │   ├── index.tsx         # Timeline Tab (Search, Camera, and Day-Grouped Grid)
│   │   ├── albums.tsx        # Albums List Tab
│   │   └── settings.tsx      # Settings Tab (Display, Hidden Folders, Stepper, Vault)
│   ├── album/
│   │   ├── [id].tsx          # Album detailed grid
│   │   └── new.tsx           # Create custom album flow
│   ├── viewer/
│   │   └── [id].tsx          # Full-screen gesture media viewer (Swipes and Swipedown)
│   ├── recycle.tsx           # Recycle Bin screen (Centered header + Countdown badges)
│   └── vault.tsx             # Secure Private Vault screen (Keypad + Private items grid)
├── src/
│   ├── components/           # Reusable UI elements
│   │   ├── CustomAlert.tsx   # Premium dialog modal (charcoal cards, mint-teal buttons)
│   │   ├── PhotoGrid.tsx     # Grouped photos grid with custom fast-scrollbar handle
│   │   ├── DaySection.tsx    # Section for individual day items
│   │   ├── MediaThumb.tsx    # Grid thumbnail with high-visibility video duration overlay
│   │   ├── SelectionBar.tsx  # Redesigned floating capsule bottom action bar
│   │   ├── Screen.tsx        # Base screen wrapper
│   │   ├── ScreenHeader.tsx  # Header layout
│   │   └── ThemeProvider.tsx # High-contrast pitch-black theme definitions
│   ├── services/             # Core media services (Dynamic expo-media-library integration)
│   ├── store/                # Zustand stores
│   │   ├── settings.ts       # Exclusions, display, and retention state
│   │   ├── recycleBin.ts     # Recycled items store
│   │   ├── customAlbums.ts   # User albums store
│   │   └── vault.ts          # Persisted private IDs and passcode
│   ├── hooks/                # Performance wrappers
│   │   ├── useMediaLibrary.ts# Library items resolution with active private exclusions
│   │   └── useSelection.ts   # Shared selection state hook
│   ├── theme/                # Global styling color definitions (spacing, radii)
│   ├── utils/                # Date grouping, search queries, and layout math
│   └── types.ts              # Global TypeScript models
```

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
