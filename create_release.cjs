const token = process.env.GH_TOKEN;
const repo = 'lipex15/brain';
const version = require('./package.json').version;

fetch(`https://api.github.com/repos/${repo}/releases`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        tag_name: `v${version}`,
        name: `v${version}`,
        body: 'Stable standalone Global Stock release'
    })
}).then(async res => {
    if (!res.ok) {
        console.log('Release probably already exists or failed:', await res.text());
    } else {
        console.log('Created release tag ' + version);
    }
}).catch(console.error);
