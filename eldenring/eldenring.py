import json

with open("eldenring.json", "r") as json_file:
  data = json.load(json_file)["region"]

basic_nodes = list()
n_node = 1
for region in data:
  for zone in region["zones"]:
    for site in zone["sites"]:
      basic_nodes.append(
        {
          "region": region["regionName"],
          "zone": zone["zoneName"],
          "name": site,
          "id": n_node
        }
      )
      n_node += 1

with open("ER.json", "w") as output_json:
  output_json.write(json.dumps(basic_nodes))