import json

def main():
    json_file_path = 'ER_nodes.json'  # Update with your JSON file path
    text_file_path = 'raw_html.txt'  # Update with your text file path
    
    ranked_names_output_path = 'ranked_names.json'  # Update with your desired output path
    missing_names_output_path = 'missing_names.json'  # Update with your desired output path

    json_data = load_json(json_file_path)
    text = load_text(text_file_path)
    
    ranked_names, missing_names = rank_names_by_text_appearance(json_data, text)
    
    # Export ranked names to a JSON file
    save_to_json(ranked_names, ranked_names_output_path)
    
    # Export missing names to a separate JSON file
    save_to_json(missing_names, missing_names_output_path)

def load_json(json_file_path):
    """Load JSON data from a file."""
    with open(json_file_path, 'r') as file:
        data = json.load(file)
    return data

def load_text(text_file_path):
    """Load text from a file."""
    with open(text_file_path, 'r') as file:
        text = file.read()
    return text

def rank_names_by_text_appearance(json_data, text):
    """Rank names based on their order of appearance in the text."""
    name_order = []
    missing_names = []
    text_lower = text.lower()  # Convert text to lower case to handle case-insensitivity

    for entry in json_data:
        name = entry["name"]
        name_lower = name.lower()
        index = text_lower.find(name_lower)
        if index != -1:
            name_order.append((name, index))
        else:
            missing_names.append(name)
    
    # Sort the names by their order of appearance (index in the text)
    name_order_sorted = sorted(name_order, key=lambda x: x[1])
    
    # Retrieve the names in the order of appearance
    ranked_names = [name for name, _ in name_order_sorted]
    return ranked_names, missing_names

def save_to_json(data, file_path):
    """Save data to a JSON file."""
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

if __name__ == "__main__":
    main()
