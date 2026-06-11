# ctrl-a Xcode MCP

A comprehensive Model Context Protocol (MCP) server and CLI for Xcode/iOS development automation. Build, test, and manage Apple platforms from the command line or AI agents.

![Xcode](https://img.shields.io/badge/Xcode-16.2-blue) ![macOS](https://img.shields.io/badge/macOS-Required-green) ![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)

## Features

### Simulator Management
- List, boot, shutdown, erase simulators
- Create, clone, rename, delete devices
- Manage device runtimes

### App Management
- Install/uninstall apps on simulators
- Launch, terminate, get app info
- Manage app containers

### Build & Test
- Build projects and workspaces
- Run tests with detailed output
- Static code analysis
- Archive for distribution

### Code Signing
- List available certificates
- Code sign binaries
- Verify signatures

### Project Analysis
- Find Xcode projects in directories
- Show schemes and build settings
- List available destinations

### File Tools
- Read/write plist files
- Extract strings from bundles

## Installation

```bash
git clone https://github.com/yourusername/xcode-mcp.git
cd xcode-mcp
npm install
```

## CLI Usage

```bash
# Show all commands
node cli.js

# Xcode info
node cli.js xcode-version
node cli.js list-sdks
node cli.js list-schemes --project MyApp.xcodeproj

# Simulators
node cli.js list-simulators
node cli.js boot-simulator "iPhone 17 Pro"
node cli.js launch-app booted com.example.myapp

# Build
node cli.js build --project MyApp.xcodeproj --scheme MyApp \
  --destination "platform=iOS Simulator,name=iPhone 17 Pro"
```

## Available Commands

| Category | Command | Description |
|----------|---------|-------------|
| **Info** | `xcode-version` | Get Xcode version |
| | `list-sdks` | List available SDKs |
| | `list-schemes` | List project schemes |
| **Simulator** | `list-simulators` | List iOS simulators |
| | `boot-simulator` | Boot a simulator |
| | `shutdown-simulator` | Shutdown simulator |
| | `erase-simulator` | Erase simulator data |
| | `create-simulator` | Create new device |
| **Apps** | `install-app` | Install .app |
| | `uninstall-app` | Remove app |
| | `launch-app` | Launch app |
| | `terminate-app` | Force quit app |
| **Build** | `build` | Build project |
| | `test` | Run tests |
| | `analyze` | Static analysis |
| | `archive` | Create archive |
| **Signing** | `list-certificates` | Code signing certs |
| | `codesign` | Sign binary |
| | `verify-codesign` | Verify signature |

## Options

Common options for build/test commands:

```bash
--project, -p      Path to .xcodeproj
--workspace, -w   Path to .xcworkspace
--scheme, -s      Scheme name
--destination, -d Destination (e.g., "platform=iOS Simulator,name=iPhone 17 Pro")
--configuration, -cfg  Debug or Release
--sdk             SDK (e.g., iphoneos26.2, iphonesimulator26.2)
```

## Examples

### Build for Simulator
```bash
node cli.js build \
  --project MyApp.xcodeproj \
  --scheme MyApp \
  --destination "platform=iOS Simulator,name=iPhone 17 Pro" \
  --configuration Debug
```

### Run Tests
```bash
node cli.js test \
  --project MyApp.xcodeproj \
  --scheme MyAppTests \
  --destination "platform=iOS Simulator,name=iPhone 17 Pro"
```

### Install and Launch App
```bash
# Install
node cli.js install-app booted ./build/Debug-iphonesimulator/MyApp.app

# Launch
node cli.js launch-app booted com.example.myapp

# Check status
node cli.js list-apps booted
```

### Find Projects
```bash
node cli.js find-projects ~/Projects
```

## MCP Server

This tool can also run as an MCP server for AI agents:

```bash
# Start MCP server
node index.js

# Tools are exposed via JSON-RPC
```

## Requirements

- macOS with Xcode 15+
- Node.js 18+
- Xcode Command Line Tools

## License

MIT

## Contributing

Pull requests welcome! Especially for:
- Additional xcodebuild options
- More simulator features
- Better error handling
- Additional platform support (tvOS, watchOS)
