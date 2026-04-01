# EduAid Desktop Application

A cross-platform desktop application for EduAid, built with Electron. This desktop app provides a native experience for the EduAid question generation platform.

## Features

- **Native Desktop Experience**: Full desktop integration with native menus and keyboard shortcuts
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Offline Capable**: Once built, the app can run without an internet connection (backend server still required)
- **Auto-Updates**: Built-in support for automatic updates (can be configured)
- **Security**: Secure communication between processes with context isolation

## Prerequisites

Before running the desktop app, make sure you have:

1. **Node.js** (version 16 or higher)
2. **npm** or **yarn**
3. **EduAid Web App** built and ready (in the `../eduaid_web` directory)

## Installation

1. Navigate to the desktop app directory:
   ```bash
   cd eduaid_desktop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

### Running in Development Mode

1. First, make sure the web app is ready to serve:
   ```bash
   cd ../eduaid_web
   npm install
   npm start
   ```

2. In a new terminal, start the Electron app:
   ```bash
   cd ../eduaid_desktop
   npm run dev
   ```

This will:
- Start the React development server (if not already running)
- Wait for it to be ready
- Launch the Electron app pointing to the development server

### Development Scripts

- `npm start` - Start Electron app (requires web app to be running on localhost:3000)
- `npm run dev` - Start both web app and Electron app concurrently
- `npm run start:web` - Start only the web app development server

## Building for Production

### 1. Build the Web App

First, build the React web app:
```bash
cd ../eduaid_web
npm run build
```

### 2. Build the Desktop App

Then build the Electron app:
```bash
cd ../eduaid_desktop
npm run build:electron
```

### Build for All Platforms

To build for all supported platforms:
```bash
npm run build:all
```

### Platform-Specific Builds

- **Windows**: `npm run dist -- --win`
- **macOS**: `npm run dist -- --mac`
- **Linux**: `npm run dist -- --linux`

## Distribution

Built applications will be available in the `dist/` directory:

- **Windows**: `.exe` installer and portable `.exe`
- **macOS**: `.dmg` installer and `.app` bundle
- **Linux**: `.AppImage` and `.deb` packages

## Application Structure

```
eduaid_desktop/
├── main.js          # Main Electron process
├── preload.js       # Preload script for secure communication
├── package.json     # Dependencies and build configuration
├── README.md        # This file
└── dist/           # Built applications (created after build)
```

## Features & Functionality

### Menu Bar

The app includes a native menu bar with:
- **File Menu**: New question set, quit
- **Edit Menu**: Standard editing operations
- **View Menu**: Zoom, reload, developer tools
- **Window Menu**: Window management
- **Help Menu**: About dialog and external links

### Keyboard Shortcuts

- `Ctrl/Cmd + N`: New question set
- `Ctrl/Cmd + Q`: Quit application
- `Ctrl/Cmd + R`: Reload (development only)
- `F12`: Toggle developer tools
- Standard editing shortcuts (copy, paste, etc.)

### Security Features

- Context isolation enabled
- Node integration disabled in renderer
- Secure preload script for controlled API access
- External links open in default browser
- Prevention of unauthorized navigation

## Configuration

### App Icons

The app uses icons from the web app:
- **macOS/Linux**: `../eduaid_web/public/aossie_logo.png`
- **Windows**: `../eduaid_web/public/aossie_logo64.ico`

### Build Configuration

Build settings can be modified in `package.json` under the `build` section:
- App ID and product name
- Output directories
- Platform-specific settings
- Installer configurations

## Troubleshooting

### Common Issues

1. **"Build Not Found" Error**
   - Make sure you've built the web app first: `cd ../eduaid_web && npm run build`

2. **App Won't Start in Development**
   - Ensure the web app is running on `http://localhost:3000`
   - Check that all dependencies are installed

3. **Build Fails**
   - Verify Node.js version (16+ required)
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Development Tools

- Press `F12` or use View → Toggle Developer Tools to access Chrome DevTools
- Use `Ctrl/Cmd + Shift + R` to force reload in development

## Backend Integration

The desktop app connects to the same backend as the web app. Make sure your backend server is running:

```bash
cd ../backend
python server.py
```

The app will communicate with the backend API for question generation and other services.

## Contributing

When contributing to the desktop app:

1. Follow the existing code style
2. Test on multiple platforms when possible
3. Update this README if adding new features
4. Ensure security best practices are maintained

## License

This project is licensed under the MIT License - see the main project LICENSE file for details.
