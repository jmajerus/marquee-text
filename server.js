const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

const dataFilePath = 'data.json'; // This file will store your data

// Endpoint to get current vote data
app.get('/votes', (req, res) => {
  const data = fs.readFileSync(dataFilePath);
  res.json(JSON.parse(data));
});

// Endpoint to save votes and new items
app.post('/votes', (req, res) => {
  const newData = req.body;
  fs.writeFileSync(dataFilePath, JSON.stringify(newData, null, 2));
  res.status(200).send('Votes and items saved');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
