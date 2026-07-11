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
        body: `deathStuffs ${tag}\n\n- Melhora o reconhecimento de vendas, perguntas, mediacoes e eventos das plataformas\n- Classifica fundos, saldo e saques da GameMarket como eventos financeiros sem inflar o faturamento\n- Limpa links e markdown dos cartoes e organiza produto, pedido, cliente e entrega\n- Envia alertas do WhatsApp com modelos proprios para cada tipo de evento\n- Soma o valor total de cada pedido uma unica vez, preservando compras com varias unidades\n- Corrige disparos duplicados no simulador interno`,
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
