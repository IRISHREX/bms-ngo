# 🚀 Universal SSH Deployer

Deploy **any project** to **any server** over SSH — with a single config file.

Supports: static sites, PHP/Slim/Laravel, Node.js + PM2, or any combination.

---

## Setup (once)

```powershell
cd c:\PROJECTS\bms-ngo\ssh-deploy
npm install
```

---

## Using it for a new project

### Step 1 — Copy the example config into your project root

```powershell
copy c:\PROJECTS\bms-ngo\ssh-deploy\deploy.config.example.js  C:\PROJECTS\my-new-project\deploy.config.js
```

### Step 2 — Fill in `deploy.config.js`

```js
module.exports = {
  name: 'My New Project',
  root: __dirname,

  ssh: {
    host:     '111.222.333.444',   // server IP
    port:     22,                  // or 65002 for Hostinger
    username: 'myuser',
    password: 'mypassword',        // or use privateKeyPath
  },

  targets: [
    {
      name: 'frontend',
      build: [
        { cmd: 'npm run build', cwd: __dirname, label: 'Build' }
      ],
      remoteDirs: ['/var/www/mysite/public_html'],
      uploadDirs: [
        { local: 'dist', remote: '/var/www/mysite/public_html', label: 'dist/' }
      ],
      afterDeploy: [],
    },
  ],

  urls: {
    Site: 'https://mysite.com',
  },
};
```

### Step 3 — Deploy

```powershell
# Full deploy
node c:\PROJECTS\bms-ngo\ssh-deploy\deploy.js --config C:\PROJECTS\my-new-project\deploy.config.js

# Specific target only
node c:\PROJECTS\bms-ngo\ssh-deploy\deploy.js --config C:\PROJECTS\my-new-project\deploy.config.js --only frontend

# Dry run (simulate, nothing uploaded)
node c:\PROJECTS\bms-ngo\ssh-deploy\deploy.js --config C:\PROJECTS\my-new-project\deploy.config.js --dry-run
```

---

## Config reference

```js
module.exports = {
  name: 'Project Name',     // shown in output
  root: __dirname,          // project root folder

  ssh: {
    host:           'server-ip',
    port:           22,
    username:       'user',

    // Auth — use password OR privateKeyPath:
    password:       'pass',
    privateKeyPath: '~/.ssh/id_rsa',
    passphrase:     '',          // only if key has passphrase

    timeout:        30000,
  },

  // Local commands run once before all targets
  beforeAll: [
    'npm run lint',
    { cmd: 'npm test', cwd: __dirname, label: 'Run tests' },
  ],

  targets: [
    {
      name: 'target-name',       // used with --only <name>

      // Local build commands
      build: [
        { cmd: 'npm run build', cwd: __dirname, label: 'Vite build' },
      ],

      // Remote dirs to create (mkdir -p)
      remoteDirs: [
        '/var/www/site/public_html',
      ],

      // Directories to upload
      uploadDirs: [
        {
          local:       'dist',               // relative to root
          remote:      '/var/www/site/public_html',
          label:       'dist/',              // optional display label
          ignore:      ['dist/debug.html'],  // optional skip list
          concurrency: 8,                    // optional (default: 8)
        },
      ],

      // Individual files to upload
      uploadFiles: [
        {
          local:  'backend/.env.production',
          remote: '/var/www/api/.env',
          label:  '.env',
        },
      ],

      // Remote commands after upload
      afterDeploy: [
        'php composer.phar install --no-dev',
        { cmd: 'pm2 restart api', label: 'Restart API' },
      ],
    },
  ],

  // URLs printed in the summary
  urls: {
    Frontend: 'https://mysite.com',
    API:      'https://api.mysite.com/health',
  },
};
```

---

## Included project configs

| Project | Config file |
|---|---|
| BMS-NGO (Hope Foundation) | `c:\PROJECTS\bms-ngo\deploy.config.js` |

---

## Preset templates (in `deploy.config.example.js`)

- **Vite / React** — build + upload dist
- **PHP / Slim** — upload src + run composer
- **Node.js + PM2** — upload + restart with pm2
- **Laravel** — upload + migrate + cache

---

## CLI flags

| Flag | Description |
|---|---|
| `--config <file>` | Path to config file (default: `deploy.config.js` in CWD) |
| `--only <name>` | Run one target by name |
| `--dry-run` | Simulate — shows what would happen, no actual uploads |
| `--help` | Show help |
