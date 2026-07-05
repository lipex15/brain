const fs = require('fs');

async function run() {
    const version = require('./package.json').version;
    const token = process.env.GH_TOKEN;
    if (!token) throw new Error("GH_TOKEN is missing");

    console.log(`Getting Github release v${version}`);
    const res = await fetch(`https://api.github.com/repos/lipex15/brain/releases/tags/v${version}`, {
        headers: { 'Authorization': `token ${token}` }
    });
    const data = await res.json();
    const releaseId = data.id;

    if (!releaseId) {
        console.error("Release not found", data);
        return;
    }

    console.log(`Found release ID: ${releaseId}, preparing latest.yml`);
    const file = fs.readFileSync('dist-electron/latest.yml');

    // Only fetch headers for debugging, post body
    const uploadRes = await fetch(`https://uploads.github.com/repos/lipex15/brain/releases/${releaseId}/assets?name=latest.yml`, {
        method: 'POST',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/x-yaml'
        },
        body: file
    });

    const uploadData = await uploadRes.json();
    console.log("Uploaded successfully!", uploadData.name);
}

run();
