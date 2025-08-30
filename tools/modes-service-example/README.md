This is a tiny example Node/Express service that serves a JSON array of gamemodes at /modes.

Deploy to Render (or similar):
- Create a new Web Service on Render.
- Connect your repo or upload these files under a folder.
- Set PUBLIC_DOMAIN to your render app domain (without scheme). For example: gloobix-io.onrender.com
- Start command: npm start

Behavior:
- If PUBLIC_DOMAIN is set, the service will build wss URLs like wss://<mode-id>.<PUBLIC_DOMAIN><wsPath>
- Otherwise it will return ws://localhost:<hintPort><wsPath> so you can test locally.

Client usage:
- In the game's index.html you can set window.MODES_SERVICE_URL to your service URL, e.g. https://your-render-app.onrender.com/modes
- The client will prefer the remote list and will call connectToWsUrl/setserver when a mode is selected.

Production checklist & examples
--------------------------------
1) Deploy the service on Render
	 - Create a Web Service and point it to this folder (or the repo root with correct start command).
	 - Start command: npm start
	 - Env vars to set on Render:
		 - PUBLIC_DOMAIN = <your-public-domain-without-scheme> (e.g. gloobix-io.onrender.com)
			 This causes the service to build wss URLs like: wss://<mode-id>.<PUBLIC_DOMAIN><wsPath>
		 - MODE_API_KEY = <optional-secret> (if you want to restrict who can fetch /modes)
		 - MODELIST = <optional JSON> to override the list of modes

2) Expose the remote modes URL to the web client
	 Option A (recommended): edit `client/web/index.html` and set the global before other scripts run:
	 Example:
	 ```html
	 <script>
		 // Replace with your deployed service URL
		 window.MODES_SERVICE_URL = 'https://your-render-app.onrender.com/modes';
	 </script>
	 ```

	 Option B (server-side injection): if you serve the HTML from a server, inject that same line dynamically so you don't hardcode production URL in the repo.

3) If you enabled MODE_API_KEY, the client fetch must attach the key. Two approaches:
	 - Modify `client/web/assets/js/modes-client.js` to add a header `x-mode-api-key` when fetching the modes JSON.
	 - Or use a public endpoint with the API key embedded in the URL query (less secure).

	 Example curl to test protected /modes from terminal:
	 ```pwsh
	 Invoke-WebRequest -UseBasicParsing -Headers @{ 'x-mode-api-key' = 'MY_KEY' } 'https://your-render-app.onrender.com/modes'
	 ```

4) Testing the whole flow locally
	 - Start the modes service locally (from this folder):
		 ```pwsh
		 npm install
		 npm start
		 ```
	 - Serve the client webpage (for example using `npx http-server client/web` or similar)
	 - In the browser console run:
		 ```js
		 window.MODES_SERVICE_URL = 'http://localhost:5000/modes';
		 // then select a mode by id
		 window.selectModeById('classic');
		 ```

Notes and next steps
---------------------
- The small example is intentionally minimal. For production consider:
	- Enabling proper TLS/HTTPS at Render (Render provides certificates by default)
	- Adding logging, metrics and rate limiting
	- Using a small CDN or reverse-proxy to serve `client/web` and inject the `MODES_SERVICE_URL` dynamically

If quieres, puedo:
 - preparar la inyección automática del `MODES_SERVICE_URL` en `client/web/index.html` desde una variable de build o archivo de configuración;
 - modificar `modes-client.js` para incluir el header `x-mode-api-key` cuando `MODE_API_KEY` esté configurado y así soportar clientes protegidos.
