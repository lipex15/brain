const token = process.env.GH_TOKEN;
const repo = 'lipex15/brain';
const version = require('./package.json').version;

if (!token) {
    console.error('GH_TOKEN is missing');
    process.exit(1);
}

const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github+json'
};

async function run() {
    const tag = `v${version}`;
    const payload = {
        tag_name: tag,
        target_commitish: 'main',
        name: tag,
        body: `deathStuffs ${tag}\n\n- Cria automaticamente assinaturas de Xbox Game Pass quando chega venda compatível da GGMAX ou GameMarket\n- Mantem a venda contando no faturamento normalmente, sem criar valor extra por causa da assinatura\n- Usa cliente, plataforma, pedido, link e data da venda para preencher a aba Assinaturas no padrao atual\n- Evita criar assinatura duplicada quando a mesma notificacao ou pedido ja foi processado\n- Marca assinaturas criadas pelo fluxo automatico com o selo Auto\n- Mantem eventos financeiros, entregas e fundos liberados fora da criacao de assinaturas`,
        draft: false,
        prerelease: false,
        make_latest: 'true'
    };

    const existingRes = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${tag}`, { headers });

    if (existingRes.ok) {
        const existing = await existingRes.json();
        const updateRes = await fetch(`https://api.github.com/repos/${repo}/releases/${existing.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(payload)
        });
        if (!updateRes.ok) {
            console.error('Failed to update release:', await updateRes.text());
            process.exit(1);
        }
        console.log(`Updated release ${tag} as a public non-draft release.`);
        return;
    }

    const createRes = await fetch(`https://api.github.com/repos/${repo}/releases`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    if (!createRes.ok) {
        console.error('Failed to create release:', await createRes.text());
        process.exit(1);
    }

    console.log(`Created release ${tag} as a public non-draft release.`);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
