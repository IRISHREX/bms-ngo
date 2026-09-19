#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║          UNIVERSAL SSH FETCHER   v1.0                   ║
 * ║  Fetch files & DB from Hostinger/SSH to local machine   ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * USAGE:
 *   node fetch.js                        → fetches to hostinger-backup-YYYY-MM-DD-HHmmss
 *   node fetch.js --out my-backup        → custom destination folder
 *   node fetch.js --only backend         → fetch backend files & .env only
 *   node fetch.js --only db              → dump & fetch MySQL database only
 *   node fetch.js --only frontend        → fetch frontend public_html only
 *   node fetch.js --config path/to/cfg   → custom deploy config file
 */

const { NodeSSH } = require('node-ssh');
const path        = require('path');
const fs          = require('fs');
const { execSync } = require('child_process');

const argv        = process.argv.slice(2);
const showHelp    = argv.includes('--help') || argv.includes('-h');
const cfgFlag     = argv.indexOf('--config');
const onlyFlag    = argv.indexOf('--only');
const outFlag     = argv.indexOf('--out');

const onlyTarget  = onlyFlag !== -1 ? argv[onlyFlag + 1] : null;

// Search config path
let cfgPath;
if (cfgFlag !== -1) {
  cfgPath = path.resolve(argv[cfgFlag + 1]);
} else {
  const candidates = [
    path.resolve(process.cwd(), 'deploy.config.cjs'),
    path.resolve(process.cwd(), 'deploy.config.js'),
    path.resolve(__dirname, '..', 'deploy.config.cjs'),
    path.resolve(__dirname, '..', 'deploy.config.js'),
  ];
  cfgPath = candidates.find(c => fs.existsSync(c)) || candidates[0];
}

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

if (showHelp) {
  console.log(`
Universal SSH Fetcher
──────────────────────────────────────────────────
  node fetch.js                       Fetch all into timestamped folder
  node fetch.js --out <folder>        Specify output folder
  node fetch.js --only <target>       backend | frontend | db
  node fetch.js --config <file>       Specify deploy.config.cjs path
  node fetch.js --help                Show help
`);
  process.exit(0);
}

function pad(n) { return String(n).padStart(2, '0'); }
function getTimestamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function main() {
  if (!fs.existsSync(cfgPath)) {
    log.error(`Config file not found at: ${cfgPath}`);
    process.exit(1);
  }

  const cfg = require(cfgPath);
  const projectRoot = cfg.root || path.resolve(__dirname, '..');

  const destFolder = outFlag !== -1
    ? path.resolve(projectRoot, argv[outFlag + 1])
    : path.resolve(projectRoot, `hostinger-backup-${getTimestamp()}`);

  log.banner(`SSH FETCH: ${cfg.name || 'Remote Host'}`);
  log.info(`Host:        ${cfg.ssh.host}:${cfg.ssh.port}`);
  log.info(`User:        ${cfg.ssh.username}`);
  log.info(`Destination: ${destFolder}`);
  if (onlyTarget) log.info(`Filter:      --only ${onlyTarget}`);

  fs.mkdirSync(destFolder, { recursive: true });

  const ssh = new NodeSSH();

  log.step('Connecting to server...');
  try {
    const connConfig = {
      host:     cfg.ssh.host,
      port:     cfg.ssh.port || 22,
      username: cfg.ssh.username,
      readyTimeout: cfg.ssh.timeout || 30000,
    };
    if (cfg.ssh.privateKeyPath) {
      const pKey = cfg.ssh.privateKeyPath.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
      connConfig.privateKey = fs.readFileSync(pKey, 'utf8');
      if (cfg.ssh.passphrase) connConfig.passphrase = cfg.ssh.passphrase;
    } else if (cfg.ssh.password) {
      connConfig.password = cfg.ssh.password;
    }

    await ssh.connect(connConfig);
    log.ok('Connected successfully.');
  } catch (err) {
    log.error(`Connection failed: ${err.message}`);
    process.exit(1);
  }

  const pwdRes = await ssh.execCommand('pwd');
  const remoteHome = pwdRes.stdout.trim() || `/home/${cfg.ssh.username}`;
  const remoteTmp = `${remoteHome}/_fetch_tmp_${Date.now()}`;
  await ssh.execCommand(`mkdir -p ${remoteTmp}`);

  try {
    const doBackend  = !onlyTarget || onlyTarget === 'backend';
    const doFrontend = !onlyTarget || onlyTarget === 'frontend';
    const doDb       = !onlyTarget || onlyTarget === 'db';

    // ─────────────────────────────────────────────────────────
    // 1. Backend files (.env, src, uploads, index.php, etc.)
    // ─────────────────────────────────────────────────────────
    if (doBackend) {
      log.step('Fetching Backend (API) files...');
      const remoteBackendDir = '/home/u832627210/domains/api.hopefoundationmsd.org/public_html';
      const localBackendDir = path.join(destFolder, 'backend-php');
      fs.mkdirSync(localBackendDir, { recursive: true });

      log.dim(`Compressing ${remoteBackendDir} on server (excluding vendor)...`);
      const tarCmd = `cd ${remoteBackendDir} && tar -czf ${remoteTmp}/backend.tar.gz --exclude="vendor" --exclude="*.tar.gz" .`;
      const res = await ssh.execCommand(tarCmd);
      if (res.code !== 0) {
        log.warn(`Tar command returned code ${res.code}: ${res.stderr || res.stdout}`);
      }

      const localTar = path.join(destFolder, 'backend.tar.gz');
      log.dim('Downloading backend.tar.gz via SFTP...');
      await ssh.getFile(localTar, `${remoteTmp}/backend.tar.gz`);

      log.dim('Extracting backend files locally...');
      try {
        execSync(`tar.exe -xzf "${localTar}" -C "${localBackendDir}"`, { stdio: 'pipe' });
        fs.unlinkSync(localTar);
        log.ok(`Backend files extracted to: ${localBackendDir}`);
      } catch (err) {
        log.warn(`Could not auto-extract with tar.exe: ${err.message}. Kept archive ${localTar}`);
      }
    }

    // ─────────────────────────────────────────────────────────
    // 2. MySQL Database Dump
    // ─────────────────────────────────────────────────────────
    if (doDb) {
      log.step('Dumping and fetching MySQL database...');
      // Read DB credentials from remote .env if available
      const envRes = await ssh.execCommand('cat /home/u832627210/domains/api.hopefoundationmsd.org/public_html/.env');
      let dbUser = 'u832627210_hopeUser';
      let dbPass = 'Sohel@34892';
      let dbName = 'u832627210_hopeNgo';

      if (envRes.stdout) {
        const uMatch = envRes.stdout.match(/^DB_USER=(.*)$/m);
        const pMatch = envRes.stdout.match(/^DB_PASSWORD=(.*)$/m);
        const nMatch = envRes.stdout.match(/^DB_NAME=(.*)$/m);
        if (uMatch) dbUser = uMatch[1].trim();
        if (pMatch) dbPass = pMatch[1].trim();
        if (nMatch) dbName = nMatch[1].trim();
      }

      log.dim(`Running mysqldump for database: ${dbName}...`);
      const dumpCmd = `mysqldump -u "${dbUser}" -p'${dbPass}' "${dbName}" > ${remoteTmp}/database_dump.sql`;
      const dumpRes = await ssh.execCommand(dumpCmd);

      if (dumpRes.code === 0) {
        const localSql = path.join(destFolder, 'database_dump.sql');
        log.dim('Downloading database_dump.sql...');
        await ssh.getFile(localSql, `${remoteTmp}/database_dump.sql`);
        const stats = fs.statSync(localSql);
        log.ok(`Database dump saved: ${localSql} (${(stats.size / 1024).toFixed(2)} KB)`);
      } else {
        log.warn(`Database dump failed: ${dumpRes.stderr || dumpRes.stdout}`);
      }
    }

    // ─────────────────────────────────────────────────────────
    // 3. Frontend public_html
    // ─────────────────────────────────────────────────────────
    if (doFrontend) {
      log.step('Fetching Frontend files...');
      const remoteFrontendDir = '/home/u832627210/domains/hopefoundationmsd.org/public_html';
      const localFrontendDir = path.join(destFolder, 'frontend');
      fs.mkdirSync(localFrontendDir, { recursive: true });

      log.dim(`Compressing ${remoteFrontendDir} on server...`);
      const tarCmd = `cd ${remoteFrontendDir} && tar -czf ${remoteTmp}/frontend.tar.gz .`;
      await ssh.execCommand(tarCmd);

      const localTar = path.join(destFolder, 'frontend.tar.gz');
      log.dim('Downloading frontend.tar.gz via SFTP...');
      await ssh.getFile(localTar, `${remoteTmp}/frontend.tar.gz`);

      log.dim('Extracting frontend files locally...');
      try {
        execSync(`tar.exe -xzf "${localTar}" -C "${localFrontendDir}"`, { stdio: 'pipe' });
        fs.unlinkSync(localTar);
        log.ok(`Frontend files extracted to: ${localFrontendDir}`);
      } catch (err) {
        log.warn(`Could not auto-extract frontend: ${err.message}. Kept archive ${localTar}`);
      }
    }

    log.divider();
    log.ok(`All requested items fetched successfully to:`);
    console.log(`     ${C.bold}${C.green}${destFolder}${C.reset}\n`);

  } finally {
    log.dim('Cleaning up temporary files on server...');
    await ssh.execCommand(`rm -rf ${remoteTmp}`);
    ssh.dispose();
  }
}

main().catch((err) => {
  log.error(`Unexpected failure: ${err.message}`);
  process.exit(1);
});
