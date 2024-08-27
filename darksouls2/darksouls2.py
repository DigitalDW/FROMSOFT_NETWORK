import json

with open("darksouls2.json", "r") as json_file:
  data = json.load(json_file)

basic_nodes = list()
n_node = 1
for zone in data:
  for bonfire in zone["bonfires"]:
    basic_nodes.append(
      {
        "zone": zone["zoneName"],
        "name": bonfire,
        "id": n_node
      }
    )
    n_node += 1

with open("DS2.json", "w") as output_json:
  output_json.write(json.dumps(basic_nodes))