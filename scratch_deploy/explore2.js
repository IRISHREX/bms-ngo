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

    const apiRes = await ssh.execCommand('ls -la /home/u832627210/domains/hopefoundationmsd.org/public_html/api');
    console.log('API directory:', apiRes.stdout);
    
    ssh.dispose();
  } catch (err) {
    console.error('Error:', err);
  }
}

explore();
