const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;
const dataFilePath = path.join(__dirname, "./public/data.json");
const topicsFilePath = path.join(__dirname, "./public/topics.json");

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Serve static files (your frontend)
app.use(express.static("public"));

// Endpoint to get the current topics
app.get("/topics", (req, res) => {
  fs.readFile(topicsFilePath, "utf-8", (err, topics) => {
    if (err) {
      console.error("Error serving topics.json:", err);
      return res.status(500).json({ error: "Could not read topic file" });
    }
    console.log("Topics served:", JSON.parse(topics));
    res.json(JSON.parse(topics));
  });
});

app.post('/topics/add', (req, res) => {
  const newTopic = req.body.topic;
  
  // Load the topics.json file
  fs.readFile(topicsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading topics.json:', err);  // Log detailed error to console
      return res.status(500).send('Error reading topics.json');  // Send plain text error
    }

    let topicsData;
    try {
      topicsData = JSON.parse(data);  // Try parsing the file contents as JSON
    } catch (parseError) {
      console.error('Error parsing topics.json:', parseError);  // Log detailed parsing error
      return res.status(500).send('Error parsing topics.json');  // Send plain text error
    }

    // Add the new topic if it doesn't exist
    if (!topicsData.topics.includes(newTopic)) {
      topicsData.topics.push(newTopic);

      // Save the updated topics.json
      fs.writeFile(topicsFilePath, JSON.stringify(topicsData, null, 2), (err) => {
        if (err) {
          console.error('Error writing to topics.json:', err);  // Log detailed error to console
          return res.status(500).send('Error writing to topics.json');  // Send plain text error
        }
        res.status(200).json(topicsData);  // Send back updated topics as JSON
      });
    } else {
      res.status(400).send('Topic already exists');
    }
  });
});


app.delete('/topics/delete', (req, res) => {
  const topicToDelete = req.body.topic;

  // Load the topics.json file
  fs.readFile(topicsFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading topics.json');
    }

    const topicsData = JSON.parse(data);

    // Remove the topic if it's in the list
    const index = topicsData.topics.indexOf(topicToDelete);
    if (index !== -1) {
      topicsData.topics.splice(index, 1);

      // Save the updated topics.json
      fs.writeFile(topicsFilePath, JSON.stringify(topicsData, null, 2), (err) => {
        if (err) {
          return res.status(500).send('Error writing to topics.json');
        }
        res.status(200).json(topicsData);  // Send back updated topics
      });
    } else {
      res.status(400).send('Topic not found');
    }
  });
});

// Endpoint to get the current data
app.get("/data", (req, res) => {
  fs.readFile(dataFilePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error serving data.json:", err);
      return res.status(500).json({ error: "Could not read data file" });
    }
    console.log("Data served:", JSON.parse(data));
    res.json(JSON.parse(data));
  });
});

app.post('/publish', (req, res) => {
  const changes = req.body;

  if (Object.keys(changes).length === 0) {
    // If the changeSet is empty, just return success without doing anything
    return res.status(200).send('No changes to apply.');
  }

  // Read the current data.json file
  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading data.json:', err);
      return res.status(500).send('Error reading data.');
    }

    // Parse the current data
    let jsonData = JSON.parse(data);

    // Apply the votes
    changes.votes.forEach(change => {
      const { itemText, topic, voteType } = change;
      if (jsonData[topic] && jsonData[topic][itemText]) {
        if (voteType === 'upvote') {
          jsonData[topic][itemText].upvotes += 1;
        } else if (voteType === 'downvote') {
          jsonData[topic][itemText].downvotes += 1;
        }
      }
    });

    // Apply the topic changes
    changes.topicChanges.forEach(change => {
      const { itemText, oldTopic, newTopic } = change;
      if (jsonData[oldTopic] && jsonData[oldTopic][itemText]) {
        // Move item to new topic
        if (!jsonData[newTopic]) {
          jsonData[newTopic] = {};
        }
        jsonData[newTopic][itemText] = jsonData[oldTopic][itemText];
        delete jsonData[oldTopic][itemText];
      }
    });

    // Apply the deletions
    changes.deletions.forEach(change => {
      const { itemText, topic } = change;
      if (jsonData[topic] && jsonData[topic][itemText]) {
        delete jsonData[topic][itemText];
      }
    });

    // Process new item submissions
    changes.newItems.forEach(newItem => {
      const { itemText, topic, upvotes, downvotes } = newItem;
      if (!jsonData[topic]) {
        jsonData[topic] = {};
      }
      jsonData[topic][itemText] = { upvotes, downvotes };  // Add the new item to the data
    });

    // Write the updated data back to data.json
    fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error('Error writing to data.json:', err);
        return res.status(500).send('Error saving data.');
      }
      res.status(200).send('Data successfully published.');
    });
  });
});

// Endpoint to save changes and apply them to data.json
app.post("/save-data", (req, res) => {
  const { changes, deletions } = req.body; // Receive changes and deletions from the client

  // Read the current data from data.json
  fs.readFile(dataFilePath, "utf-8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Could not read data file" });
    }

    let jsonData = JSON.parse(data); // Parse the existing data

    if (changes === null || changes === undefined) {
      console.error("No changes provided");
      return res.status(400).json({ error: "No changes provided" });
    } else if (typeof changes == "object") {
      // Apply changes to the data
      Object.keys(changes).forEach((key) => {
        jsonData[key] = changes[key]; // Add or update each changed item
      });

      // Apply deletions to the data
      if (deletions && Array.isArray(deletions)) {
        deletions.forEach((key) => {
          delete jsonData[key]; // Remove each deleted item
        });
      }

      // Write the updated data back to data.json
      fs.writeFile(
        dataFilePath,
        JSON.stringify(jsonData, null, 2),
        "utf-8",
        (err) => {
          if (err) {
            return res.status(500).json({ error: "Could not save data" });
          }
          res.json({ message: "Data saved successfully", data: jsonData });
        }
      );
    }
  });
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// This server code reads the data.json file, updates it with changes from the client, and saves the changes back to the file. The client-side code sends changes and deletions to the server, which are then applied to the data.json file. This allows the client to persist changes and deletions across sessions.
