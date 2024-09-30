const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const port = 3000;
const dataFilePath = path.join(__dirname, 'data.json');

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse incoming JSON requests
app.use(express.json());

// API endpoint to get the votes data
app.get('/votes', (req, res) => {
  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading data');
    } else {
      res.json(JSON.parse(data));
    }
  });
});

// API endpoint to save the votes data
app.post('/votes', (req, res) => {
  const newData = req.body;
  fs.writeFile(dataFilePath, JSON.stringify(newData, null, 2), 'utf8', (err) => {
    if (err) {
      res.status(500).send('Error saving data');
    } else {
      res.status(200).send('Votes and new items saved');
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
