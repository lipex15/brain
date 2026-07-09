const fs = require('fs');
const path = require('path');

const version = require('./package.json').version;
const exePath = path.join(__dirname, 'dist-electron', `deathStuffs Setup ${version}.exe`);

if (!fs.existsSync(exePath)) {
    console.error('Exe file not found at', exePath);
    process.exit(1);
}

const token = process.env.GH_TOKEN;
if (!token) {
    console.error('No GH_TOKEN provided');
    process.exit(1);
}

const repo = 'lipex15/brain';
const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json'
};

async function upload() {
    console.log('Fetching release for v' + version);
    const releaseRes = await fetch(`https://api.github.com/repos/${repo}/releases/tags/v${version}`, {
        headers
    });

    if (!releaseRes.ok) {
        console.error('Could not find release', await releaseRes.text());
        process.exit(1);
    }

    const release = await releaseRes.json();
    const uploadUrl = release.upload_url.split('{')[0];

    const fileName = `deathStuffs-Setup-${version}.exe`;

    // Find and delete any existing asset with the same name (prevents 422 already_exists block)
    const assetsRes = await fetch(release.assets_url, { headers });
    const assets = await assetsRes.json();
    const existingExeAssets = assets.filter(a => a.name === fileName);
    for (const existingExe of existingExeAssets) {
        console.log(`Found existing asset ${existingExe.id}. Deleting...`);
        const deleteRes = await fetch(existingExe.url, { method: 'DELETE', headers });
        if (!deleteRes.ok) {
            console.error('Failed to delete existing asset', existingExe.id, await deleteRes.text());
            process.exit(1);
        }
        console.log('Deleted existing asset.');
    }

    console.log(`Uploading ${fileName} to release ID: ${release.id}...`);

    const stat = fs.statSync(exePath);
    const stream = fs.createReadStream(exePath);

    // Note: undici fetch in recent node supports passing ReadStream as body for large files
    const res = await fetch(`${uploadUrl}?name=${encodeURIComponent(fileName)}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
            'Content-Length': stat.size.toString()
        },
        body: stream,
        duplex: 'half'
    });

    if (!res.ok) {
        console.error('Failed to upload', res.status, await res.text());
        process.exit(1);
    }

    console.log('Successfully uploaded EXE!');
}

upload().catch((err) => {
    console.error(err);
    process.exit(1);
});
