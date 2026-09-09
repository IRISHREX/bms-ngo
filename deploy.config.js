/**
 * deploy.config.js  — BMS-NGO / Hope Foundation
 * Place this in the bms-ngo project root.
 * Run: node ssh-deploy/deploy.js --config deploy.config.js
 */

const path = require('path');

module.exports = {
  name: 'BMS-NGO (Hope Foundation)',
  root: __dirname,                    // c:\PROJECTS\bms-ngo

  ssh: {
    host:     '147.93.17.56',
    port:     65002,
    username: 'u832627210',
    password: 'Sohel@34892',
    timeout:  30000,
  },

  targets: [
    {
      name: 'frontend',
      build: [
        { cmd: 'npm run build', cwd: path.join(__dirname), label: 'Vite build' },
      ],
      remoteDirs: [
        '/home/u832627210/domains/hopefoundationmsd.org/public_html',
      ],
      uploadDirs: [
        {
          local:  'dist',
          remote: '/home/u832627210/domains/hopefoundationmsd.org/public_html',
          label:  'dist/',
        },
      ],
      afterDeploy: [],
    },

    {
      name: 'backend',
      build: [],
      remoteDirs: [
        '/home/u832627210/domains/api.hopefoundationmsd.org/public_html/src',
        '/home/u832627210/domains/api.hopefoundationmsd.org/public_html/uploads',
      ],
      uploadDirs: [
        {
          local:  'backend-php/public',
          remote: '/home/u832627210/domains/api.hopefoundationmsd.org/public_html',
          label:  'backend-php/public/',
        },
        {
          local:  'backend-php/src',
          remote: '/home/u832627210/domains/api.hopefoundationmsd.org/public_html/src',
          label:  'backend-php/src/',
        },
      ],
      uploadFiles: [
        {
          local:  'backend-php/composer.json',
          remote: '/home/u832627210/domains/api.hopefoundationmsd.org/public_html/composer.json',
        },
        {
          local:  'backend-php/composer.lock',
          remote: '/home/u832627210/domains/api.hopefoundationmsd.org/public_html/composer.lock',
        },
        {
          local:  'backend-php/composer.phar',
          remote: '/home/u832627210/domains/api.hopefoundationmsd.org/public_html/composer.phar',
        },
        {
          local:  'backend-php/remote_env.txt',
          remote: '/home/u832627210/domains/api.hopefoundationmsd.org/public_html/.env',
          label:  '.env (production)',
        },
      ],
      afterDeploy: [
        {
          cmd: 'cd /home/u832627210/domains/api.hopefoundationmsd.org/public_html && php composer.phar install --no-dev --optimize-autoloader',
          label: 'composer install',
        },
        {
          cmd: 'chmod -R 755 /home/u832627210/domains/api.hopefoundationmsd.org/public_html/uploads',
          label: 'chmod uploads',
        },
        {
          cmd: 'test -f /home/u832627210/domains/api.hopefoundationmsd.org/public_html/index.php && echo "index.php OK" || echo "index.php MISSING"',
          label: 'verify index.php',
        },
      ],
    },
  ],

  urls: {
    Frontend: 'https://hopefoundationmsd.org',
    API:      'https://api.hopefoundationmsd.org/api/stats',
  },
};
