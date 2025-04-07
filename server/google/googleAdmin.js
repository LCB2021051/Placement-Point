const { google } = require("googleapis");
const path = require("path");

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "./googleServiceAccount.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

async function readSheet(spreadsheetId, range) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return res.data.values;
}

module.exports = readSheet;
