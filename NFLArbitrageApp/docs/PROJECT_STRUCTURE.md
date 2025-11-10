# Project Structure

Complete directory structure of the NFL Arbitrage App.

```
NFLArbitrageApp/
│
├── 📱 src/                          # Source code
│   ├── screens/                     # React Native screens
│   │   ├── MainScreen.tsx          # Home - Arbitrage detection
│   │   ├── MarketListScreen.tsx    # Market browser
│   │   └── AboutScreen.tsx         # App info
│   │
│   ├── services/                    # API services
│   │   ├── polymarketAPI.ts        # Polymarket integration
│   │   ├── kalshiAPI.ts            # Kalshi integration
│   │   └── logger.ts               # Logging utility
│   │
│   ├── utils/                       # Utility functions
│   │   ├── nflTeamMappings.ts      # Team data & matching
│   │   └── aiMatchingFallback.ts   # AI framework (optional)
│   │
│   └── types.ts                     # TypeScript interfaces
│
├── 🧪 tests/                        # Test suite (63 tests)
│   ├── README.md                   # Test documentation
│   │
│   ├── API Tests (10)
│   ├── Market Data Tests (15)
│   ├── Arbitrage Tests (15)
│   ├── Matching Tests (8)
│   ├── UI Tests (8)
│   └── Integration Tests (7)
│
├── 📚 docs/                         # Documentation
│   ├── README.md                   # Docs index
│   ├── IMPLEMENTATION-SUMMARY.md   # Implementation guide
│   ├── SPREAD_COLLAPSE_FEATURE.md  # Collapsible UI
│   ├── MATCHING_ENHANCEMENTS.md    # Fuzzy matching
│   ├── SPREAD_DISPLAY_FIX.md       # Spread parsing
│   ├── CRITICAL-FIX-SUMMARY.md     # Bug fixes
│   └── RESTART-APP-INSTRUCTIONS.md # Restart guide
│
├── 🎨 assets/                       # App assets
│   ├── icon.png                    # App icon
│   ├── splash.png                  # Splash screen
│   └── adaptive-icon.png           # Android adaptive icon
│
├── 📦 Configuration Files
│   ├── App.tsx                     # Main app entry
│   ├── App.js                      # Legacy entry (if exists)
│   ├── app.json                    # Expo configuration
│   ├── package.json                # Dependencies
│   ├── package-lock.json           # Locked dependencies
│   ├── tsconfig.json               # TypeScript config
│   ├── .gitignore                  # Git ignore rules
│   └── babel.config.js             # Babel configuration
│
├── 📖 Documentation (Root)
│   ├── README.md                   # Main project README
│   └── PROJECT_STRUCTURE.md        # This file
│
└── 🔧 Generated/Runtime
    ├── .expo/                      # Expo cache
    ├── node_modules/               # Dependencies
    └── .git/                       # Git repository
```

## 📊 Statistics

- **Total Files**: ~500+ (including node_modules)
- **Source Files**: 10 TypeScript files
- **Test Files**: 63 JavaScript files
- **Documentation**: 8 Markdown files
- **Lines of Code**: ~5,000+ (excluding dependencies)

## 🎯 Key Directories

### `/src` - Application Source
All TypeScript source code for the app.

**screens/**: User interface screens
- MainScreen: Home dashboard with arbitrage detection
- MarketListScreen: Browse and filter markets
- AboutScreen: App information

**services/**: External API integrations
- polymarketAPI: Polymarket Gamma API wrapper
- kalshiAPI: Kalshi API wrapper
- logger: Centralized logging

**utils/**: Helper functions and utilities
- nflTeamMappings: Team data and fuzzy matching
- aiMatchingFallback: Optional AI integration

**types.ts**: TypeScript type definitions for the entire app

### `/tests` - Test Suite
63 comprehensive test scripts organized by category.

See [tests/README.md](tests/README.md) for full test documentation.

### `/docs` - Documentation
Complete implementation guides and technical specs.

See [docs/README.md](docs/README.md) for documentation index.

### `/assets` - App Assets
Images and media files used by the app.

- Icon files for iOS/Android
- Splash screen
- Adaptive icons

## 🔀 Data Flow

```
User Action
    ↓
React Native Screen
    ↓
API Service (polymarketAPI or kalshiAPI)
    ↓
External API (Polymarket/Kalshi)
    ↓
Data Processing (parsing, filtering)
    ↓
Team Matching (nflTeamMappings)
    ↓
Arbitrage Detection (MainScreen)
    ↓
UI Display (MarketListScreen)
    ↓
User
```

## 📱 Screen Flow

```
App Start
    ↓
MainScreen (Home)
    ├──> MarketListScreen (Polymarket)
    ├──> MarketListScreen (Kalshi)
    └──> AboutScreen
```

## 🛠️ Tech Stack Breakdown

### Frontend (React Native)
- React Native core components
- React Navigation for routing
- Expo for development/deployment
- TypeScript for type safety

### State Management
- React Hooks (useState, useEffect)
- Local component state
- No Redux (simple app)

### Styling
- StyleSheet API
- Flexbox layout
- Platform-specific adaptations

### API Integration
- Fetch API for HTTP requests
- Async/await for asynchronous operations
- Error handling and logging

### Testing
- Plain JavaScript test runners
- Fetch for API testing
- Console-based assertions

## 📦 Dependencies

### Production
- react
- react-native
- @react-navigation/native
- @react-navigation/stack
- expo
- expo-status-bar
- expo-haptics
- expo-linear-gradient

### Development
- typescript
- @types/* packages
- expo-cli

## 🔧 Configuration Files

### app.json
Expo configuration including:
- App name and slug
- Version numbers
- Platform-specific settings
- Asset paths

### tsconfig.json
TypeScript compiler options:
- Target ES2020
- JSX preserve for React Native
- Strict type checking
- Module resolution

### package.json
Dependencies and scripts:
- start: Start Expo dev server
- android: Run on Android
- ios: Run on iOS
- web: Run in browser

## 📝 File Naming Conventions

- **TypeScript files**: `camelCase.ts` or `PascalCase.tsx`
- **Test files**: `test-kebab-case.js`
- **Documentation**: `SCREAMING-KEBAB-CASE.md`
- **Config files**: `lowercase.extension`

## 🎨 Code Organization Principles

1. **Separation of Concerns**: UI, logic, and data are separate
2. **Single Responsibility**: Each file has one clear purpose
3. **DRY**: Shared code in utilities
4. **Type Safety**: TypeScript for all source code
5. **Testability**: Comprehensive test coverage

## 🔒 Private/Ignored Files

```.gitignore
node_modules/
.expo/
.expo-shared/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
dist/
```

## 📈 Growth Path

As the app grows:
1. **Add `/components`**: Reusable UI components
2. **Add `/hooks`**: Custom React hooks
3. **Add `/contexts`**: React contexts for state
4. **Add `/constants`**: App-wide constants
5. **Add `/lib`**: Shared libraries
6. **Split `/services`**: One file per platform

---

**Last updated**: November 2025
