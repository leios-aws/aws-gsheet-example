const Promise = require('promise');
const config = require('config');
const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'config/token.json';

var authorize = function(oAuth2Client) {
    return new Promise((resolve, reject) => {
        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) {
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
                        if (err) {
                            console.error('Error retrieving access token', err);
                            reject(err);
                        }
                        oAuth2Client.setCredentials(token);
                        // Store the token to disk for later program executions
                        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                            if (err) {
                                console.error(err);
                                reject(err);
                            }
                            console.log('Token stored to', TOKEN_PATH);
                        });
            
                        resolve(oAuth2Client);
                    });
                });
            }
            oAuth2Client.setCredentials(JSON.parse(token));
            resolve(oAuth2Client);
        });
    
    });
}

exports.handler = function (event, context, callback) {
    const { client_secret, client_id, redirect_uris } = config.get('installed');
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    authorize(oAuth2Client).then((auth) => {
        const sheets = google.sheets({ version: 'v4', auth });

        sheets.spreadsheets.values.get({
            spreadsheetId: '1_HcGNs1XylAaEKu1NwIRGaPJn0wS42-v6OiVguhUO9M',
            range: '출근!A2:E',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            console.log(res);
        });
        if (callback) {
            callback(null, 'Success');
        }
    })
};
