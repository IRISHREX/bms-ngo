/**
 * deploy.config.example.js
 * ─────────────────────────────────────────────────────────────
 * Copy this file to your project root as  deploy.config.js
 * then fill in your values.
 *
 * Run with:
 *   node /path/to/ssh-deploy/deploy.js
 *   node /path/to/ssh-deploy/deploy.js --only backend
 *   node /path/to/ssh-deploy/deploy.js --dry-run
 */

module.exports = {

  // ── Project info ──────────────────────────────────────────
  name: 'My Project',                   // Label shown in deploy output
  root: __dirname,                      // Project root (default: same dir as config)

  // ── SSH connection ─────────────────────────────────────────
  ssh: {
    host:     '000.000.000.000',        // Server IP or hostname
    port:     22,                       // SSH port (Hostinger uses 65002)
    username: 'your_ssh_user',

    // Use ONE of: password OR privateKeyPath
    password: 'your_ssh_password',
    // privateKeyPath: '~/.ssh/id_rsa', // path to private key file
    // passphrase: '',                  // key passphrase if set

    timeout:  30000,                    // Connection timeout ms
  },

  // ── Run locally BEFORE all targets ────────────────────────
  // Optional. Runs once before any target, regardless of --only.
  beforeAll: [
    // Simple string form
    'npm run lint',

    // Object form (custom cwd + label)
    // { cmd: 'npm run build', cwd: __dirname, label: 'Build frontend' },
  ],

  // ── Deploy targets ─────────────────────────────────────────
  // Each target is deployed in order.
  // Use --only <name> to run a single target.
  targets: [

    // ── EXAMPLE 1: Static / Vite / React frontend ──────────
    {
      name: 'frontend',

      // Local build commands (run before upload)
      build: [
        { cmd: 'npm run build', cwd: __dirname, label: 'Vite build' },
      ],

      // Remote directories to create before uploading
      remoteDirs: [
        '/var/www/mysite/public_html',
      ],

      // Directories to upload  (local → remote)
      uploadDirs: [
        {
          local:  'dist',
          remote: '/var/www/mysite/public_html',
          label:  'dist/',
          ignore: ['dist/stats.html'],      // optional ignore list (strings or RegExp)
        },
      ],

      // Remote commands to run after uploading
      afterDeploy: [
        { cmd: 'chmod -R 755 /var/www/mysite/public_html', label: 'chmod' },
      ],
    },

    // ── EXAMPLE 2: PHP / Slim / Laravel backend ────────────
    {
      name: 'backend',

      // No local build needed for PHP
      build: [],

      remoteDirs: [
        '/var/www/api/public_html/src',
        '/var/www/api/public_html/uploads',
      ],

      uploadDirs: [
        { local: 'backend-php/public', remote: '/var/www/api/public_html',     label: 'public/' },
        { local: 'backend-php/src',    remote: '/var/www/api/public_html/src', label: 'src/' },
      ],

      uploadFiles: [
        { local: 'backend-php/composer.json',  remote: '/var/www/api/public_html/composer.json'  },
        { local: 'backend-php/composer.lock',  remote: '/var/www/api/public_html/composer.lock'  },
        { local: 'backend-php/composer.phar',  remote: '/var/www/api/public_html/composer.phar'  },
        { local: 'backend-php/remote_env.txt', remote: '/var/www/api/public_html/.env', label: '.env' },
      ],

      afterDeploy: [
        { cmd: 'cd /var/www/api/public_html && php composer.phar install --no-dev --optimize-autoloader', label: 'composer install' },
        { cmd: 'chmod -R 755 /var/www/api/public_html/uploads', label: 'chmod uploads' },
      ],
    },

    // ── EXAMPLE 3: Node.js + PM2 backend ──────────────────
    // {
    //   name: 'node-api',
    //   build: [
    //     { cmd: 'npm ci --omit=dev', cwd: __dirname + '/api', label: 'npm ci' },
    //   ],
    //   remoteDirs: ['/var/www/api'],
    //   uploadDirs: [
    //     {
    //       local:  'api',
    //       remote: '/var/www/api',
    //       label:  'api/',
    //       ignore: ['api/node_modules', 'api/.env', 'api/logs'],
    //     },
    //   ],
    //   uploadFiles: [
    //     { local: 'api/.env.production', remote: '/var/www/api/.env', label: '.env' },
    //   ],
    //   afterDeploy: [
    //     { cmd: 'cd /var/www/api && npm ci --omit=dev', label: 'npm ci on server' },
    //     { cmd: 'pm2 restart my-api || pm2 start /var/www/api/index.js --name my-api', label: 'pm2 restart' },
    //   ],
    // },

    // ── EXAMPLE 4: Laravel ─────────────────────────────────
    // {
    //   name: 'laravel',
    //   build: [],
    //   remoteDirs: ['/var/www/laravel'],
    //   uploadDirs: [
    //     { local: '.', remote: '/var/www/laravel', label: 'laravel/', ignore: ['node_modules', 'vendor', '.git', 'storage/logs'] },
    //   ],
    //   uploadFiles: [
    //     { local: '.env.production', remote: '/var/www/laravel/.env', label: '.env' },
    //   ],
    //   afterDeploy: [
    //     { cmd: 'cd /var/www/laravel && composer install --no-dev --optimize-autoloader', label: 'composer' },
    //     { cmd: 'cd /var/www/laravel && php artisan migrate --force', label: 'migrate' },
    //     { cmd: 'cd /var/www/laravel && php artisan config:cache', label: 'config:cache' },
    //     { cmd: 'cd /var/www/laravel && php artisan route:cache', label: 'route:cache' },
    //     { cmd: 'chmod -R 775 /var/www/laravel/storage', label: 'chmod storage' },
    //   ],
    // },

  ],

  // ── Live URLs (shown in summary after deploy) ───────────────
  urls: {
    Frontend: 'https://mysite.com',
    API:      'https://api.mysite.com/api/health',
  },
};
