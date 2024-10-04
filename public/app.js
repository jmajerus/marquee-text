class VotingApp {
  constructor(dataUrl, topicUrl) {
    this.data = {};  
    this.dataUrl = dataUrl;
    this.topicUrl = topicUrl;
    this.topics = [];  // To store the list of topics
    this.currentTopic = 'all';  // Default to show all items
    this.itemList = $('#item-list');
    this.changeLog = {};  // To track changes (additions, modifications)
    this.changes = {
      votes: [],     // To track votes
      topicChanges: [],  // To track topic changes
      deletions: [],  // To track deleted items
      newItems: []  // New field to track new item submissions
    };
    this.init();

    // Save data to the server before the user leaves the page
    window.addEventListener('beforeunload', () => this.saveChangesToServer());
      // Optionally call renderItems again after everything has loaded
    window.addEventListener('load', () => {
      this.renderItems();
    });
  }

  // Initialize the app (separate function for clarity)
  init() {
    // Load initial data and render items
    this.loadTopics();
    this.loadLocalData();

    // Attach event listeners for voting and deleting
    this.attachEventHandlers();
      // Handle new topic addition
    this.initializeAddTopicButton();
  }

  loadLocalData() {
    // Load the full appData from localStorage if available
    const localData = localStorage.getItem('appData');
    if (localData) {
      this.data = JSON.parse(localData);
    } else {
      this.loadDataFromServer();  // Pull data from server if no local copy exists
    }
  
    // Load the saved changeSet from localStorage (if any)
    const savedChanges = localStorage.getItem('changeSet');
    if (savedChanges) {
      this.changeSet = JSON.parse(savedChanges);
    } else {
      this.resetChangeSet();
    }
  
    // Save the full appData and changeSet to localStorage on page unload
    window.addEventListener('beforeunload', () => {
      const currentData = JSON.stringify(this.data);
      localStorage.setItem('appData', currentData);  // Save appData
  
      const currentChangeSet = JSON.stringify(this.changeSet);
      localStorage.setItem('changeSet', currentChangeSet);  // Save changeSet
    });
  }
  
  // Helper function to reset the changeSet
  resetChangeSet() {
    this.changeSet = {
      votes: [],
      topicChanges: [],
      deletions: [],
      newItems: []
    };
  }
  
  loadTopics() {
    this.topics = [];  // Clear the local topics array
    // Load topics from topics.json and populate the combo box
    console.log('Fetching topics from:', this.topicUrl);
    fetch(this.topicUrl)
    .then(response => response.json())
    .then(data => {
      this.populateTopicSelector(data.topics);  // Populate the dropdown with fetched topics
    });

    // Filter messages by selected topic
    document.getElementById('topic-filter').addEventListener('change', (event) => {
      const selectedTopic = event.target.value;
      this.currentTopic = selectedTopic;
      this.renderItems();
    });
  }

  // Populate the topic dropdown with the fetched topics
  populateTopicSelector(topics) {
    console.log('Populating topic selector with:', topics);
    this.topics = [];  // clear the local topics array
    const select = document.getElementById('topic-filter');
    select.replaceChildren();  // Clear the existing options
    topics.forEach(topic => {
      const option = document.createElement('option');
      option.value = topic;
      option.textContent = topic;
      select.appendChild(option);
      this.topics.push(topic);
    });
  }

  loadDataFromServer() {
    // Fetch the data from the server
    console.log('Fetching data from:', this.dataUrl);
    fetch(this.dataUrl)
      .then(response => response.json())
      .then(data => {
        if (typeof data === 'object' && !Array.isArray(data)) {
          this.data = data;
        } else {
          console.error('Fetched data is not an object:', data);
          this.data = {}; // Fallback to an empty dictionary
        }
        this.renderAllItems();
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }

  renderItems() {
    if (this.currentTopic === 'all') {
      this.renderAllItems();
    } else {  // Render only items in the selected topic
      this.renderFilteredItems(this.currentTopic);
    };
  }
  
  insertHeaderRow(topicKey) {
      // Create topic header with delete button
      const isTopicEmpty = !this.data[topicKey] || Object.keys(this.data[topicKey]).length === 0;
      const $headerRow = $('<div class="topic-header"></div>').text(topicKey);
      if (isTopicEmpty) {
        const $deleteButton = $('<button class="delete-topic">x</button>');
        $deleteButton.on('click', () => this.deleteTopic(topicKey));
        $headerRow.append($deleteButton);  // Add delete button to header
      }
      return $headerRow;
  }

  renderAllItems() {
    const $itemList = $('#item-list');
    $itemList.empty();  // Clear the current list
  
    // Loop through each topic
    Object.keys(this.data).forEach((topicKey) => {
      const $headerRow = this.insertHeaderRow(topicKey);
      $itemList.append($headerRow);  // Append the header row to the list
  
      // Render the items for the topic (if any)
      Object.keys(this.data[topicKey]).forEach((itemText, index) => {
        const item = this.data[topicKey][itemText];
        this.renderItem(item, itemText, topicKey, index);
        // Add the topic dropdown next to the item
        this.addTopicDropdown($itemList.children().last(), itemText, topicKey);
      });
    });
  }
  
  renderFilteredItems(topic) {
    const $itemList = $('#item-list');
    $itemList.empty();  // Clear the current list
    const $headerRow = this.insertHeaderRow(topic);
    $itemList.append($headerRow);  // Append the header row to the list
  
    // Render only items in the selected topic
    if (this.data[topic]) {
      Object.keys(this.data[topic]).forEach((itemText, index) => {
        const item = this.data[topic][itemText];
        // Render the core item (separation of concerns here)
        this.renderItem(item, itemText, topic, index);
      });
    }
  }
  
  renderItem(item, itemText, topicKey, index) {
    const deletedData = JSON.parse(localStorage.getItem('deletedData')) || [];
  
    const itemElement = $('<div class="item"></div>')
    .attr('data-topic', topicKey);  // Store the topic as a data attribute
  
    const indexSpan = $('<span class="index"></span>').text(`${index + 1}. `);
    const textSpan = $('<span class="text"></span>').text(itemText);
  
    // Apply strikethrough if item is marked as deleted
    if (deletedData.includes(itemText)) {
      textSpan.addClass('strikethrough');
    }
  
    const buttonGroup = $('<div class="button-group"></div>');
    const upvoteButton = $('<button class="upvote">Upvote</button>');
    const upvoteCount = $('<span class="upvote-count"></span>').text(item.upvotes);
    const downvoteButton = $('<button class="downvote">Downvote</button>');
    const downvoteCount = $('<span class="downvote-count"></span>').text(item.downvotes);
    const deleteButton = $('<button class="delete-button">Delete</button>');
  
    buttonGroup.append(upvoteButton, upvoteCount, downvoteButton, downvoteCount, deleteButton);
    itemElement.append(indexSpan, textSpan, buttonGroup);
  
    // Append the item element to the list
    this.itemList.append(itemElement);
  }

  // Add the topic dropdown separately, only when needed
  addTopicDropdown(itemElement, itemText, topicKey) {
    const $topicSelect = $('<select>');
    
    // Loop through the pre-fetched topics and add them to the dropdown
    this.topics.forEach(topic => {
      const $option = $('<option>').val(topic).text(topic);
      $topicSelect.append($option);
    });

    // Set the current topic as the selected value using .val()
    $topicSelect.val(topicKey);  // This is the correct way to set the value

    // Add event listener for topic change
    // Use an arrow function to maintain the correct `this` context
    $topicSelect.on('change', (event) => {
      const newTopic = $(event.target).val();
      this.handleTopicChange(itemText, topicKey, newTopic);  // Use `this` here
    });

    // Append the dropdown to the rendered item
    itemElement.append($topicSelect);
  }


  // Example function to change the topic of an item
  handleTopicChange(itemText, oldTopic, newTopic) {
    console.log('Changing topic for:', itemText, oldTopic, newTopic);
    const updatedData = this.data[oldTopic][itemText];
  
    // Initialize the new topic if it doesn't exist
    if (!this.data[newTopic]) {
      this.data[newTopic] = {};  // Create a new object for the new topic
    }
  
    // Move the item to the new topic
    this.data[newTopic][itemText] = updatedData;
  
    // Remove the item from the old topic
    delete this.data[oldTopic][itemText];
  
    // Track the topic change using trackTopicChange
    this.trackTopicChange(itemText, oldTopic, newTopic);
  
    // Rerender to reflect the change
    this.renderItems();
  }

    // Handle new item submission
  handleNewItemSubmission(itemText, topic) {
    // Track the new item locally
    this.changes.newItems.push({ itemText, topic, upvotes: 0, downvotes: 0 });

    // Optionally render the item immediately in the UI
    const newItem = { upvotes: 0, downvotes: 0 };
    this.data[topic][itemText] = newItem;  // Add it to the in-memory data
    this.renderItems();  // Rerender the list to show the new item
  }

  // Handle delete functionality (mark as deleted)
  handleDelete(topic, itemText) {
    console.log('Handling delete for:', topic, itemText);
    let deletedData = JSON.parse(localStorage.getItem('deletedData')) || [];
    if (!deletedData.includes(itemText)) {
      deletedData.push(itemText);
    }
    localStorage.setItem('deletedData', JSON.stringify(deletedData));
    this.trackDeletion(itemText, topic);  // Track the deletion
    this.renderItems(); // Rerender to remove the item
  }

   // Handle topic deletion
   deleteTopic(topicKey) {
    if (!this.data[topicKey] || Object.keys(this.data[topicKey]).length === 0) {
      fetch('/topics/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topic: topicKey })
      })
      .then(response => response.json())
      .then(updatedTopics => {
        this.populateTopicSelector(updatedTopics.topics);  // Update the dropdown with the new topics
        this.currentTopic = 'all';  // Reset the current topic to 'all'
        this.renderItems();  // Re-render the UI
      })
      .catch(error => {
        console.error('Error deleting topic:', error);
      });
    } else {
      alert('Topic is not empty!');
    }
  }

  // Scroll to the bottom of the list after adding a new item
  scrollToBottom() {
    setTimeout(() => {
      this.itemList.scrollTop(this.itemList[0].scrollHeight);
    }, 100); // Add a slight delay to ensure the DOM is updated
  }
     

  // Save the data (this function can be updated to save to local storage or server)
  saveData() {
    fetch('/save-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.data) // Send the updated data to the server
    })
    .then(response => response.json())
    .then(result => {
      console.log('Data saved successfully:', result);
    })
    .catch(error => {
      console.error('Error saving data:', error);
    });
  }

    // Example when a vote is made:
  trackVote(itemText, topic, voteType) {
    this.changes.votes.push({ itemText, topic, voteType });
  }

  // Example when a topic is changed:
  trackTopicChange(itemText, oldTopic, newTopic) {
    this.changes.topicChanges.push({ itemText, oldTopic, newTopic });
  }

  // Example when an item is deleted:
  trackDeletion(itemText, topic) {
    this.changes.deletions.push({ itemText, topic });
  }
  
  // Track changes to data (additions, modifications)
  trackChange(itemText, updatedData, oldTopic = null, newTopic = null) {
    console.log(`Tracking change for item: ${itemText} from ${oldTopic} to ${newTopic}`);
    let localData = JSON.parse(localStorage.getItem('votingData')) || {};
  
    if (oldTopic && newTopic) {
      // Handle topic change by moving the item to the new topic
      if (!localData[newTopic]) {
        localData[newTopic] = {};
      }
      localData[newTopic][itemText] = updatedData;
      
      // Remove the item from the old topic
      if (localData[oldTopic]) {
        delete localData[oldTopic][itemText];
      }
    } else {
      // Normal upvote/downvote or other data changes
      localData[itemText] = updatedData;
    }
  
    // Save the updated data back to localStorage
    localStorage.setItem('votingData', JSON.stringify(localData));
  }

  // Save changes to the server
  publishChanges() {
    $.ajax({
      url: '/publish',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(this.changeSet),  // Always send the changeSet, even if empty
      success: (response) => {
        alert('Changes successfully published to the server!');
        
        // Clear the changeSet after successful publish
        this.resetChangeSet();
        localStorage.setItem('changeSet', JSON.stringify(this.changeSet));  // Clear local changeSet
  
        // Fetch updated appData from the server
        this.loadDataFromServer();  // Sync with other users' changes
      },
      error: (error) => {
        alert('Error publishing changes to the server: ' + error.responseText);
      }
    });
  }

  // Add a new item and track the change
  addItem(newItemText) {
    newItemText = newItemText.trim().toUpperCase();
    if (newItemText && !this.data[this.currentTopic][newItemText]) {
      const newItem = { upvotes: 0, downvotes: 0 };
      this.data[this.currentTopic][newItemText] = newItem;
      this.renderItem(newItem, newItemText, Object.keys(this.data).length - 1);
      this.scrollToBottom();

      this.trackChange(newItemText, newItem);  // Track the addition as a change
    } else {
      alert('Duplicate or invalid entry.');
    }
  }

  // Handle upvote functionality
  handleUpvote(topic, itemText) {
    console.log('Handling upvote for:', topic, itemText);
    // Increment upvotes directly on the data
    this.data[topic][itemText].upvotes += 1;
    // Track the change (which should handle saving to localStorage)
    this.trackVote(itemText, topic, 'upvote');
    // Re-render the items
    this.renderItems();
  }

  // Handle downvote functionality
  handleDownvote(topic, itemText) {
    console.log('Handling downvote for:', topic, itemText);
    this.data[topic][itemText].downvotes += 1;
    this.trackVote(itemText, topic, 'downvote');
    this.renderItems(); // Rerender to update the counts
  }



  // Attach event handlers for upvote, downvote, and delete buttons
  attachEventHandlers() {
    console.log('Attaching event handlers');
    const self = this; // Save reference to the VotingApp instance

    // Event delegation for handling button clicks
    this.itemList.on('click', '.upvote', function() {
      const itemElement = $(this).closest('.item');  // Reuse this
      const itemText = itemElement.find('.text').text();  // Get the text of the item
      const topic = itemElement.data('topic');  // Get the topic from data-topic attribute
      self.handleUpvote(topic, itemText);  // Call the upvote handler
    });

    this.itemList.on('click', '.downvote', function() {
      const itemElement = $(this).closest('.item');  // Reuse this
      const itemText = itemElement.find('.text').text();  // Get the text of the item
      const topic = itemElement.data('topic');  // Get the topic from data-topic attribute
      self.handleDownvote(topic, itemText);  // Call the downvote handler
    });

    this.itemList.on('click', '.delete-button', function() {
      const itemElement = $(this).closest('.item');  // Reuse this
      const itemText = itemElement.find('.text').text();  // Get the text of the item
      const topic = itemElement.data('topic');  // Get the topic from data-topic attribute
      self.handleDelete(topic, itemText);  // Call the delete handler
    });
  }

  initializeAddTopicButton() {
    console.log('Initializing add topic button');
    $('#add-topic-button').on('click', () => {
      const newTopic = $('#new-topic-input').val().trim();
      console.log('Adding new topic:', newTopic);
      if (newTopic && !this.topics.includes(newTopic)) {
        fetch('/topics/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ topic: newTopic })
        })
        .then(response => response.json())
        .then(updatedTopics => {
          this.populateTopicSelector(updatedTopics.topics);  // Update the dropdown with the new topics
          this.renderItems();  // Re-render the UI
        })
        .catch(error => {
          console.error('Error adding topic:', error);
        });
      } else {
        alert('Topic already exists or is invalid.');
      }
      $('#new-topic-input').val('');  // Clear input field
    });
  }
  
};

// Initialize the app with a URL for the data (adjust URL as needed)
const app = new VotingApp('/data', '/topics');

// jQuery event listener for adding a new item
$('#submit-item').on('click', function() {
  const newItemText = $('#new-item-text').val();
  app.addItem(newItemText);

  // Clear the input field after adding the new item
  $('#new-item-text').val('');
});

// jQuery event listener for publishing changes
$('#publish-changes').on('click', function() {
  app.publishChanges();
});



