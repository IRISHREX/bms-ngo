const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

async function deploy() {
  try {
    console.log('Connecting to SSH...');
    await ssh.connect({
      host: '147.93.17.56',
      port: 65002,
      username: 'u832627210',
      password: 'Sohel@34892'
    });
    console.log('Connected!');

    // 1. Deploy Frontend
    console.log('Deploying Frontend...');
    const localFrontend = path.join(__dirname, '..', 'dist');
    const remoteFrontend = '/home/u832627210/domains/hopefoundationmsd.org/public_html';
    
    // Using putDirectory to recursively upload files
    const statusFront = await ssh.putDirectory(localFrontend, remoteFrontend, {
      recursive: true,
      concurrency: 10,
      tick: (localPath, remotePath, error) => {
        if (error) {
          console.error(`Frontend upload failed for ${localPath}:`, error);
        }
      }
    });
    
    if (statusFront) {
      console.log('Frontend deployed successfully!');
    } else {
      console.error('Frontend deployment encountered issues.');
    }

    // 2. Deploy Backend PHP src
    console.log('Deploying Backend PHP...');
    const localBackendSrc = path.join(__dirname, '..', 'backend-php', 'src');
    const remoteBackendSrc = '/home/u832627210/domains/hopefoundationmsd.org/public_html/api/src';
    
    const statusBack = await ssh.putDirectory(localBackendSrc, remoteBackendSrc, {
      recursive: true,
      concurrency: 10,
      tick: (localPath, remotePath, error) => {
        if (error) {
          console.error(`Backend upload failed for ${localPath}:`, error);
        }
      }
    });

    if (statusBack) {
      console.log('Backend deployed successfully!');
    } else {
      console.error('Backend deployment encountered issues.');
    }

    ssh.dispose();
  } catch (err) {
    console.error('Error during deployment:', err);
    if (ssh) ssh.dispose();
  }
}

deploy();
