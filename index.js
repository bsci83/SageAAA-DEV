#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';

const TOOLS = {
  list_simulators: {
    description: 'List available iOS/macOS simulators',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', description: 'Platform: ios, tvos, watchos, or all' }
      }
    }
  },
  boot_simulator: {
    description: 'Boot a simulator by device ID or name',
    inputSchema: {
      type: 'object',
      properties: {
        device: { type: 'string', description: 'Device ID or name' }
      },
      required: ['device']
    }
  },
  shutdown_simulator: {
    description: 'Shutdown a simulator by device ID',
    inputSchema: {
      type: 'object',
      properties: {
        device: { type: 'string', description: 'Device ID' }
      },
      required: ['device']
    }
  },
  list_devices: {
    description: 'List all devices (simulators and physical)',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  list_runtimes: {
    description: 'List available iOS/tvOS runtimes',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  xcode_version: {
    description: 'Get Xcode version',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  list_projects: {
    description: 'List .xcodeproj files in a directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path to search' }
      }
    }
  },
  build_project: {
    description: 'Build an Xcode project',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Path to .xcodeproj or .xcworkspace' },
        scheme: { type: 'string', description: 'Scheme name' },
        destination: { type: 'string', description: 'Destination (e.g., simulator=iPhone 17 Pro)' },
        configuration: { type: 'string', description: 'Debug or Release' }
      },
      required: ['project']
    }
  },
  show_build_settings: {
    description: 'Show build settings for a project',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Path to .xcodeproj' },
        scheme: { type: 'string', description: 'Scheme name' }
      },
      required: ['project']
    }
  }
};

function execXcode(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn('xcodebuild', ['-version'], { shell: true });
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr || 'Command failed'));
    });
  });
}

async function handleTool(name, args) {
  switch (name) {
    case 'xcode_version': {
      const proc = spawn('xcodebuild', ['-version'], { shell: true, cwd: process.cwd() });
      return new Promise((resolve, reject) => {
        let out = '';
        proc.stdout.on('data', d => out += d);
        proc.on('close', code => resolve(out.trim()));
        proc.on('error', reject);
      });
    }
    
    case 'list_simulators': {
      const platform = args.platform || 'ios';
      const proc = spawn('xcrun', ['simctl', 'list', 'devices', platform], { shell: true });
      return new Promise((resolve, reject) => {
        let out = '';
        proc.stdout.on('data', d => out += d);
        proc.on('close', code => resolve(out.trim()));
        proc.on('error', reject);
      });
    }
    
    case 'list_devices': {
      const proc = spawn('xcrun', ['simctl', 'list', 'devices', 'all'], { shell: true });
      return new Promise((resolve, reject) => {
        let out = '';
        proc.stdout.on('data', d => out += d);
        proc.on('close', code => resolve(out.trim()));
        proc.on('error', reject);
      });
    }
    
    case 'list_runtimes': {
      const proc = spawn('xcrun', ['simctl', 'list', 'runtimes'], { shell: true });
      return new Promise((resolve, reject) => {
        let out = '';
        proc.stdout.on('data', d => out += d);
        proc.on('close', code => resolve(out.trim()));
        proc.on('error', reject);
      });
    }
    
    case 'boot_simulator': {
      const device = args.device;
      const proc = spawn('xcrun', ['simctl', 'boot', device], { shell: true });
      return new Promise((resolve, reject) => {
        let out = '';
        proc.stdout.on('data', d => out += d);
        proc.stderr.on('data', d => out += d);
        proc.on('close', code => resolve(code === 0 ? `Booted ${device}` : out));
        proc.on('error', reject);
      });
    }
    
    case 'shutdown_simulator': {
      const device = args.device;
      const proc = spawn('xcrun', ['simctl', 'shutdown', device], { shell: true });
      return new Promise((resolve, reject) => {
        let out = '';
        proc.stdout.on('data', d => out += d);
        proc.on('close', code => resolve(code === 0 ? `Shutdown ${device}` : out));
        proc.on('error', reject);
      });
    }
    
    case 'list_projects': {
      const path = args.path || '.';
      const proc = spawn('find', [path, '-name', '*.xcodeproj', '-o', '-name', '*.xcworkspace'], { shell: true });
      return new Promise((resolve, reject) => {
        let out = '';
        proc.stdout.on('data', d => out += d);
        proc.on('close', code => resolve(out.trim() || 'No projects found'));
        proc.on('error', reject);
      });
    }
    
    case 'build_project': {
      const { project, scheme, destination, configuration } = args;
      const cmd = ['xcodebuild', '-project', project];
      if (scheme) cmd.push('-scheme', scheme);
      if (destination) cmd.push('-destination', destination);
      if (configuration) cmd.push('-configuration', configuration);
      cmd.push('build');
      
      const proc = spawn(cmd[0], cmd.slice(1), { shell: true });
      return new Promise((resolve, reject) => {
        let out = '';
        proc.stdout.on('data', d => out += d);
        proc.stderr.on('data', d => out += d);
        proc.on('close', code => {
          if (code === 0) resolve('BUILD SUCCEEDED');
          else resolve(`BUILD FAILED (exit ${code}):\n${out.slice(-2000)}`);
        });
        proc.on('error', reject);
      });
    }
    
    case 'show_build_settings': {
      const { project, scheme } = args;
      const cmd = ['xcodebuild', '-project', project, '-showBuildSettings'];
      if (scheme) cmd.push('-scheme', scheme);
      
      const proc = spawn(cmd[0], cmd.slice(1), { shell: true });
      return new Promise((resolve, reject) => {
        let out = '';
        proc.stdout.on('data', d => out += d);
        proc.on('close', code => resolve(out.trim()));
        proc.on('error', reject);
      });
    }
    
    default:
      return `Unknown tool: ${name}`;
  }
}

// MCP Protocol Handler
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let buffer = '';

process.stdin.on('data', chunk => {
  buffer += chunk;
  if (buffer.includes('\n')) {
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim()) {
        try {
          const msg = JSON.parse(line);
          handleMessage(msg);
        } catch (e) {}
      }
    }
  }
});

async function handleMessage(msg) {
  const { id, method, params } = msg;
  
  if (method === 'initialize') {
    send({ id, result: { protocolVersion: '2024-11-05', capabilities: {} }});
    return;
  }
  
  if (method === 'tools/list') {
    const tools = Object.entries(TOOLS).map(([name, def]) => ({
      name,
      description: def.description,
      inputSchema: def.inputSchema
    }));
    send({ id, result: { tools }});
    return;
  }
  
  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    try {
      const result = await handleTool(name, args || {});
      send({ id, result: { content: [{ type: 'text', text: result }] }});
    } catch (e) {
      send({ id, error: { code: -32603, message: e.message }});
    }
    return;
  }
  
  if (method === 'notifications/initialized') {
    return;
  }
}

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

// Keep alive
setInterval(() => {}, 1000);
