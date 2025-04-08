import json
import csv

# Parameters
# game = "BB"
# data_type = "N"
# dir = True

games = ["BB", "DS1", "DS2", "DS3", "ER"]
data_types = ["_dir_edges", "_edges", "_nodes"]

for game in games:
  for data_type in data_types:  
    path = "./bloodborne/" if game == "BB" else "./darksouls1/" if game == "DS1" else "./darksouls2/" if game == "DS2" else "./darksouls3/" if game == "DS3" else "./eldenring/"
    filename = game + data_type
    with open(path+filename+".json", "r") as json_file:
      data = json.load(json_file)
      output_data = list()

      if data_type == "_dir_edges" or data_type == "_edges":
        output_data.append("Source| Target")
        for relationship in data:
          for destination in relationship["dest"]:
            output_data.append(f'{relationship["origin"]}| {destination}')

      if data_type == "_nodes":
        output_data.append("id| zone| label")
        for node in data:
          output_data.append(f'{node["id"]}| {node["zone"]}| {node["name"]}')
    
    with open(path+filename+".csv", mode="w", newline="") as f:
      writer = csv.writer(f)
      writer.writerows([row.split("| ") for row in output_data])