// server.js
// where your node app starts

// init project
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const path = require('path');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

// This is the middleware needed to parse the body of POST requests
// It makes the form data available in req.body
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// In-memory "database" to store the URLs
// In a real app, you'd use a proper database like MongoDB
const urlDatabase = {};
let shortUrlCounter = 1;

// POST endpoint to create a short URL
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;

  // We need to parse the hostname from the URL for the DNS lookup
  let hostname;
  try {
    // The URL constructor can parse the URL and throw an error if it's invalid
    const urlObject = new URL(originalUrl);
    hostname = urlObject.hostname;
  } catch (error) {
    // If the URL is malformed (e.g., missing protocol), it's invalid
    return res.json({ error: 'invalid url' });
  }

  // Use dns.lookup to verify the hostname is valid
  dns.lookup(hostname, (err, address) => {
    if (err || !address) {
      return res.json({ error: 'invalid url' });
    }

    // If the DNS lookup is successful, the URL is valid
    // We create the short URL, store it, and send the response
    const shortUrl = shortUrlCounter++;
    urlDatabase[shortUrl] = originalUrl;

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// GET endpoint to redirect to the original URL
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    // If we found the short URL in our database, redirect the user
    res.redirect(originalUrl);
  } else {
    // If not found, send an error
    res.json({ error: 'No short URL found for the given input' });
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

