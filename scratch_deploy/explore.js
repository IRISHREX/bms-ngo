const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function explore() {
  try {
    await ssh.connect({
      host: '147.93.17.56',
      port: 65002,
      username: 'u832627210',
      password: 'Sohel@34892'
    });
    console.log('Connected!');

    const result = await ssh.execCommand('ls -la /home/u832627210/domains/');
    console.log('Domains directory:', result.stdout);
    
    // Also check document roots for these domains
    const frontendRes = await ssh.execCommand('ls -la /home/u832627210/domains/hopefoundationmsd.org/public_html/');
    console.log('Frontend public_html:', frontendRes.stdout);
    
    const backendRes = await ssh.execCommand('ls -la /home/u832627210/domains/api.hopefoundationmsd.org/public_html/');
    console.log('Backend public_html:', backendRes.stdout);

    ssh.dispose();
  } catch (err) {
    console.error('Error:', err);
  }
}

explore();
