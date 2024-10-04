# Voting App

## Overview

This application is a simple voting and item management system where users can upvote, downvote, add, or delete text-based items. The app is designed with performance and network efficiency in mind, ensuring that only necessary data is sent to the server, thereby reducing network traffic and I/O operations. It uses a delta-based approach to save only the changes made to the data, which improves scalability as the number of items grows.

## Features

- **Upvote/Downvote**: Users can upvote or downvote individual items.
- **Add/Delete Items**: New items can be added, and existing items can be deleted.
- **Real-Time Updates**: Data is updated dynamically, and the changes are reflected immediately in the user interface.
- **Delta-Based Data Saving**: Only modified or new data is sent to the server, minimizing network traffic.
- **Local Storage**: Uses `localStorage` to temporarily save data on the client-side, ensuring data persistence even if the server is unavailable or the browser is closed.
- **Efficient Server-Side Data Management**: The server merges changes and deletions into the existing dataset (`data.json`), ensuring that only necessary updates are applied.

## Design Considerations

### 1. **Delta-Based Data Updates**
   - The app minimizes data transmission by sending only the modified or newly added items to the server, rather than the entire dataset. This is implemented using a dictionary-based data structure, which allows efficient tracking and updating of items by their unique keys.
   
### 2. **Network Traffic Efficiency**
   - By sending only the changes (deltas) and deletions, the app reduces the overall volume of data being transmitted to the server. This design is particularly important as the dataset grows, ensuring that network performance remains optimal even with thousands of items.
   
### 3. **Dictionary-Based JSON Structure**
   - The use of a dictionary structure (key-value pairs) in the JSON data format simplifies the process of updating and deleting items. It allows direct lookups and modifications, reducing the complexity compared to an array-based structure. This decision makes the app more scalable and efficient.

### 4. **Local Storage for Temporary Persistence**
   - The app leverages `localStorage` to store data temporarily on the client-side. This ensures that user actions (such as adding or modifying items) are not lost, even if the server connection is disrupted or the user closes the browser tab. When the user returns, the data is restored from `localStorage`, providing a seamless experience.

### 5. **BeforeUnload Event**
   - To prevent data loss, the app listens for the `beforeunload` event and attempts to send any unsaved changes to the server before the user closes the tab or navigates away from the page. This reduces the risk of losing changes during abrupt exits from the app.

### 6. **Scalability**
   - The combination of delta-based updates, efficient dictionary lookups, and periodic or batch saving ensures that the app can scale efficiently with a large number of items, without significantly increasing I/O or network overhead.

### 7. **Modular Code Structure**
   - The app is designed with a clean separation of concerns, keeping the core logic inside a `VotingApp` class. Initialization and event handlers are encapsulated for clarity and maintainability, making the app easy to extend.

## Usage

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/voting-app.git
