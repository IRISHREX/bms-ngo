/**
 * deploy-ssh.js
 * ─────────────────────────────────────────────────────────────
 * SSH deployment to Hostinger shared hosting.
 *
 * What it does:
 *  1. Builds the Vite/React frontend (npm run build)
 *  2. Uploads dist/ → hopefoundationmsd.org/public_html
 *  3. Uploads backend-php (src/, public/, composer.json, .env)
 *     → api.hopefoundationmsd.org/public_html
 *  4. Runs composer install --no-dev --optimize-autoloader remotely
 *  5. Creates uploads/ directory with correct permissions remotely
 *
 * Usage:
 *   cd scratch_deploy
 *   node deploy-ssh.js              # deploy everything
 *   node deploy-ssh.js --frontend   # frontend only
 *   node deploy-ssh.js --backend    # backend only
 *
 * Requirements: node-ssh (already in scratch_deploy/node_modules)
 */

const { NodeSSH } = require('node-ssh');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// ─── CONFIG ───────────────────────────────────────────────────
const SSH_CONFIG = {
  host: '147.93.17.56',
  port: 65002,
  username: 'u832627210',
  password: 'Sohel@34892',
  readyTimeout: 30000,
};

const ROOT = path.join(__dirname, '..');

const PATHS = {
  // Local
  distDir:          path.join(ROOT, 'dist'),
  phpSrcDir:        path.join(ROOT, 'backend-php', 'src'),
  phpPublicDir:     path.join(ROOT, 'backend-php', 'public'),
  phpEnvFile:       path.join(ROOT, 'backend-php', 'remote_env.txt'),
  phpComposerJson:  path.join(ROOT, 'backend-php', 'composer.json'),
  phpComposerLock:  path.join(ROOT, 'backend-php', 'composer.lock'),
  phpComposerPhar:  path.join(ROOT, 'backend-php', 'composer.phar'),

  // Remote
  remoteFrontend:   '/home/u832627210/domains/hopefoundationmsd.org/public_html',
  remoteBackend:    '/home/u832627210/domains/api.hopefoundationmsd.org/public_html',
  remoteUploads:    '/home/u832627210/domains/api.hopefoundationmsd.org/public_html/uploads',
};

// ─── HELPERS ──────────────────────────────────────────────────
const log = {
  info:    (msg) => console.log('\x1b[36m[INFO]\x1b[0m  ' + msg),
  ok:      (msg) => console.log('\x1b[32m[ OK ]\x1b[0m  ' + msg),
  warn:    (msg) => console.log('\x1b[33m[WARN]\x1b[0m  ' + msg),
  error:   (msg) => console.error('\x1b[31m[ERR ]\x1b[0m  ' + msg),
  step:    (msg) => console.log('\n\x1b[1m\x1b[35m▶ ' + msg + '\x1b[0m'),
  divider: ()    => console.log('─'.repeat(60)),
};

async function remoteExec(ssh, cmd, label) {
  const tag = label || cmd.slice(0, 60);
  log.info('Remote: ' + tag);
  const result = await ssh.execCommand(cmd);
  if (result.stdout && result.stdout.trim()) log.ok('  out: ' + result.stdout.trim().slice(0, 200));
  if (result.stderr && result.stderr.trim()) log.warn('  err: ' + result.stderr.trim().slice(0, 200));
  return result;
}

async function putDir(ssh, localDir, remoteDir, label) {
  log.info('Uploading ' + label + '...');
  if (!fs.existsSync(localDir)) {
    log.error('Local directory not found: ' + localDir);
    return false;
  }
  const failed = [];
  const ok = await ssh.putDirectory(localDir, remoteDir, {
    recursive: true,
    concurrency: 8,
    validate: (itemPath) => {
      const base = path.basename(itemPath);
      return base !== '.DS_Store' && base !== 'Thumbs.db';
    },
    tick: (localPath, remotePath, error) => {
      if (error) {
        failed.push(localPath);
        log.warn('  skip: ' + path.relative(localDir, localPath));
      }
    },
  });
  if (ok && failed.length === 0) {
    log.ok(label + ' uploaded successfully');
  } else if (ok) {
    log.warn(label + ' uploaded with ' + failed.length + ' skipped file(s)');
  } else {
    log.error(label + ' upload had failures');
  }
  return ok;
}

async function putFile(ssh, localFile, remoteFile, label) {
  if (!fs.existsSync(localFile)) {
    log.warn('Skipping ' + label + ' — not found locally');
    return false;
  }
  log.info('Uploading ' + label + '...');
  await ssh.putFile(localFile, remoteFile);
  log.ok(label + ' uploaded');
  return true;
}

// ─── STEPS ────────────────────────────────────────────────────

async function buildFrontend() {
  log.step('Building frontend (npm run build)...');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  log.ok('Frontend build complete');
}

async function deployFrontend(ssh) {
  log.step('Deploying Frontend  →  hopefoundationmsd.org/public_html');
  log.divider();

  if (!fs.existsSync(PATHS.distDir)) {
    log.error('dist/ not found. Build first or run without --backend flag.');
    return false;
  }

  await putDir(ssh, PATHS.distDir, PATHS.remoteFrontend, 'dist/');
  log.ok('Frontend deployed');
  return true;
}

async function deployBackend(ssh) {
  log.step('Deploying Backend PHP  →  api.hopefoundationmsd.org/public_html');
  log.divider();

  const remoteBase = PATHS.remoteBackend;

  // 1. Ensure remote directories exist
  await remoteExec(ssh, 'mkdir -p ' + remoteBase + '/src ' + remoteBase + '/uploads', 'mkdir remote dirs');

  // 2. Upload public/ (index.php + .htaccess) → root of backend public_html
  await putDir(ssh, PATHS.phpPublicDir, remoteBase, 'backend-php/public/');

  // 3. Upload src/
  await putDir(ssh, PATHS.phpSrcDir, remoteBase + '/src', 'backend-php/src/');

  // 4. Upload composer files
  await putFile(ssh, PATHS.phpComposerJson, remoteBase + '/composer.json', 'composer.json');
  await putFile(ssh, PATHS.phpComposerLock, remoteBase + '/composer.lock', 'composer.lock');

  // 5. Upload composer.phar (so we can run it remotely)
  await putFile(ssh, PATHS.phpComposerPhar, remoteBase + '/composer.phar', 'composer.phar');

  // 6. Upload production .env (from remote_env.txt)
  await putFile(ssh, PATHS.phpEnvFile, remoteBase + '/.env', '.env (production)');

  // 7. Run composer install on server
  log.step('Running composer install on server...');
  const composerCmd = [
    'cd ' + remoteBase,
    '&& php composer.phar install --no-dev --optimize-autoloader 2>&1',
  ].join(' ');
  await remoteExec(ssh, composerCmd, 'php composer.phar install');

  // 8. Fix permissions
  await remoteExec(ssh, 'chmod -R 755 ' + PATHS.remoteUploads + ' 2>/dev/null || true', 'chmod uploads');
  await remoteExec(ssh, 'chmod 775 ' + PATHS.remoteUploads + ' 2>/dev/null || true', 'chmod uploads dir');

  // 9. Smoke test
  const check = await remoteExec(ssh,
    'test -f ' + remoteBase + '/index.php && echo "index.php OK" || echo "index.php MISSING"',
    'verify index.php'
  );
  if (check.stdout && check.stdout.includes('OK')) {
    log.ok('Backend entry point verified');
  } else {
    log.warn('index.php check returned: ' + (check.stdout || 'no output'));
  }

  log.ok('Backend deployed');
  return true;
}

// ─── MAIN ─────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const onlyFrontend = args.includes('--frontend');
  const onlyBackend  = args.includes('--backend');

  console.log('\n\x1b[1m\x1b[34m╔══════════════════════════════════════════╗');
  console.log('║   BMS-NGO  →  Hostinger SSH Deploy      ║');
  console.log('╚══════════════════════════════════════════╝\x1b[0m');

  const deployFront = !onlyBackend;
  const deployBack  = !onlyFrontend;

  // Build frontend first (outside SSH) if we're deploying it
  if (deployFront) {
    try {
      await buildFrontend();
    } catch (err) {
      log.error('Build failed — aborting');
      process.exit(1);
    }
  }

  // Open SSH connection
  log.step('Connecting via SSH to ' + SSH_CONFIG.host + ':' + SSH_CONFIG.port);
  const ssh = new NodeSSH();
  try {
    await ssh.connect(SSH_CONFIG);
    log.ok('SSH connected');
  } catch (err) {
    log.error('SSH connection failed: ' + err.message);
    process.exit(1);
  }

  const results = {};
  try {
    if (deployFront) results.frontend = await deployFrontend(ssh);
    if (deployBack)  results.backend  = await deployBackend(ssh);
  } catch (err) {
    log.error('Deploy error: ' + err.message);
  } finally {
    ssh.dispose();
    log.info('SSH connection closed');
  }

  // Summary
  console.log('\n\x1b[1m┌────────────────────────────────────────┐');
  console.log('│            DEPLOYMENT SUMMARY          │');
  console.log('└────────────────────────────────────────┘\x1b[0m');
  if (results.frontend !== undefined)
    console.log('  Frontend : ' + (results.frontend ? '\x1b[32m✓ OK\x1b[0m' : '\x1b[31m✗ FAILED\x1b[0m'));
  if (results.backend !== undefined)
    console.log('  Backend  : ' + (results.backend  ? '\x1b[32m✓ OK\x1b[0m' : '\x1b[31m✗ FAILED\x1b[0m'));
  console.log('');
  console.log('  Frontend : https://hopefoundationmsd.org');
  console.log('  API      : https://api.hopefoundationmsd.org/api/stats');
  console.log('');
}

main().catch((err) => {
  log.error('Unhandled: ' + err.message);
  process.exit(1);
});
