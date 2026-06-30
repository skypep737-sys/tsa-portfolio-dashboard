// Cloudflare Worker example for secure Smartsheet access.
// Set secrets: SMARTSHEET_TOKEN, optional SMARTSHEET_SHEET_ID, and optional SMARTSHEET_FILTER_ID.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const sheetId = url.searchParams.get('sheetId') || env.SMARTSHEET_SHEET_ID;
    const filterId = url.searchParams.get('filterId') || env.SMARTSHEET_FILTER_ID;
    if (!sheetId) return Response.json({ error: 'Missing sheetId' }, { status: 400 });
    const smartsheetUrl = new URL(`https://api.smartsheet.com/2.0/sheets/${sheetId}`);
    smartsheetUrl.searchParams.set('include', 'attachments');
    if (filterId) smartsheetUrl.searchParams.set('filterId', filterId);
    const sheetResp = await fetch(smartsheetUrl.toString(), {
      headers: { Authorization: `Bearer ${env.SMARTSHEET_TOKEN}` }
    });
    if (!sheetResp.ok) return new Response(await sheetResp.text(), { status: sheetResp.status });
    const sheet = await sheetResp.json();
    const columns = Object.fromEntries(sheet.columns.map(c => [String(c.id), c.title]));
    const rows = sheet.rows.map(row => ({
      id: row.id,
      attachments: row.attachments || [],
      cells: row.cells.map(cell => ({
        columnId: cell.columnId,
        columnName: columns[String(cell.columnId)],
        value: cell.value,
        displayValue: cell.displayValue
      }))
    }));
    return Response.json({ rows }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
};
