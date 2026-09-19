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
        '/home/u832627210/domains/hopefoundationmsd.org/public_html/api/src',
        '/home/u832627210/domains/hopefoundationmsd.org/public_html/api/public',
        '/home/u832627210/domains/hopefoundationmsd.org/public_html/api/public/uploads',
        '/home/u832627210/domains/hopefoundationmsd.org/public_html/api/public/uploads/volunteers',
      ],
      uploadDirs: [
        {
          local:  'backend-php/public',
          remote: '/home/u832627210/domains/hopefoundationmsd.org/public_html/api/public',
          label:  'backend-php/public/',
        },
        {
          local:  'backend-php/src',
          remote: '/home/u832627210/domains/hopefoundationmsd.org/public_html/api/src',
          label:  'backend-php/src/',
        },
      ],
      uploadFiles: [
        {
          local:  'backend-php/composer.json',
          remote: '/home/u832627210/domains/hopefoundationmsd.org/public_html/api/composer.json',
        },
        {
          local:  'backend-php/composer.lock',
          remote: '/home/u832627210/domains/hopefoundationmsd.org/public_html/api/composer.lock',
        },
        {
          local:  'backend-php/remote_env.txt',
          remote: '/home/u832627210/domains/hopefoundationmsd.org/public_html/api/.env',
          label:  '.env (production)',
        },
      ],
      afterDeploy: [
        {
          cmd: 'chmod -R 755 /home/u832627210/domains/hopefoundationmsd.org/public_html/api/public/uploads',
          label: 'chmod uploads',
        },
        {
          cmd: 'test -f /home/u832627210/domains/hopefoundationmsd.org/public_html/api/public/index.php && echo "index.php OK" || echo "index.php MISSING"',
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
