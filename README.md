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
```

## No Dependencies

This project uses zero npm packages. The server uses only Node.js built-in modules (`http`, `https`, `fs`, `path`). The frontend is vanilla HTML/CSS/JS using the browser's native MediaRecorder API.
