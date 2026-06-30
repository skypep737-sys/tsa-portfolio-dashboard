# TSA Portfolio + Green Site Survey Dashboard

This package was generated from `TSA Master Portfolio (1).xlsx` and includes `94` master portfolio records.

## What it does

- Loads the master portfolio from `data/master_locations.json`.
- Loads live site-survey rows from Smartsheet through a secure proxy.
- Filters surveys to only rows where the `Rank` column equals `Green`.
- Displays Green survey sites as photo cards.
- Shows a portfolio list, deal table, and map layers for portfolio and survey sites.

## Important security note

Do not put a Smartsheet API token in `config.js` if you host this on GitHub Pages. Use the included `smartsheet-proxy-cloudflare-worker.js` and store the token as a Worker secret named `SMARTSHEET_TOKEN`.

## Live Smartsheet source

- Sheet ID: `6XJhpqVFMm4xmHPFfmXgjw345FwjCMPqqqcH6WF1`
- View: `Grid`
- Filter ID: `5490424403939204`
- Dashboard-enforced rule: include only rows where `Rank` equals `Green`


## Smartsheet survey column mapping

The live survey card view is now mapped to these exact Smartsheet headers:

- `Address`
- `City`
- `Available SQFT`
- `Base Rent`
- `Opx`
- `Site Notes`
- `Photo Link`
- `Flyer Link`

The dashboard still requires a `Rank` column and only displays rows where `Rank` equals `Green`.

## GitHub Pages deployment

Keep the static dashboard files in GitHub Pages. Do not store the Smartsheet API token in GitHub. Use the included Cloudflare Worker as the secure proxy and set `SMARTSHEET_TOKEN` as a Cloudflare Worker secret. Then place the Worker URL in `config.js` as `SMARTSHEET_PROXY_URL`.

## Setup

1. Deploy `smartsheet-proxy-cloudflare-worker.js` to Cloudflare Workers, Vercel, Netlify, or a small server.
2. Set secret/environment variable `SMARTSHEET_TOKEN` to your Smartsheet token.
3. Set `SMARTSHEET_SHEET_ID` and optional `SMARTSHEET_FILTER_ID` as Worker environment variables, or leave the provided values in `config.js`.
4. Edit `config.js`:

```js
window.TSA_CONFIG = {
  SMARTSHEET_PROXY_URL: "https://your-worker.your-domain.workers.dev",
  SMARTSHEET_SHEET_ID: "6XJhpqVFMm4xmHPFfmXgjw345FwjCMPqqqcH6WF1",
  SMARTSHEET_FILTER_ID: "5490424403939204",
  LOAD_ROW_ATTACHMENTS: true,
  MAP_CENTER: [34.0522, -118.2437],
  MAP_ZOOM: 7
};
```

## Coordinate requirement

The uploaded master workbook did not show latitude/longitude columns. Map markers require columns named `Latitude`/`Longitude`, `Lat`/`Lng`, or similar. Without coordinates, records still appear in cards/tables but not as map markers.

## Photo card behavior

Survey photo cards use the first available URL from the `Photo Link` column, falling back to common photo/image columns or row attachments returned by the proxy. Each card also renders a `Flyer Link` button when present.
