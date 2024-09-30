const dataUrl = '/votes'; // Fetch from the backend

// Load the initial data
fetch(dataUrl).then(response => response.json()).then(data => {
  renderItems(data);

  // Handle new item submission
  document.getElementById("submit-item").addEventListener("click", () => {
    const newItemText = document.getElementById("new-item-text").value;
    if (newItemText) {
      const newItem = { text: newItemText, upvotes: 0, downvotes: 0 };
      data.push(newItem);
      renderItem(newItem, data.length - 1, data); // Render immediately
      saveVotes(data); // Persist the new item and updated votes
    }
  });
});

// Render all items
function renderItems(data) {
  const container = d3.select("#item-list");
  container.selectAll('*').remove(); // Clear previous items
  
  data.forEach((item, index) => {
    renderItem(item, index, data);
  });
}

// Render a single item
function renderItem(item, index, data) {
  const container = d3.select("#item-list");

  const itemContainer = container.append("div").attr("class", "item");

  // Display the text line item
  itemContainer.append("span").text(item.text);

  // Display upvote and downvote buttons
  itemContainer.append("button")
    .text("Upvote")
    .on("click", () => handleVote(index, 'upvote', data));

  itemContainer.append("button")
    .text("Downvote")
    .on("click", () => handleVote(index, 'downvote', data));

  // Display current vote counts
  itemContainer.append("span")
    .attr("id", `upvotes-${index}`)
    .text(` Upvotes: ${item.upvotes}`);

  itemContainer.append("span")
    .attr("id", `downvotes-${index}`)
    .text(` Downvotes: ${item.downvotes}`);
}

// Handle vote clicks
function handleVote(index, type, data) {
  if (type === 'upvote') {
    data[index].upvotes += 1;
  } else if (type === 'downvote') {
    data[index].downvotes += 1;
  }

  // Update the displayed vote counts
  d3.select(`#upvotes-${index}`).text(` Upvotes: ${data[index].upvotes}`);
  d3.select(`#downvotes-${index}`).text(` Downvotes: ${data[index].downvotes}`);

  // Send the updated data to the server
  saveVotes(data);
}

// Function to send updated votes and new items to the backend
function saveVotes(data) {
  fetch('/votes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(response => {
    if (response.ok) {
      console.log('Votes and new items saved');
    } else {
      console.error('Error saving votes or new items');
    }
  });
}
