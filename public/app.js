class VotingApp {
  constructor(dataUrl) {
    this.data = {}; // Store the voting data (dictionary)
    this.dataUrl = dataUrl; // URL to fetch data (e.g., '/data.json')
    this.itemList = $('#item-list'); // Cache the item list container

    // Load initial data and render items
    this.loadData();
  }

  // Load data from the JSON file
  loadData() {
    fetch(this.dataUrl)
      .then(response => response.json())
      .then(data => {
        this.data = data; // Assign fetched data to the app's state
        this.renderAllItems();
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }

  // Render all items
  renderAllItems() {
    this.itemList.empty(); // Clear the list
    Object.entries(this.data).forEach(([text, item], index) => {
      this.renderItem({ text, ...item }, index);
    });
  }

  renderItem(item, index) {
    const itemElement = $('<div class="item"></div>');
  
    // Create the index span
    const indexSpan = $('<span class="index"></span>').text(`${index + 1}. `);
  
    // Create the text span with the "text" class for consistent width
    const textSpan = $('<span class="text"></span>').text(item.text);
  
    // Create a button group for the buttons and tallies
    const buttonGroup = $('<div class="button-group"></div>');
  
    // Upvote button and tally
    const upvoteButton = $('<button>Upvote</button>');
    const upvoteCount = $('<span class="upvote-count"></span>').text(item.upvotes);
  
    // Downvote button and tally
    const downvoteButton = $('<button>Downvote</button>');
    const downvoteCount = $('<span class="downvote-count"></span>').text(item.downvotes);
  
    // Delete button
    const deleteButton = $('<button class="delete-button">Delete</button>');
  
    // Attach event listeners to buttons
    upvoteButton.on('click', () => this.handleVote(item.text, 'upvote'));
    downvoteButton.on('click', () => this.handleVote(item.text, 'downvote'));
    deleteButton.on('click', () => this.handleDelete(item.text));
  
    // Append buttons and tallies to the button group
    buttonGroup.append(upvoteButton, upvoteCount, downvoteButton, downvoteCount, deleteButton);
  
    // Append index, text, and button group to the item
    itemElement.append(indexSpan, textSpan, buttonGroup);
  
    // Append the item element to the item list
    this.itemList.append(itemElement);
  }
  
  
  // Handle voting
  handleVote(itemText, type) {
    if (this.data.hasOwnProperty(itemText)) {
      if (type === 'upvote') {
        this.data[itemText].upvotes += 1;
      } else if (type === 'downvote') {
        this.data[itemText].downvotes += 1;
      }
      this.renderAllItems(); // Re-render items
      this.saveVotes(); // Save updated data
    }
  }

  // Handle item deletion
  handleDelete(itemText) {
    delete this.data[itemText]; // Remove the item
    this.renderAllItems(); // Re-render the updated list
    this.saveVotes(); // Persist updated data
  }

  // Add a new item
  addItem(newItemText) {
    newItemText = newItemText.trim().toUpperCase();
    if (!newItemText || this.data.hasOwnProperty(newItemText)) {
      alert("Duplicate entry or invalid input.");
      return;
    }
    this.data[newItemText] = { upvotes: 0, downvotes: 0 };
    this.renderAllItems();
    this.saveVotes();
  }

  // Save updated votes (can be to localStorage or server)
  saveVotes() {
    // Implement saving logic (e.g., to localStorage or POST request to server)
    console.log("Saving votes...", this.data);
  }
}

// Initialize the app
const app = new VotingApp('/data.json');

// Handle new item submission
$('#submit-item').on('click', function() {
  const newItemText = $('#new-item-text').val();
  app.addItem(newItemText);
});

