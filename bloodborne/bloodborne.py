import json

with open("bloodborne.json", "r") as json_file:
  data = json.load(json_file)

basic_nodes = list()
n_node = 1
for zone in data:
  for lamp in zone["lamps"]:
    basic_nodes.append(
      {
        "zone": zone["zoneName"],
        "name": lamp,
        "id": n_node
      }
    )
    n_node += 1

with open("BB.json", "w") as output_json:
  output_json.write(json.dumps(basic_nodes))