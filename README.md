# Buttons Generator — README

Generate styled `<button>` HTML from simple inputs using the OpenAI Responses API, and safely preview it in a React app.

## Prerequisites
- Node.js 18+
- OpenAI API key (with billing or free credits)
- Ports: UI on 3000, API on 8787 (both configurable)

## Install
(from project root)

    npm install

## Configure
Create a `.env` file in the project root with at least your API key. Example:

    OPENAI_API_KEY=sk-your-key
    # optional
    OPENAI_MODEL=gpt-4o-mini
    UI_ORIGIN=http://localhost:3000
    API_PORT=8787

Tip: you can also store the key in `.env.local`. The server loads `.env` by default.

## Run
Use two terminals.

Terminal A — API

    npm run server
    # expected:
    # OPENAI_API_KEY loaded: ...
    # API on :8787

Terminal B — UI

    npm start
    # opens http://localhost:3000

If the UI port changes (for example 3001), set `REACT_APP_API_BASE=http://localhost:8787` for the UI and restart it.

## Test different inputs in the UI
1) Exact color + big size  
   Color: `#E51BFC`  
   Size: `super huge`  
   Text: `LAUNCH`

2) Vague color + named size  
   Color: `very dark`  
   Size: `large`  
   Text: `Deploy`

3) Free-text style (overrides color and size)  
   Style: `glassmorphism with soft glow`  
   Text: `OK`  
   Leave Color and Size blank; they disable when Style has text.

4) Empty label (Permutations of empty text, color, and/or size will work) 
   Text: leave empty  
   Optional Style: `minimal`  
   The preview still shows a visible button. Padding and border are enforced even with no label.


The preview rebuilds a safe `<button>`: it preserves inline `style` and `data-*`, sets `type="button"`, and forces the label to match your Text exactly.

## Test via curl (optional)
Endpoint: POST http://localhost:8787/api/generate

Color and size path

    curl -s -X POST http://localhost:8787/api/generate \
      -H "Content-Type: application/json" \
      -d '{"component":"button","text":"LAUNCH","color":"very dark","size":"super huge"}' | python -m json.tool

Free-text style (color and size ignored)

    curl -s -X POST http://localhost:8787/api/generate \
      -H "Content-Type: application/json" \
      -d '{"component":"button","text":"OK","styleVariant":"brutalist high contrast"}' | python -m json.tool

Empty text

    curl -s -X POST http://localhost:8787/api/generate \
      -H "Content-Type: application/json" \
      -d '{"component":"button","text":""}' | python -m json.tool

Expected JSON shape

    {
      "ok": true,
      "html": "<button style=\"...\" type=\"button\">LAUNCH</button>",
      "usage": { "input_tokens": 123, "output_tokens": 45, "total_tokens": 168 }
    }


## Troubleshooting
- API key: server prints `OPENAI_API_KEY loaded: sk-...` on start. GET /health returns `ok`. GET /debug/env shows model and port.
- CORS: set `UI_ORIGIN=http://localhost:3000` in `.env` and restart the server.
- OpenAI SDK: needs `client.responses.create` and `resp.output_text`. If errors mention `responses`, update the package.

    ```
    npm uninstall openai
    npm i openai@latest
    ```

## Scripts
- Start API on 8787

    `npm run server`

- Start React dev server on 3000

    `npm start`
