import json

def increment_json_numbers(input_file, output_file):
    # Open the JSON file and load the data
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    # Iterate through the list and increment the numbers
    for item in data:
        item['origin'] += 1
        item['dest'] = [x + 1 for x in item['dest']]
    
    # Save the modified data back to a new JSON file
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=4)

input_file = './darksouls2/DS2_edges_BAD.json'
output_file = './darksouls2/DS2_edges.json'

increment_json_numbers(input_file, output_file)