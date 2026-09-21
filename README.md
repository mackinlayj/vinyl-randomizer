# Record Archive

A polished iPad-friendly web app for browsing your Discogs collection.

## Try it now

**[Open Record Archive](https://vinyl-randomizer.jacobmackinlay99.workers.dev)** — hosted on Cloudflare

The app is live and ready to use. Connect your Discogs account (using your username and personal token) to load your collection.

## Features

- **Library view**: Browse your full collection sorted by artist, with album art, genre, and year
- **Crate view**: Flip through records like a physical crate with:
  - Randomize order
  - Alphabetical sort
  - Genre filtering
  - Previous/next navigation
- **Randomizer**: Spin through your entire catalog with a big randomize button and persistent card display
- **Installable PWA**: Save to your iPad home screen for app-like experience

## Run locally

From the project folder, start a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Or using Node.js (if installed)
npx http-server
```

Then open in your browser:

- `http://localhost:8000`
- Or on your iPad, use your machine's LAN IP: `http://192.168.1.15:8000` (replace with your actual IP)

## Discogs setup

1. Open the app at `http://192.168.2.13:8000` on your iPad (or your computer's local IP)
2. Tap **Discogs setup**
3. Enter your Discogs username and personal access token
4. Tap **Save & load**

### Getting your token

Visit your Discogs account settings and create a personal access token in the developer section. Paste it into the app and your entire collection will load.

Alternatively, tap **Use demo data** to try the app with sample records.

## iPad home screen

1. Open the app in Safari
2. Tap the **Share** button
3. Select **Add to Home Screen**
4. The app now works like a native app from your home screen

The app stores your collection locally in the browser, so it persists even after closing Safari.

## Deployment

This project is deployed to **Cloudflare Workers**.

- **Live URL:** https://vinyl-randomizer.jacobmackinlay99.workers.dev
- **Build command:** (none — static files only)
- **Output directory:** `/` (project root)

To deploy your own version:
1. Fork this repository
2. Connect your GitHub account to Cloudflare Pages
3. Select this repo and confirm settings
4. Cloudflare will auto-deploy on every push
