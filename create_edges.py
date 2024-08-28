import os
import json

def main():
    folder_path = list_folders()
    if folder_path:
        json_file_path = select_json_file(folder_path)
        if json_file_path:
            json_data = read_json_file(json_file_path)
            if json_data:
                print("\nJSON data successfully read")
                edge_data = use_json(json_data)
                export_edge_data(json_file_path, edge_data)
            else:
                print("Failed to read JSON data.")
        else:
            print("No valid JSON file selected.")
    else:
        print("No folder selected.")

def list_folders():
    current_directory = os.getcwd()
    folders = [f for f in os.listdir(current_directory) if os.path.isdir(os.path.join(current_directory, f))]
    if not folders:
        print("No folders found in the current directory.")
        return None

    print("Available folders:")
    for idx, folder_name in enumerate(folders):
        print(f"{idx + 1}. {folder_name}")

    while True:
        try:
            folder_index = int(input("\nEnter the number of the folder you want to select: ")) - 1
            if 0 <= folder_index < len(folders):
                return os.path.join(current_directory, folders[folder_index])
            else:
                print("Invalid selection. Please try again.")
        except ValueError:
            print("Please enter a valid number.")

def select_json_file(folder_path):
    files = [f for f in os.listdir(folder_path) if f.endswith(".json") and "_nodes" in f]
    if not files:
        print("No JSON files with '_nodes' in the name were found in the selected folder.")
        return None

    print("\nSelect a JSON file:")
    for idx, file_name in enumerate(files):
        print(f"{idx + 1}. {file_name}")

    while True:
        try:
            file_index = int(input("\nEnter the number of the file you want to select: ")) - 1
            if 0 <= file_index < len(files):
                return os.path.join(folder_path, files[file_index])
            else:
                print("Invalid selection. Please try again.")
        except ValueError:
            print("Please enter a valid number.")

def read_json_file(file_path):
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
        return data
    except json.JSONDecodeError:
        print("Error: The selected file is not a valid JSON file.")
        return None

def use_json(json_data):
    constructed_data = []

    available_nodes = [checkpoint["name"] for checkpoint in json_data]

    for checkpoint in json_data:
        print("\nList of nodes:")
        for idx in range(len(available_nodes)):
            print(f"{idx + 1}. {available_nodes[idx]}")

        selected_checkpoints = []
        print(
              "\nCurrent checkpoint is " + 
              checkpoint["name"] +
              " in " +
              checkpoint["zone"] +
              ". Please select the checkpoint(s) it connects to " +
              "(press 'Enter' to confirm input, " + 
              "and input 'y' or 'Y' if you are done with this node): "
          )
        
        while True:
            choice = input("")
            if choice.upper() == "Y":
                break
            try :
                choice_number = int(choice)
                if choice_number < len(available_nodes) and choice_number > 0:
                    selected_checkpoints.append(choice_number)
                else:
                    print(f"Please enter a valid number (between 1 and {len(available_nodes)}).")
            except ValueError:
                print("Please enter a number or 'y'/'Y'.")
        
        constructed_data.append(
            {
                "origin": available_nodes.index(checkpoint["name"])+1,
                "dest": selected_checkpoints
            }
        )
    
    return constructed_data

def export_edge_data(file_path, edge_data):
    with open(file_path.replace("_nodes", "_edges"), 'w') as file:
        file.write(json.dumps(edge_data))

if __name__ == "__main__":
    main()
