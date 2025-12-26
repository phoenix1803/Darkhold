

<div align="center">
  <img src="./Darkhold/assets/darkhold_logo.png" alt="Darkhold Logo" width="200" height="200">

</div>

# Darkhold - Marvel AI Chat Assistant
🔮 Your Mystical Guide Through the Marvel Multiverse 🔮


## About Darkhold

Darkhold is a mystical Marvel AI chat assistant built with React Native that brings the entire Marvel universe to your fingertips. Ask about heroes, villains, movies, comics, and cosmic secrets - all with the dark, mystical aesthetic inspired by the ancient Darkhold tome.

### Key Features

- **Character Information**: Get detailed info about Marvel characters with images
- **MCU Knowledge**: Ask about movies, upcoming releases, and storylines
- **Comic Lore**: Explore comic series, writers, and storylines
- **AI-Powered Chat**: Powered by Google Gemini AI for natural conversations
- **Dark Theme**: Beautiful mystical UI matching the Darkhold aesthetic
- **Chat History**: Persistent conversation storage
- **Emoji Reactions**: React to messages with Marvel-themed emojis
- **Smooth Animations**: Polished user experience with animated messages


## Tech Stack

- **Framework**: React Native
- **Language**: JavaScript
- **UI Library**: React Native Paper
- **State Management**: React Hooks (useState, useEffect)
- **Local Storage**: AsyncStorage
- **HTTP Client**: Axios
- **APIs**:
    - Marvel REST API
    - Google Gemini AI
- **Search**: Fuse.js for fuzzy character matching
- **Animation**: React Native Animated API
- **Crypto**: md5 for Marvel API authentication
- **Build Tools**: React Native CLI, Gradle


## Download

[**Download Darkhold APK**](./released_version_darkhold.apk)

*Latest version with all features and optimizations*

## Installation \& Setup

### Prerequisites

- Node.js (14.0 or later)
- React Native CLI
- Android Studio
- Java Development Kit (JDK 11)


### Clone \& Install

```bash
# Clone the repository
git clone https://github.com/phoenix1803/Darkhold.git
cd Darkhold

# Navigate to app directory
cd Code

# Install dependencies
npm install

# For iOS (if needed)
cd ios && pod install && cd ..
```


### Environment Setup

1. Create a `.env` file in the `darkhold` directory:
```env
REACT_APP_MARVEL_PUBLIC_KEY=your_marvel_public_key
REACT_APP_MARVEL_PRIVATE_KEY=your_marvel_private_key
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

2. Get your API keys:
    - **Marvel API**: [Register at Marvel Developer Portal](https://developer.marvel.com/)
    - **Gemini AI**: [Get API key from Google AI Studio](https://makersuite.google.com/app/apikey)

### Run the App

```bash
# Start Metro bundler
npx react-native start

# Run on Android
npx react-native run-android

# Run on iOS (Mac only)
npx react-native run-ios
```

## API Keys / Configuration (App.js)

In addition to the `.env` variables above, the application expects some API keys or service configuration to be referenced in the app's entry file (commonly `App.js`, `App.tsx`, or `index.js` depending on your setup).

Recommended approaches:

- Preferred (secure): use environment variables and a config loader such as `react-native-config` to read secrets at runtime. Example `.env` (do not commit):

```env
GEMINI_API_KEY=ya29...yourkey...
MARVEL_PUBLIC_KEY=your_marvel_public_key
MARVEL_PRIVATE_KEY=your_marvel_private_key
```

Then in `App.js`:

```js
import Config from 'react-native-config';
const GEMINI_API_KEY = Config.GEMINI_API_KEY;

// Use the keys where needed, e.g. initialize clients
```

- Quick/dev (not for production): you can place placeholders in `App.js` while developing, but do not commit real keys:

## Build APK

### Debug APK

```bash
npx react-native run-android --variant=release
```


### Production APK

```bash
# Bundle JavaScript
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

# Build signed APK
cd android
./gradlew assembleRelease

# Find APK at: android/app/build/outputs/apk/release/app-release.apk
```


## Usage

1. **Start Chatting**: Open the app and you'll be greeted by the mystical Darkhold
2. **Ask Questions**: Type questions about Marvel characters, movies, or comics
3. **Character Search**: Mention character names for detailed information with images
4. **React to Messages**: Tap emoji reactions on bot responses
5. **Clear History**: Use the clear button to reset your conversation

### Example Queries

- "Tell me about Iron Man"
- "What are the upcoming Marvel movies?"
- "Explain the Infinity Saga"
- "Who is the strongest Avenger?"
- "What comics should I read?"


## Project Structure

```
darkhold-marvel-chat/
├── darkhold/                  # Main app directory
│   ├── assets/               # Images and resources
│   │   └── darkhold_logo.png # App logo
│   ├── App.js               # Main application file
│   ├── package.json         # Dependencies
│   └── android/             # Android build files
└── released_version_darkhold.apk  # Ready-to-install APK
```


## Features in Detail

### Character Recognition

Uses Fuse.js fuzzy matching to recognize character names and aliases:

- "Iron Man" or "Tony Stark" → Character info with image
- "Cap" or "Steve Rogers" → Captain America details
- "Web slinger" → Spider-Man information


### AI Conversations

Powered by Google Gemini AI with Marvel-specific context:

- Maintains conversation history
- Mystical Darkhold personality
- Marvel-focused responses
- Streaming text effect


### Dark Theme

Custom theme inspired by the mystical Darkhold:

- Rich brown and gold color palette
- Smooth shadows and elevations
- Mystical avatar icons
- Animated message bubbles

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
