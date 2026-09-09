#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║          UNIVERSAL SSH DEPLOYER  v1.0                   ║
 * ║  Deploy any project to any server over SSH              ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * USAGE:
 *   node deploy.js                        → uses deploy.config.js in CWD
 *   node deploy.js --config my.config.js  → custom config file
 *   node deploy.js --only frontend        → run named target only
 *   node deploy.js --dry-run              → simulate, no actual upload
 *   node deploy.js --help                 → show help
 *
 * CONFIG:  Create a deploy.config.js in your project root.
 *          See deploy.config.example.js for a full example.
 */

const { NodeSSH } = require('node-ssh');
const path        = require('path');
const fs          = require('fs');
const { execSync } = require('child_process');

// ─────────────────────────────────────────────────────────────
// CLI args
// ─────────────────────────────────────────────────────────────
const argv      = process.argv.slice(2);
const dryRun    = argv.includes('--dry-run');
const showHelp  = argv.includes('--help') || argv.includes('-h');
const cfgFlag   = argv.indexOf('--config');
const onlyFlag  = argv.indexOf('--only');
const onlyTarget = onlyFlag !== -1 ? argv[onlyFlag + 1] : null;
const cfgPath   = cfgFlag !== -1
  ? path.resolve(argv[cfgFlag + 1])
  : path.resolve(process.cwd(), 'deploy.config.js');

// ─────────────────────────────────────────────────────────────
// Help
// ─────────────────────────────────────────────────────────────
if (showHelp) {
  console.log(`
Universal SSH Deployer
──────────────────────────────────────────────────
  node deploy.js                      Use deploy.config.js in current folder
  node deploy.js --config <file>      Specify a config file
  node deploy.js --only <target>      Run one named target only
  node deploy.js --dry-run            Simulate (no uploads, no remote cmds)
  node deploy.js --help               Show this help

CONFIG FILE: deploy.config.js
  Export a plain JS object. See deploy.config.example.js for all options.
`);
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────
// Logger
// ─────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  cyan: '\x1b[36m', green: '\x1b[32m',
  yellow: '\x1b[33m', red: '\x1b[31m',
  magenta: '\x1b[35m', blue: '\x1b[34m',
  gray: '\x1b[90m',
};

const log = {
  info:    (m) => console.log(`${C.cyan}[INFO]${C.reset}  ${m}`),
  ok:      (m) => console.log(`${C.green}[ OK ]${C.reset}  ${m}`),
  warn:    (m) => console.log(`${C.yellow}[WARN]${C.reset}  ${m}`),
  error:   (m) => console.error(`${C.red}[ERR ]${C.reset}  ${m}`),
  step:    (m) => console.log(`\n${C.bold}${C.magenta}▶ ${m}${C.reset}`),
  dim:     (m) => console.log(`${C.gray}      ${m}${C.reset}`),
  divider: ()  => console.log(C.gray + '─'.repeat(60) + C.reset),
  banner:  (title) => {
    const line = '═'.repeat(title.length + 4);
    console.log(`\n${C.bold}${C.blue}╔${line}╗`);
    console.log(`║  ${title}  ║`);
    console.log(`╚${line}╝${C.reset}\n`);
  },
};

const dryTag = dryRun ? ` ${C.yellow}[DRY-RUN]${C.reset}` : '';

// ─────────────────────────────────────────────────────────────
// Load config
// ─────────────────────────────────────────────────────────────
function loadConfig() {
  if (!fs.existsSync(cfgPath)) {
    log.error(`Config file not found: ${cfgPath}`);
    log.info(`Copy deploy.config.example.js to deploy.config.js and fill it in.`);
    process.exit(1);
  }
  try {
    const cfg = require(cfgPath);
    return cfg;
  } catch (err) {
    log.error(`Failed to load config: ${err.message}`);
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────
// Validate config shape
// ─────────────────────────────────────────────────────────────
function validateConfig(cfg) {
  if (!cfg.ssh || !cfg.ssh.host || !cfg.ssh.username) {
    log.error('Config must have ssh.host and ssh.username');
    process.exit(1);
  }
  if (!cfg.targets || !Array.isArray(cfg.targets) || cfg.targets.length === 0) {
    log.error('Config must have a non-empty targets array');
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────
// Build step runner
// ─────────────────────────────────────────────────────────────
function runBuildCommand(cmd, cwd, label) {
  log.step(`Build: ${label || cmd}`);
  if (dryRun) {
    log.dim(`[dry-run] would run: ${cmd}`);
    return;
  }
  try {
    execSync(cmd, { cwd: cwd || process.cwd(), stdio: 'inherit', shell: true });
    log.ok(`Build "${label || cmd}" succeeded`);
  } catch (err) {
    log.error(`Build command failed: ${cmd}`);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// SSH helpers
// ─────────────────────────────────────────────────────────────
async function remoteExec(ssh, cmd, label) {
  const tag = label || cmd.slice(0, 70);
  log.info(`Remote${dryTag}: ${tag}`);
  if (dryRun) return { code: 0, stdout: '', stderr: '' };

  const result = await ssh.execCommand(cmd, { execOptions: { pty: false } });
  if (result.stdout && result.stdout.trim())
    log.dim(`out: ${result.stdout.trim().slice(0, 300)}`);
  if (result.stderr && result.stderr.trim())
    log.warn(`err: ${result.stderr.trim().slice(0, 300)}`);
  return result;
}

async function putDirectory(ssh, localDir, remoteDir, label, options = {}) {
  log.info(`Upload dir${dryTag}: ${label}`);

  if (!fs.existsSync(localDir)) {
    if (options.required !== false) {
      log.error(`Local directory not found: ${localDir}`);
      return false;
    }
    log.warn(`Skipping (not found): ${localDir}`);
    return true;
  }

  if (dryRun) {
    log.dim(`[dry-run] would upload: ${localDir} → ${remoteDir}`);
    return true;
  }

  const ignorePatterns = options.ignore || [];
  const failed = [];

  const ok = await ssh.putDirectory(localDir, remoteDir, {
    recursive: true,
    concurrency: options.concurrency || 8,
    validate: (itemPath) => {
      const base = path.basename(itemPath);
      if (base === '.DS_Store' || base === 'Thumbs.db') return false;
      for (const pat of ignorePatterns) {
        if (typeof pat === 'string' && itemPath.includes(pat)) return false;
        if (pat instanceof RegExp && pat.test(itemPath)) return false;
      }
      return true;
    },
    tick: (local, remote, error) => {
      if (error) {
        failed.push(local);
        log.warn(`  skip: ${path.relative(localDir, local)}`);
      }
    },
  });

  if (ok && failed.length === 0) {
    log.ok(`${label} → uploaded`);
  } else if (ok) {
    log.warn(`${label} → uploaded with ${failed.length} skipped file(s)`);
  } else {
    log.error(`${label} → upload had failures`);
  }
  return ok;
}

async function putFile(ssh, localFile, remoteFile, label) {
  log.info(`Upload file${dryTag}: ${label || path.basename(localFile)}`);

  if (!fs.existsSync(localFile)) {
    log.warn(`Skipping (not found): ${localFile}`);
    return false;
  }

  if (dryRun) {
    log.dim(`[dry-run] would upload: ${localFile} → ${remoteFile}`);
    return true;
  }

  await ssh.putFile(localFile, remoteFile);
  log.ok(`${label || path.basename(localFile)} → uploaded`);
  return true;
}

// ─────────────────────────────────────────────────────────────
// Run a single target
// ─────────────────────────────────────────────────────────────
async function runTarget(ssh, target, projectRoot) {
  log.step(`Target: ${target.name}`);
  log.divider();

  // 1. Pre-build commands (local)
  if (target.build && target.build.length > 0) {
    for (const cmd of target.build) {
      const cmdStr = typeof cmd === 'string' ? cmd : cmd.cmd;
      const cmdCwd = typeof cmd === 'string' ? projectRoot : (cmd.cwd || projectRoot);
      const cmdLabel = typeof cmd === 'string' ? cmd : cmd.label;
      runBuildCommand(cmdStr, cmdCwd, cmdLabel);
    }
  }

  // 2. Ensure remote directories exist
  if (target.remoteDirs && target.remoteDirs.length > 0) {
    await remoteExec(ssh, `mkdir -p ${target.remoteDirs.join(' ')}`, 'mkdir remote dirs');
  }

  // 3. Upload directories
  if (target.uploadDirs && target.uploadDirs.length > 0) {
    for (const entry of target.uploadDirs) {
      const localDir  = path.resolve(projectRoot, entry.local);
      const remoteDir = entry.remote;
      await putDirectory(ssh, localDir, remoteDir, entry.label || entry.local, entry);
    }
  }

  // 4. Upload individual files
  if (target.uploadFiles && target.uploadFiles.length > 0) {
    for (const entry of target.uploadFiles) {
      const localFile  = path.resolve(projectRoot, entry.local);
      const remoteFile = entry.remote;
      await putFile(ssh, localFile, remoteFile, entry.label || path.basename(entry.local));
    }
  }

  // 5. Post-deploy remote commands
  if (target.afterDeploy && target.afterDeploy.length > 0) {
    log.step(`After-deploy commands: ${target.name}`);
    for (const entry of target.afterDeploy) {
      const cmd   = typeof entry === 'string' ? entry : entry.cmd;
      const label = typeof entry === 'string' ? null  : entry.label;
      await remoteExec(ssh, cmd, label);
    }
  }

  log.ok(`Target "${target.name}" complete ✓`);
  return true;
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
async function main() {
  const cfg = loadConfig();
  validateConfig(cfg);

  const projectName = cfg.name || 'Project';
  const projectRoot = cfg.root ? path.resolve(cfg.root) : path.dirname(cfgPath);

  log.banner(`${projectName}  →  SSH Deploy${dryRun ? '  [DRY-RUN]' : ''}`);
  log.info(`Config   : ${cfgPath}`);
  log.info(`Root     : ${projectRoot}`);
  log.info(`Server   : ${cfg.ssh.host}:${cfg.ssh.port || 22}`);
  if (onlyTarget) log.info(`Filter   : --only ${onlyTarget}`);
  if (dryRun)     log.warn(`DRY-RUN mode — no files will be transferred`);

  // Filter targets
  let targets = cfg.targets;
  if (onlyTarget) {
    targets = targets.filter(t => t.name === onlyTarget);
    if (targets.length === 0) {
      log.error(`No target named "${onlyTarget}". Available: ${cfg.targets.map(t => t.name).join(', ')}`);
      process.exit(1);
    }
  }

  // Run local pre-steps that aren't tied to a target
  if (cfg.beforeAll && !onlyTarget) {
    log.step('Running beforeAll commands (local)...');
    for (const cmd of cfg.beforeAll) {
      const cmdStr   = typeof cmd === 'string' ? cmd : cmd.cmd;
      const cmdCwd   = typeof cmd === 'string' ? projectRoot : (cmd.cwd || projectRoot);
      const cmdLabel = typeof cmd === 'string' ? cmd : cmd.label;
      runBuildCommand(cmdStr, cmdCwd, cmdLabel);
    }
  }

  // SSH connect
  log.step(`Connecting via SSH...`);
  const ssh = new NodeSSH();

  if (!dryRun) {
    const sshOpts = {
      host:         cfg.ssh.host,
      port:         cfg.ssh.port || 22,
      username:     cfg.ssh.username,
      readyTimeout: cfg.ssh.timeout || 30000,
    };

    // Auth: password or private key
    if (cfg.ssh.privateKeyPath) {
      sshOpts.privateKeyPath = path.resolve(cfg.ssh.privateKeyPath);
      if (cfg.ssh.passphrase) sshOpts.passphrase = cfg.ssh.passphrase;
    } else if (cfg.ssh.password) {
      sshOpts.password = cfg.ssh.password;
    } else {
      log.error('SSH config must have either password or privateKeyPath');
      process.exit(1);
    }

    try {
      await ssh.connect(sshOpts);
      log.ok(`SSH connected to ${cfg.ssh.host}`);
    } catch (err) {
      log.error(`SSH connection failed: ${err.message}`);
      process.exit(1);
    }
  } else {
    log.dim('[dry-run] would connect to SSH');
  }

  // Run targets
  const results = [];
  try {
    for (const target of targets) {
      const ok = await runTarget(ssh, target, projectRoot);
      results.push({ name: target.name, ok });
    }
  } catch (err) {
    log.error(`Deploy error: ${err.message}`);
  } finally {
    if (!dryRun) {
      ssh.dispose();
      log.info('SSH connection closed');
    }
  }

  // Run afterAll remote commands
  if (cfg.afterAll && !onlyTarget && !dryRun) {
    const ssh2 = new NodeSSH();
    await ssh2.connect({ /* same opts */ });
    log.step('Running afterAll remote commands...');
    for (const cmd of cfg.afterAll) {
      const cmdStr   = typeof cmd === 'string' ? cmd : cmd.cmd;
      const label    = typeof cmd === 'string' ? null : cmd.label;
      await remoteExec(ssh2, cmdStr, label);
    }
    ssh2.dispose();
  }

  // Summary
  console.log(`\n${C.bold}┌${'─'.repeat(44)}┐`);
  console.log(`│${'  DEPLOYMENT SUMMARY'.padEnd(44)}│`);
  console.log(`└${'─'.repeat(44)}┘${C.reset}`);
  for (const r of results) {
    const icon = r.ok ? `${C.green}✓ OK${C.reset}` : `${C.red}✗ FAILED${C.reset}`;
    console.log(`  ${r.name.padEnd(20)} : ${icon}`);
  }

  if (cfg.urls) {
    console.log('');
    for (const [label, url] of Object.entries(cfg.urls)) {
      console.log(`  ${label.padEnd(20)} : ${url}`);
    }
  }
  console.log('');
}

main().catch((err) => {
  log.error('Fatal: ' + err.message);
  process.exit(1);
});
