export default async function handler(req, res) {
  const code = req.query.code;
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(500).send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>CMS auth is not configured</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              padding: 32px;
              background: #f7f7f8;
              color: #171717;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            main {
              width: min(100%, 560px);
              border: 1px solid #dedee3;
              border-radius: 16px;
              background: #ffffff;
              box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
              padding: 28px;
            }

            p {
              margin: 0 0 18px;
              color: #5f646d;
              line-height: 1.6;
            }

            strong {
              color: #171717;
            }

            code {
              border: 1px solid #e7e7eb;
              border-radius: 8px;
              background: #f7f7f8;
              padding: 2px 6px;
              color: #262a31;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <main>
            <p><strong>Loc Digital CMS auth is missing Vercel environment variables.</strong></p>
            <p>Add <code>GITHUB_CLIENT_ID</code> and <code>GITHUB_CLIENT_SECRET</code>, then redeploy.</p>
          </main>
        </body>
      </html>
    `);
    return;
  }

  if (!code) {
    res.status(400).send("Error: Missing authorization code from GitHub callback.");
    return;
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
        redirect_uri: `https://${req.headers.host}/api/callback`,
      }),
    });

    const data = await response.json();

    if (data.error) {
      res.status(400).send(`Error: ${data.error_description || data.error}`);
      return;
    }

    const token = data.access_token;

    // Send token back to Decap CMS via postMessage and close the login popup
    const content = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Authorizing...</title>
      </head>
      <body>
        <p>Completing authentication, please wait...</p>
        <script>
          const sendMessage = (status, data) => {
            window.opener.postMessage(
              \`authorization:github:\${status}:\${JSON.stringify(data)}\`,
              "*"
            );
          };
          sendMessage("success", { token: "${token}", provider: "github" });
        </script>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(content);
  } catch (error) {
    res.status(500).send(`Authentication error: ${error.message}`);
  }
}
