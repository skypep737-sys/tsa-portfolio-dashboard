// Copy this file to config.js and edit values for your environment.
// Do NOT place a Smartsheet access token in a public GitHub Pages site.
window.TSA_CONFIG = {
  // Secure endpoint that returns Smartsheet rows. Example: a Cloudflare Worker URL.
  SMARTSHEET_PROXY_URL: "",
  // The Smartsheet sheet ID containing site surveys.
  SMARTSHEET_SHEET_ID: "6XJhpqVFMm4xmHPFfmXgjw345FwjCMPqqqcH6WF1",
  // Optional Smartsheet filter ID from the Grid View URL. The dashboard still enforces Rank = Green.
  SMARTSHEET_FILTER_ID: "5490424403939204",
  // Optional: if your proxy returns attachments, set true.
  LOAD_ROW_ATTACHMENTS: true,
  // Fallback map center: Southern California.
  MAP_CENTER: [34.0522, -118.2437],
  MAP_ZOOM: 7
};
