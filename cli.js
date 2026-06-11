#!/usr/bin/env node

import { execSync, exec } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const COMMANDS = {
  // === XCODE INFO ===
  'xcode-version': { desc: 'Get Xcode version and build info', group: 'Info' },
  'list-sdks': { desc: 'List available SDKs', group: 'Info' },
  'list-schemes': { desc: 'List schemes in a project/workspace', group: 'Info' },
  'show-build-settings': { desc: 'Show build settings for a project', group: 'Info' },
  'show-destinations': { desc: 'Show available destinations', group: 'Info' },

  // === SIMULATOR MANAGEMENT ===
  'list-simulators': { desc: 'List available iOS simulators', group: 'Simulator' },
  'list-devices': { desc: 'List all devices (sim + physical)', group: 'Simulator' },
  'list-runtimes': { desc: 'List available simulator runtimes', group: 'Simulator' },
  'boot-simulator': { desc: 'Boot a simulator', group: 'Simulator' },
  'shutdown-simulator': { desc: 'Shutdown a simulator', group: 'Simulator' },
  'erase-simulator': { desc: 'Erase simulator contents and settings', group: 'Simulator' },
  'delete-simulator': { desc: 'Delete a simulator', group: 'Simulator' },
  'create-simulator': { desc: 'Create a new simulator', group: 'Simulator' },
  'clone-simulator': { desc: 'Clone an existing simulator', group: 'Simulator' },
  'rename-simulator': { desc: 'Rename a simulator', group: 'Simulator' },
  'simulator-status': { desc: 'Get simulator status (booted/shutdown)', group: 'Simulator' },

  // === APP MANAGEMENT ===
  'list-apps': { desc: 'List installed apps on a simulator', group: 'Apps' },
  'install-app': { desc: 'Install .app on simulator', group: 'Apps' },
  'uninstall-app': { desc: 'Uninstall app from simulator', group: 'Apps' },
  'launch-app': { desc: 'Launch an app on simulator', group: 'Apps' },
  'terminate-app': { desc: 'Terminate an app on simulator', group: 'Apps' },
  'get-app-container': { desc: 'Get app container path', group: 'Apps' },
  'app-info': { desc: 'Get info about installed app', group: 'Apps' },

  // === SIMULATOR FEATURES ===
  'open-url': { desc: 'Open URL in simulator', group: 'Simulator Features' },
  'send-push': { desc: 'Send push notification to simulator', group: 'Simulator Features' },
  'set-location': { desc: 'Set simulated location', group: 'Simulator Features' },
  'add-media': { desc: 'Add photos/videos to simulator', group: 'Simulator Features' },
  'privacy-permissions': { desc: 'Manage privacy permissions', group: 'Simulator Features' },
  'spawn-process': { desc: 'Spawn process in simulator', group: 'Simulator Features' },

  // === BUILD ===
  'build': { desc: 'Build a project', group: 'Build' },
  'test': { desc: 'Run tests', group: 'Build' },
  'analyze': { desc: 'Run static analysis', group: 'Build' },
  'archive': { desc: 'Archive a project', group: 'Build' },
  'clean': { desc: 'Clean build folder', group: 'Build' },

  // === PROJECT ANALYSIS ===
  'find-projects': { desc: 'Find Xcode projects in directory', group: 'Analysis' },
  'analyze-flow': { desc: 'Run control flow analysis', group: 'Analysis' },
  'versions': { desc: 'List versions in project', group: 'Analysis' },

  // === CODE SIGNING ===
  'list-keychains': { desc: 'List available keychains', group: 'Code Signing' },
  'list-certificates': { desc: 'List code signing certificates', group: 'Code Signing' },
  'codesign': { desc: 'Code sign a binary', group: 'Code Signing' },
  'verify-codesign': { desc: 'Verify code signature', group: 'Code Signing' },

  // === EXPORT ===
  'export-archive': { desc: 'Export archived project', group: 'Export' },
  'export-app': { desc: 'Export app for distribution', group: 'Export' },

  // === PACKAGES ===
  'resolve-packages': { desc: 'Resolve Swift Package Manager dependencies', group: 'Packages' },
  'list-packages': { desc: 'List package dependencies', group: 'Packages' },

  // === FILE TOOLS ===
  'read-plist': { desc: 'Read a .plist file', group: 'File Tools' },
  'write-plist': { desc: 'Write a .plist file', group: 'File Tools' },
  'extract-strings': { desc: 'Extract .strings from bundle', group: 'File Tools' },
};

function run(cmd, options = {}) {
  try {
    return { success: true, output: execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...options }).trim() };
  } catch (e) {
    return { success: false, error: e.message, output: e.stdout?.trim() || '' };
  }
}

function parseArgs(args) {
  const result = { _: [] };
  let i = 0;
  while (i < args.length) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      result[key] = value;
      i += value === true ? 1 : 2;
    } else if (args[i].startsWith('-')) {
      result[args[i].slice(1)] = args[i + 1] && !args[i + 1].startsWith('-') ? args[i + 1] : true;
      i += result[args[i]] === true ? 1 : 2;
    } else {
      result._ = result._ || [];
      result._.push(args[i]);
      i++;
    }
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._ && args._[0];

function printHelp() {
  console.log('\nXcode MCP Server - Command Line Interface\n');
  console.log('Usage: cli.js <command> [options]\n');
  
  const groups = {};
  Object.entries(COMMANDS).forEach(([name, info]) => {
    groups[info.group] = groups[info.group] || [];
    groups[info.group].push({ name, desc: info.desc });
  });
  
  Object.entries(groups).forEach(([group, cmds]) => {
    console.log(`\n${group}:`);
    cmds.forEach(({ name, desc }) => {
      console.log(`  ${name.padEnd(25)} ${desc}`);
    });
  });
  
  console.log('\nExamples:');
  console.log('  cli.js list-simulators');
  console.log('  cli.js build MyApp.xcodeproj -scheme MyApp -destination "platform=iOS Simulator,name=iPhone 17 Pro"');
  console.log('  cli.js boot-simulator "iPhone 17 Pro"');
  console.log('  cli.js launch-app booted com.example.myapp');
  console.log('  cli.js find-projects ~/Projects');
}

if (!cmd) {
  printHelp();
  process.exit(0);
}

const project = args.project || args.p;
const scheme = args.scheme || args.s;
const destination = args.destination || args.d || 'generic/platform=iOS Simulator';
const config = args.configuration || args.cfg || 'Debug';
const sdk = args.sdk || null;

// Execute command
let result;

switch (cmd) {
  // === XCODE INFO ===
  case 'xcode-version':
    result = run('xcodebuild -version');
    break;
    
  case 'list-sdks':
    result = run('xcodebuild -showsdks');
    break;
    
  case 'list-schemes':
    if (!project) { console.error('Error: --project required'); process.exit(1); }
    result = run(`xcodebuild -project "${project}" -list`);
    break;
    
  case 'show-build-settings':
    if (!project) { console.error('Error: --project required'); process.exit(1); }
    let cmd2 = `xcodebuild -project "${project}" -showBuildSettings`;
    if (scheme) cmd2 += ` -scheme "${scheme}"`;
    result = run(cmd2);
    break;
    
  case 'show-destinations':
    if (!project && !args.workspace) { console.error('Error: --project or --workspace required'); process.exit(1); }
    let cmd3 = project ? `xcodebuild -project "${project}" -showdestinations` : `xcodebuild -workspace "${args.workspace}" -showdestinations`;
    result = run(cmd3);
    break;

  // === SIMULATOR ===
  case 'list-simulators':
    result = run(`xcrun simctl list devices ${args.platform || 'ios'}`);
    break;
    
  case 'list-devices':
    result = run('xcrun simctl list devices all');
    break;
    
  case 'list-runtimes':
    result = run('xcrun simctl list runtimes');
    break;
    
  case 'boot-simulator': {
    const device = args._[1] || args.device || args.id;
    if (!device) { console.error('Error: device name or ID required'); process.exit(1); }
    result = run(`xcrun simctl boot "${device}"`);
    result.output = result.success ? `Booted: ${device}` : result.output;
    break;
  }
  
  case 'shutdown-simulator': {
    const device = args._[1] || args.device || 'booted';
    result = run(`xcrun simctl shutdown "${device}"`);
    result.output = result.success ? `Shutdown: ${device}` : result.output;
    break;
  }
  
  case 'erase-simulator': {
    const device = args._[1] || args.device;
    if (!device) { console.error('Error: device name or ID required'); process.exit(1); }
    result = run(`xcrun simctl erase "${device}"`);
    result.output = result.success ? `Erased: ${device}` : result.output;
    break;
  }
  
  case 'delete-simulator': {
    const device = args._[1] || args.device;
    if (!device) { console.error('Error: device name or ID required'); process.exit(1); }
    result = run(`xcrun simctl delete "${device}"`);
    result.output = result.success ? `Deleted: ${device}` : result.output;
    break;
  }
  
  case 'create-simulator': {
    const name = args.name || args._[1];
    const devicetype = args['device-type'] || 'com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro';
    const runtime = args.runtime || 'com.apple.CoreSimulator.SimRuntime.iOS-26-2';
    if (!name) { console.error('Error: --name required'); process.exit(1); }
    result = run(`xcrun simctl create "${name}" "${devicetype}" "${runtime}"`);
    break;
  }
  
  case 'clone-simulator': {
    const source = args._[1] || args.source;
    const name = args.name || args._[2] || 'Cloned Device';
    if (!source) { console.error('Error: --source required'); process.exit(1); }
    result = run(`xcrun simctl clone "${source}" "${name}"`);
    break;
  }
  
  case 'rename-simulator': {
    const device = args._[1] || args.device;
    const name = args.name || args._[2];
    if (!device || !name) { console.error('Error: --device and --name required'); process.exit(1); }
    result = run(`xcrun simctl rename "${device}" "${name}"`);
    break;
  }
  
  case 'simulator-status': {
    const device = args._[1] || args.device || 'booted';
    result = run(`xcrun simctl list devices ${device}`);
    break;
  }

  // === APP MANAGEMENT ===
  case 'list-apps': {
    const device = args._[1] || args.device || 'booted';
    result = run(`xcrun simctl listapps "${device}"`);
    break;
  }
  
  case 'install-app': {
    const device = args._[1] || args.device || 'booted';
    const path = args._[2] || args.path;
    if (!path) { console.error('Error: --path to .app required'); process.exit(1); }
    result = run(`xcrun simctl install "${device}" "${path}"`);
    result.output = result.success ? `Installed: ${path}` : result.output;
    break;
  }
  
  case 'uninstall-app': {
    const device = args._[1] || args.device || 'booted';
    const bundleId = args._[2] || args.bundleId || args.bundle;
    if (!bundleId) { console.error('Error: --bundleId required'); process.exit(1); }
    result = run(`xcrun simctl uninstall "${device}" "${bundleId}"`);
    result.output = result.success ? `Uninstalled: ${bundleId}` : result.output;
    break;
  }
  
  case 'launch-app': {
    const device = args._[1] || args.device || 'booted';
    const bundleId = args._[2] || args.bundleId || args.bundle;
    if (!bundleId) { console.error('Error: --bundleId required'); process.exit(1); }
    result = run(`xcrun simctl launch "${device}" "${bundleId}"`);
    break;
  }
  
  case 'terminate-app': {
    const device = args._[1] || args.device || 'booted';
    const bundleId = args._[2] || args.bundleId || args.bundle;
    if (!bundleId) { console.error('Error: --bundleId required'); process.exit(1); }
    result = run(`xcrun simctl terminate "${device}" "${bundleId}"`);
    result.output = result.success ? `Terminated: ${bundleId}` : result.output;
    break;
  }
  
  case 'get-app-container': {
    const device = args._[1] || args.device || 'booted';
    const bundleId = args._[2] || args.bundleId || args.bundle;
    if (!bundleId) { console.error('Error: --bundleId required'); process.exit(1); }
    result = run(`xcrun simctl get_app_container "${device}" "${bundleId}"`);
    break;
  }
  
  case 'app-info': {
    const device = args._[1] || args.device || 'booted';
    const bundleId = args._[2] || args.bundleId || args.bundle;
    if (!bundleId) { console.error('Error: --bundleId required'); process.exit(1); }
    result = run(`xcrun simctl appinfo "${device}" "${bundleId}"`);
    break;
  }

  // === SIMULATOR FEATURES ===
  case 'open-url': {
    const device = args._[1] || args.device || 'booted';
    const url = args._[2] || args.url;
    if (!url) { console.error('Error: --url required'); process.exit(1); }
    result = run(`xcrun simctl openurl "${device}" "${url}"`);
    result.output = result.success ? `Opened: ${url}` : result.output;
    break;
  }
  
  case 'send-push': {
    const device = args._[1] || args.device || 'booted';
    const bundleId = args._[2] || args.bundleId;
    const payload = args._[3] || args.payload || '{}';
    if (!bundleId) { console.error('Error: --bundleId required'); process.exit(1); }
    result = run(`xcrun simctl push "${device}" "${bundleId}" -c content-available=1`);
    break;
  }
  
  case 'set-location': {
    const device = args._[1] || args.device || 'booted';
    const lat = args._[2] || args.lat || args.latitude;
    const lon = args._[3] || args.lon || args.longitude;
    if (!lat || !lon) { console.error('Error: --lat and --lon required'); process.exit(1); }
    result = run(`xcrun simctl location "${device}" set "${lat},${lon}"`);
    break;
  }
  
  case 'add-media': {
    const device = args._[1] || args.device || 'booted';
    const path = args._[2] || args.path;
    if (!path) { console.error('Error: --path to media file required'); process.exit(1); }
    result = run(`xcrun simctl addmedia "${device}" "${path}"`);
    break;
  }
  
  case 'privacy-permissions': {
    const device = args._[1] || args.device || 'booted';
    const action = args._[2] || args.action || 'reset';
    const permission = args._[3] || args.permission;
    if (!permission) { console.error('Error: --permission (e.g., camera, microphone) required'); process.exit(1); }
    result = run(`xcrun simctl privacy "${device}" ${action} "${permission}"`);
    break;
  }
  
  case 'spawn-process': {
    const device = args._[1] || args.device || 'booted';
    const path = args._[2] || args.path;
    const args2 = args._[3] || '';
    if (!path) { console.error('Error: --path to executable required'); process.exit(1); }
    result = run(`xcrun simctl spawn "${device}" "${path}" ${args2}`);
    break;
  }

  // === BUILD ===
  case 'build': {
    if (!project && !args.workspace) { console.error('Error: --project or --workspace required'); process.exit(1); }
    let buildCmd = project 
      ? `xcodebuild -project "${project}" -configuration "${config}"`
      : `xcodebuild -workspace "${args.workspace}" -configuration "${config}"`;
    if (scheme) buildCmd += ` -scheme "${scheme}"`;
    if (destination) buildCmd += ` -destination "${destination}"`;
    if (sdk) buildCmd += ` -sdk "${sdk}"`;
    buildCmd += ' build';
    result = run(buildCmd, { maxBuffer: 50 * 1024 * 1024 });
    result.output = result.output.includes('BUILD SUCCEEDED') ? '✅ BUILD SUCCEEDED' : 
                   result.output.includes('BUILD FAILED') ? '❌ BUILD FAILED' : 
                   result.output.slice(-2000);
    break;
  }
  
  case 'test': {
    if (!project && !args.workspace) { console.error('Error: --project or --workspace required'); process.exit(1); }
    let testCmd = project 
      ? `xcodebuild -project "${project}" -configuration "${config}"`
      : `xcodebuild -workspace "${args.workspace}" -configuration "${config}"`;
    if (scheme) testCmd += ` -scheme "${scheme}"`;
    if (destination) testCmd += ` -destination "${destination}"`;
    testCmd += ' test';
    result = run(testCmd, { maxBuffer: 50 * 1024 * 1024 });
    result.output = result.output.slice(-3000);
    break;
  }
  
  case 'analyze': {
    if (!project && !args.workspace) { console.error('Error: --project or --workspace required'); process.exit(1); }
    let analyzeCmd = project 
      ? `xcodebuild -project "${project}"`
      : `xcodebuild -workspace "${args.workspace}"`;
    if (scheme) analyzeCmd += ` -scheme "${scheme}"`;
    if (destination) analyzeCmd += ` -destination "${destination}"`;
    analyzeCmd += ' analyze';
    result = run(analyzeCmd, { maxBuffer: 50 * 1024 * 1024 });
    break;
  }
  
  case 'archive': {
    if (!project && !args.workspace) { console.error('Error: --project or --workspace required'); process.exit(1); }
    let archiveCmd = project 
      ? `xcodebuild -project "${project}" -scheme "${scheme}"`
      : `xcodebuild -workspace "${args.workspace}" -scheme "${scheme}"`;
    archiveCmd += ' -archivePath ./MyApp.xcarchive archive';
    result = run(archiveCmd);
    break;
  }
  
  case 'clean': {
    if (!project && !args.workspace) { console.error('Error: --project or --workspace required'); process.exit(1); }
    let cleanCmd = project 
      ? `xcodebuild -project "${project}" clean`
      : `xcodebuild -workspace "${args.workspace}" clean`;
    if (scheme) cleanCmd += ` -scheme "${scheme}"`;
    result = run(cleanCmd);
    break;
  }

  // === PROJECT ANALYSIS ===
  case 'find-projects': {
    const dir = args._[1] || args.path || args._[0] || '.';
    const projects = [];
    function scan(dir) {
      try {
        const files = readdirSync(dir);
        for (const file of files) {
          const fullPath = join(dir, file);
          try {
            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
              if (file.endsWith('.xcodeproj') || file.endsWith('.xcworkspace')) {
                projects.push(fullPath);
              } else if (!file.startsWith('.') && !file.includes('node_modules')) {
                scan(fullPath);
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    }
    scan(dir);
    result = { success: true, output: projects.length ? projects.join('\n') : 'No projects found' };
    break;
  }
  
  case 'analyze-flow':
    if (!project) { console.error('Error: --project required'); process.exit(1); }
    result = run(`xcodebuild -project "${project}" -scheme "${scheme}" analyze 2>&1 | tail -50`);
    break;
    
  case 'versions':
    if (!project) { console.error('Error: --project required'); process.exit(1); }
    result = run(`xcodebuild -project "${project}" -showBuildSettings | grep -i version`);
    break;

  // === CODE SIGNING ===
  case 'list-keychains':
    result = run('security list-keychains');
    break;
    
  case 'list-certificates':
    result = run('security find-identity -v -p codesigning');
    break;
    
  case 'codesign': {
    const path = args._[1] || args.path;
    const identity = args._[2] || args.identity || args.i || '-';
    if (!path) { console.error('Error: --path required'); process.exit(1); }
    result = run(`codesign -s "${identity}" "${path}"`);
    break;
  }
  
  case 'verify-codesign': {
    const path = args._[1] || args.path;
    if (!path) { console.error('Error: --path required'); process.exit(1); }
    result = run(`codesign -dv "${path}" 2>&1`);
    break;
  }

  // === EXPORT ===
  case 'export-archive': {
    const archive = args._[1] || args.archive;
    const path = args._[2] || args.path || './export';
    if (!archive) { console.error('Error: --archive required'); process.exit(1); }
    result = run(`xcodebuild -exportArchive -archivePath "${archive}" -exportPath "${path}" -exportOptionsPlist /dev/null`);
    break;
  }
  
  case 'export-app': {
    const archive = args._[1] || args.archive;
    const path = args._[2] || args.path || './export';
    if (!archive) { console.error('Error: --archive required'); process.exit(1); }
    result = run(`xcodebuild -exportNotarizedApp -archivePath "${archive}" -exportPath "${path}"`);
    break;
  }

  // === PACKAGES ===
  case 'resolve-packages': {
    if (!project && !args.workspace) { console.error('Error: --project or --workspace required'); process.exit(1); }
    let pkgCmd = project 
      ? `xcodebuild -project "${project}" -resolvePackageDependencies`
      : `xcodebuild -workspace "${args.workspace}" -resolvePackageDependencies`;
    result = run(pkgCmd);
    break;
  }
  
  case 'list-packages': {
    if (!project && !args.workspace) { console.error('Error: --project or --workspace required'); process.exit(1); }
    let listCmd = project 
      ? `xcodebuild -project "${project}" -showBuildSettings`
      : `xcodebuild -workspace "${args.workspace}" -showBuildSettings`;
    result = run(listCmd + ' | grep -i package');
    break;
  }

  // === FILE TOOLS ===
  case 'read-plist': {
    const path = args._[1] || args.path;
    if (!path) { console.error('Error: --path required'); process.exit(1); }
    if (!existsSync(path)) { console.error('Error: File not found'); process.exit(1); }
    result = run(`plutil -p "${path}"`);
    break;
  }
  
  case 'write-plist': {
    const path = args._[1] || args.path;
    const key = args._[2] || args.key;
    const value = args._[3] || args.value;
    if (!path || !key || !value) { console.error('Error: --path, --key, and --value required'); process.exit(1); }
    result = run(`plutil -insert "${key}" -string "${value}" "${path}"`);
    break;
  }
  
  case 'extract-strings': {
    const path = args._[1] || args.path;
    if (!path) { console.error('Error: --path to .app or .framework required'); process.exit(1); }
    result = run(`find "${path}" -name "*.strings" -exec cat {} \\;`);
    break;
  }

  default:
    console.log(`Unknown command: ${cmd}\n`);
    printHelp();
    process.exit(1);
}

// Output
if (result) {
  if (result.success) {
    console.log(result.output);
  } else {
    console.error('Error:', result.error);
    if (result.output) console.log(result.output);
    process.exit(1);
  }
}
