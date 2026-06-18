export default function handler(req, res) {
  const client_id = process.env.GITHUB_CLIENT_ID;

  if (!client_id) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(500).send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>CMS auth is not configured</title>
          <style>
            :root {
              color-scheme: light;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              color: #171717;
              background: #f7f7f8;
            }

            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              padding: 32px;
            }

            main {
              width: min(100%, 560px);
              border: 1px solid #dedee3;
              border-radius: 16px;
              background: #ffffff;
              box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
              padding: 28px;
            }

            .eyebrow {
              margin: 0 0 10px;
              color: #f15a24;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }

            h1 {
              margin: 0 0 12px;
              font-size: 24px;
              line-height: 1.2;
            }

            p {
              margin: 0 0 18px;
              color: #5f646d;
              line-height: 1.6;
            }

            code {
              border: 1px solid #e7e7eb;
              border-radius: 8px;
              background: #f7f7f8;
              padding: 2px 6px;
              color: #262a31;
              font-size: 13px;
            }

            ul {
              margin: 0;
              padding-left: 20px;
              color: #404650;
              line-height: 1.8;
            }
          </style>
        </head>
        <body>
          <main>
            <p class="eyebrow">Loc Digital CMS</p>
            <h1>GitHub login has not been configured yet.</h1>
            <p>
              Add the CMS OAuth variables on Vercel, then redeploy. GitHub OAuth callback URL:
              <code>https://loc.digital/api/callback</code>
            </p>
            <ul>
              <li><code>GITHUB_CLIENT_ID</code></li>
              <li><code>GITHUB_CLIENT_SECRET</code></li>
            </ul>
          </main>
        </body>
      </html>
    `);
    return;
  }

  const host = req.headers.host;
  const redirect_uri = `https://${host}/api/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent("repo,user")}`;
  
  res.writeHead(302, { Location: url });
  res.end();
}
