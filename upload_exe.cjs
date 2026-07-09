const fs = require('fs');
const path = require('path');

const version = require('./package.json').version;
const exePath = path.join(__dirname, 'dist-electron', `deathStuffs Setup ${version}.exe`);
const blockmapPath = path.join(__dirname, 'dist-electron', `deathStuffs Setup ${version}.exe.blockmap`);

if (!fs.existsSync(exePath)) {
    console.error('Exe file not found at', exePath);
    process.exit(1);
}
if (!fs.existsSync(blockmapPath)) {
    console.error('Blockmap file not found at', blockmapPath);
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

async function uploadAsset(release, localPath, fileName, contentType) {
    const uploadUrl = release.upload_url.split('{')[0];
    const assetsRes = await fetch(release.assets_url, { headers });
    const assets = await assetsRes.json();
    const existingAssets = assets.filter(a => a.name === fileName);

    for (const existingAsset of existingAssets) {
        console.log(`Found existing asset ${existingAsset.id}. Deleting ${fileName}...`);
        const deleteRes = await fetch(existingAsset.url, { method: 'DELETE', headers });
        if (!deleteRes.ok) {
            console.error('Failed to delete existing asset', existingAsset.id, await deleteRes.text());
            process.exit(1);
        }
    }

    console.log(`Uploading ${fileName} to release ID: ${release.id}...`);
    const stat = fs.statSync(localPath);
    const stream = fs.createReadStream(localPath);

    const res = await fetch(`${uploadUrl}?name=${encodeURIComponent(fileName)}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': contentType,
            'Content-Length': stat.size.toString()
        },
        body: stream,
        duplex: 'half'
    });

    if (!res.ok) {
        console.error(`Failed to upload ${fileName}`, res.status, await res.text());
        process.exit(1);
    }

    console.log(`Successfully uploaded ${fileName}!`);
}

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
    await uploadAsset(release, exePath, `deathStuffs-Setup-${version}.exe`, 'application/octet-stream');
    await uploadAsset(release, blockmapPath, `deathStuffs-Setup-${version}.exe.blockmap`, 'application/octet-stream');
}

upload().catch((err) => {
    console.error(err);
    process.exit(1);
});
