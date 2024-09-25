import json

def increment_json_numbers(input_file, output_file):
    # Open the JSON file and load the data
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    new_data = data
    # Iterate through the list and increment the numbers
    for row in new_data:
        for dest in row["dest"]:
              for item in new_data:
                  if item["origin"] == dest:
                      if row["origin"] not in item["dest"]:
                          item["dest"].append(row["origin"])
    
    # Save the modified data back to a new JSON file
    with open(output_file, 'w') as f:
        json.dump(new_data, f, indent=4)

input_file = './eldenring/ER_edges.json' 
output_file = './eldenring/ER_dir_edges.json'

increment_json_numbers(input_file, output_file)