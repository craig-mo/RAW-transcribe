# RAW Transcribe

Dead-simple interview practice recorder with verbatim transcription. Preserves filler words (um, uh), disfluencies, and timestamps — the stuff most tools strip out.

## Setup

1. Copy `config.example.js` to `config.js` and add your API keys:
   - [DeepGram](https://console.deepgram.com/) — sign up for a free API key
   - [AssemblyAI](https://www.assemblyai.com/dashboard/) — sign up for a free API key

2. Start the server (requires Node.js, no npm install needed):
   ```
   node server.js
   ```

3. Open http://localhost:3000 in your browser.

### One-click launch (Windows)

To avoid running `node server.js` by hand, run the one-time setup:

```
powershell -ExecutionPolicy Bypass -File setup.ps1
```

This generates app icons and puts two shortcuts on your Desktop:

- **RAW Transcribe** — starts the server silently and opens the app in your browser
- **Stop RAW Transcribe** — manual backup to stop the server (only the one on port 3000)

Right-click the **RAW Transcribe** shortcut → *Pin to taskbar* for one-click access.

The server **shuts itself down automatically** a few seconds after you close the
browser tab/window — so you normally never need the Stop shortcut. This works via
a keep-alive connection the page holds open (`/api/keepalive`); a short grace
period means reloading the page won't kill the server.

Re-run `setup.ps1` after cloning to a new machine or moving the folder — the
shortcuts point to absolute paths. The launcher itself is just a thin wrapper
around `node server.js` ([start-app.vbs](start-app.vbs)), so normal development
is unchanged: edit, refresh, done.

## Usage

1. Select a transcription model (DeepGram or AssemblyAI)
2. Toggle the options you want (filler words, timestamps, etc.)
3. Click **Record**, speak your interview answer, click **Stop**
4. Click **Transcribe** — wait for results
5. Click **Copy Text** to grab the transcript for your interview coach

## Project Structure
```
index.html          The entire app UI (single page, no framework)
server.js           Thin Node.js proxy for API calls (~130 lines, zero dependencies)
config.js           Your API keys (gitignored)
config.example.js   Template for config.js
start-app.vbs       Silent launcher: starts server + opens browser (Windows)
stop-app.vbs        Stops the background server on port 3000 (Windows)
setup.ps1           One-time: generates icons + Desktop shortcuts (Windows)
```

## No Dependencies

This project uses zero npm packages. The server uses only Node.js built-in modules (`http`, `https`, `fs`, `path`). The frontend is vanilla HTML/CSS/JS using the browser's native MediaRecorder API.
