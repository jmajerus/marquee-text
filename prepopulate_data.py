import json

# Define the input text file and output JSON file
input_text_file = "../marquee-generator-web/text_file.txt"  # The text file containing lines to be added
output_json_file = 'data.json'  # The JSON file where data will be saved

def load_existing_data():
    """Load existing data from the JSON file, or return an empty dictionary if the file doesn't exist."""
    try:
        with open(output_json_file, 'r') as json_file:
            return json.load(json_file)  # Load the existing data
    except FileNotFoundError:
        return {}  # If the file doesn't exist, return an empty dictionary

def prepopulate_data():
    # Load existing data from data.json
    data = load_existing_data()

    # Read lines from the text file
    with open(input_text_file, 'r') as file:
        lines = file.readlines()

    # Iterate over each line and add to the data if it doesn't already exist
    for line in lines:
        line = line.strip()  # Remove any extra whitespace or newline characters
        if line:  # Only process non-empty lines
            if line in data:
                print(f"Duplicate found: '{line}' (Skipping this entry)")
            else:
                data[line] = {
                    'upvotes': 0,
                    'downvotes': 0
                }

    # Write the updated data to the JSON file
    with open(output_json_file, 'w') as json_file:
        json.dump(data, json_file, indent=4)

    print(f"Data prepopulated successfully into {output_json_file}.")

# Run the prepopulate function
prepopulate_data()
