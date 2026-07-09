const fs = require('fs');

async function run() {
    const version = require('./package.json').version;
    const token = process.env.GH_TOKEN;
    if (!token) throw new Error("GH_TOKEN is missing");
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json'
    };

    console.log(`Getting Github release v${version}`);
    const res = await fetch(`https://api.github.com/repos/lipex15/brain/releases/tags/v${version}`, { headers });

    if (!res.ok) {
        console.error("Release not found", await res.text());
        process.exit(1);
    }

    const release = await res.json();
    const releaseId = release.id;
    console.log(`Found release ID: ${releaseId}, preparing latest.yml`);

    const file = fs.readFileSync('dist-electron/latest.yml');

    // Delete existing latest.yml assets if present
    const existingAssets = release.assets.filter(a => a.name === 'latest.yml');
    for (const existingAsset of existingAssets) {
        console.log(`Deleting old latest.yml asset ${existingAsset.id}`);
        await fetch(existingAsset.url, { method: 'DELETE', headers });
    }

    console.log("Uploading fresh latest.yml...");
    const uploadRes = await fetch(`https://uploads.github.com/repos/lipex15/brain/releases/${releaseId}/assets?name=latest.yml`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-yaml'
        },
        body: file
    });

    if (!uploadRes.ok) {
        console.error("Failed to upload latest.yml:", await uploadRes.text());
        process.exit(1);
    }

    const uploadData = await uploadRes.json();
    console.log("Uploaded successfully!", uploadData.name);

    const publishRes = await fetch(`https://api.github.com/repos/lipex15/brain/releases/${releaseId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ draft: false, prerelease: false, make_latest: 'true' })
    });
    if (!publishRes.ok) {
        console.error("Failed to mark release as public/latest:", await publishRes.text());
        process.exit(1);
    }
    console.log("Release confirmed public, non-draft, latest.");
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
