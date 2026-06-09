---
name: xcode-mcp
description: Xcode MCP Server for OpenClaw - Full Xcode/iOS development automation
---

# Xcode MCP Server

Connect OpenClaw to Xcode for iOS/macOS development. Comprehensive toolset for building, testing, and managing Apple platforms.

## What It Does

**Simulator Management** — Boot, shutdown, erase, create, clone, delete simulators  
**App Management** — Install, launch, terminate, uninstall apps  
**Build & Test** — Build projects, run tests, analyze, archive  
**Code Signing** — List certificates, code sign, verify signatures  
**Project Analysis** — Find projects, show schemes, build settings  
**File Tools** — Read/write plists, extract strings  

## Setup

```bash
cd ~/.openclaw/workspace/xcode-mcp
npm install
```

## CLI Usage

```bash
node cli.js <command> [options]
```

### Info Commands
```bash
node cli.js xcode-version              # Get Xcode version
node cli.js list-sdks                  # List available SDKs
node cli.js list-schemes --project MyApp.xcodeproj
node cli.js show-build-settings --project MyApp.xcodeproj
node cli.js show-destinations --project MyApp.xcodeproj
```

### Simulator Commands
```bash
node cli.js list-simulators           # List iOS simulators
node cli.js list-devices               # All devices
node cli.js list-runtimes              # Available runtimes
node cli.js boot-simulator "iPhone 17 Pro"
node cli.js shutdown-simulator booted
node cli.js erase-simulator "iPhone 17 Pro"
node cli.js create-simulator --name "My iPhone"
node cli.js clone-simulator --source "iPhone 17 Pro" --name "Clone"
```

### App Management
```bash
node cli.js list-apps booted
node cli.js install-app booted /path/to/MyApp.app
node cli.js uninstall-app booted com.example.myapp
node cli.js launch-app booted com.example.myapp
node cli.js terminate-app booted com.example.myapp
node cli.js get-app-container booted com.example.myapp
node cli.js app-info booted com.example.myapp
```

### Simulator Features
```bash
node cli.js open-url booted "https://apple.com"
node cli.js set-location booted 37.7749 -122.4194
node cli.js add-media booted /path/to/photo.jpg
node cli.js privacy-permissions booted camera reset
```

### Build Commands
```bash
node cli.js build --project MyApp.xcodeproj --scheme MyApp --destination "platform=iOS Simulator,name=iPhone 17 Pro"
node cli.js test --project MyApp.xcodeproj --scheme MyApp
node cli.js analyze --project MyApp.xcodeproj --scheme MyApp
node cli.js archive --project MyApp.xcodeproj --scheme MyApp
node cli.js clean --project MyApp.xcodeproj
```

### Code Signing
```bash
node cli.js list-keychains
node cli.js list-certificates
node cli.js codesign --path /path/to/app.app --identity "Apple Development: Name"
node cli.js verify-codesign --path /path/to/app.app
```

### Project Analysis
```bash
node cli.js find-projects ~/Projects
node cli.js analyze-flow --project MyApp.xcodeproj --scheme MyApp
node cli.js versions --project MyApp.xcodeproj
```

### Export & Packages
```bash
node cli.js resolve-packages --project MyApp.xcodeproj
node cli.js export-archive --archive MyApp.xcarchive --path ./export
```

### File Tools
```bash
node cli.js read-plist /path/to/Info.plist
node cli.js write-plist /path/to/Info.plist --key CFBundleVersion --value "2.0"
node cli.js extract-strings /path/to/MyApp.app
```

## Quick Reference

| Category | Commands |
|----------|----------|
| **Info** | xcode-version, list-sdks, list-schemes |
| **Simulator** | boot, shutdown, erase, create, clone, delete |
| **Apps** | install, uninstall, launch, terminate |
| **Build** | build, test, analyze, archive, clean |
| **Signing** | list-certificates, codesign, verify |
| **Files** | read-plist, write-plist, extract-strings |

## Requirements

- Xcode 15+ with command line tools
- Node.js 18+
- macOS

## Integration

This skill integrates with the mcp-client skill to expose Xcode tools to Claude Code or other MCP clients.
