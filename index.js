const fs = require('fs');
const readline = require('readline');
const {
  google
} = require('googleapis');
utils = require('./utils.js');


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

module.exports = {
  writeRankIntoSpreadSheet: () => {
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorize(JSON.parse(content), writeRankIntoSpreadSheet);
    });
  },

  readMatchPlayedSpreadSheet: () => {
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
        authorize(JSON.parse(content), readMatchPlayedSpreadSheet);
    });
  },

  clearMatchPlayedSpreadSheet: () => {
    matchPlayed = []
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      authorize(JSON.parse(content), clearMatchPlayedSpreadSheet);
    });
  }
}



/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, ...args) {
  const {
    client_secret,
    client_id,
    redirect_uris
  } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback, args);
    oAuth2Client.setCredentials(JSON.parse(token));
    return callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback, ...args) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client, args);
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1dtQu4lwiFIvgDLtpXjTipoJjkUMwNWbS2UE876jHFjI/edit?ts=5d89fbed#gid=0
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth) {
  const sheets = google.sheets({
    version: 'v4',
    auth
  });
  sheets.spreadsheets.values.get({
    spreadsheetId: '1dtQu4lwiFIvgDLtpXjTipoJjkUMwNWbS2UE876jHFjI',
    range: 'Class Data!A2:E',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      console.log('Name, Major:');
      // Print columns A and E, which correspond to indices 0 and 4.
      rows.map((row) => {
        console.log(`${row[0]}, ${row[4]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
}

function clearMatchPlayedSpreadSheet(auth, ...args) {
  const sheets = google.sheets({
    version: 'v4',
    auth
  });
  sheets.spreadsheets.values.clear({
    spreadsheetId: '1dtQu4lwiFIvgDLtpXjTipoJjkUMwNWbS2UE876jHFjI',
    range: 'Match jouées!A2:E',
  }, (err) => {
    if (err) return console.log('The API returned an error: ' + err);
  });
}

function readMatchPlayedSpreadSheet(auth, ...args) {
  matchPlayed = []
  const sheets = google.sheets({
    version: 'v4',
    auth
  });
  sheets.spreadsheets.values.get({
    spreadsheetId: '1dtQu4lwiFIvgDLtpXjTipoJjkUMwNWbS2UE876jHFjI',
    range: 'Match jouées!A2:E',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows && rows.length > 0) {
      matchPlayed = rows.map((row) => {
        score = row[3].split("-")
        return {
          "joueur_1": row[1],
          "joueur_2": row[2],
          "score_joueur_1": score[0],
          "score_joueur_2": score[1]
        }
      });
    } else {
      console.log("Aucun match jouées aujourdhui, veuillez remplir la page Match jouées");
    }
  });
}

function writeRankIntoSpreadSheet(auth, ...args) {
  values = player_ranks.map(x => {
    matchs_to_keep = utils.suppressionMatchMemeJoueur(x.matchs)
    return [x.rank, x.nom, x.points, matchs_to_keep.length >= 20 ? 20 : matchs_to_keep.length]
  })
  values.unshift(["Rang", "Joueur", "Points", "Match Jouées (20 dernier max, 3 par adversaire)"])

  resources = {
    'values': values
  }
  valueInputOption = "RAW"
  const sheets = google.sheets({
    version: 'v4',
    auth
  });
  sheets.spreadsheets.values
    .update({
      spreadsheetId: '1dtQu4lwiFIvgDLtpXjTipoJjkUMwNWbS2UE876jHFjI',
      range: 'Classement',
      valueInputOption: valueInputOption,
      resource: resources
    }, (err, result) => {
      if (err) {
        // Handle error
        console.log(err);
      } else {
        //console.log('%d cells updated.', result);
      }
    });

}