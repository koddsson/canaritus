const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');

const app = express();
const db = new sqlite3.Database('canaritus.db');
db.run('CREATE TABLE IF NOT EXISTS ids (id TEXT, UNIQUE(id))');

const PORT = 3000;
const SERVER_KEY = process.env.SERVER_KEY;
const GCM_ENDPOINT = 'https://android.googleapis.com/gcm/send';

if (!SERVER_KEY) {
  console.log('SERVER_KEY env variable not set, will not be able to send push notification');
}

app.use(bodyParser.json());
app.use(express.static(__dirname + '/dist'));

app.post('/subscribe', (req, res) => {
  const id = req.body.id;
  if (!id) {
    res.status(400).send('id is missing from the post');
  } else {
    console.log(`Adding ${id} to ids table`);
    db.run(`INSERT OR IGNORE INTO 'ids' (id) VALUES('${id}')`, (err) => {
      if (err !== null) {
        console.log('Error adding id', err);
        res.sendStatus(500);
      } else {
        res.sendStatus(201);
      }
    });
  }
});

app.post('/unsubscribe', (req, res) => {
  const id = req.body.id;
  if (!id) {
    res.status(400).send('id is missing from the post');
  } else {
    console.log(`Removing ${id} from ids table`);
    db.run(`DELETE FROM ids WHERE id='${id}'`, (err) => {
      if (err !== null) {
        console.log('Error removing id', err);
        res.sendStatus(500);
      } else {
        res.sendStatus(204);
      }
    });
  }
});

app.get('/send_notification', (req, res) => {
  db.all('SELECT * FROM ids', (err, rows) => {
    if (err !== null) {
      res.status(500).send('Failed to select all rows?');
    } else {
      const ids = rows.map(x => x.id);
      fetch(GCM_ENDPOINT, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `key=${SERVER_KEY}`,
        },
        body: JSON.stringify({
          'registration_ids': ids,
        }),
      }).then((fRes) => {
        res.status(200).send(fRes);
      });
    }
  });
});

app.listen(PORT);
console.log(`Listening on port ${PORT}`);