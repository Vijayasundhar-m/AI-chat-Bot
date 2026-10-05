# AI Chat Assistant

A simple chat app built with HTML, CSS and JavaScript. It talks to Google's Gemini API, supports voice input, and saves your chat history in the browser.

## Features
- **AI replies** using the Gemini API (the full conversation is sent each time so the AI keeps context)
- **Chat bubbles** rendered as a scrolling message list
- **Voice input** using the browser's Speech Recognition API (Chrome and Edge)
- **Chat history**: auto-save toggle, download as a text file, and clear

## Run it
1. Download or clone this repo.
2. Open `index.html` in Chrome or Edge.
3. Click **API key** and paste a free key from [Google AI Studio](https://aistudio.google.com/apikey).
4. Start chatting.

Your key is saved only in your own browser (`localStorage`). It is never written into the code, so it is safe to publish this repo. Never paste a key into the source files.

## Live demo with GitHub Pages (optional)
In your repo go to **Settings > Pages**, set the source to the `main` branch, and save. Your app will be live at `https://<your-username>.github.io/<repo-name>/`.

## Troubleshooting
| Message | Fix |
|---|---|
| Model no longer available | Change the `MODEL` name at the top of `script.js` |
| Quota exceeded | The free tier has a daily limit. Wait, or use a key from a new project |
| Access denied | Create a key in a new project, with a personal Google account |
| Mic does not work | Use Chrome or Edge and allow microphone access |

## Tech used
HTML5, CSS3 (Flexbox), JavaScript (DOM, fetch, async/await), localStorage, Web Speech API.
