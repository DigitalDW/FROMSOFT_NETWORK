const width = window.innerWidth;
const height = window.innerHeight - 120;

d3.select("#select_game").on("change", selectGame);

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewbox", [0, 0, width, height])
  .attr("style", "max-width: 100%; height: auto; border: 1px solid black;");

const g = svg.append("g").attr("cursor", "grab");

svg.call(
  d3
    .zoom()
    .extent([
      [0, 0],
      [width, height],
    ])
    .scaleExtent([1, 8])
    .on("zoom", zoomed)
);

function zoomed({ transform }) {
  g.attr("transform", transform);
}

function selectGame(event) {
  g.selectAll("g").remove();
  const target = event.target;
  const value = target.value;
  switch (value) {
    case "DS1":
      loadData(value, "darksouls1");
      break;
    case "DS2":
      loadData(value, "darksouls2");
      break;
    case "BB":
      loadData(value, "bloodborne");
      break;
    case "DS3":
      loadData(value, "darksouls3");
      break;
    case "ER":
      loadData(value, "eldenring");
      break;
  }
}

function loadData(game, folder) {
  const nodesPath = `../${folder}/${game}_nodes.json`;
  const edgesPath = `../${folder}/${game}_edges.json`;

  d3.json(nodesPath)
    .then((nodes) => {
      d3.json(edgesPath)
        .then((data) => {
          const edges = formatEdges(data);
          startForceLayout(nodes, edges);
        })
        .catch((error) => console.log("Error loading data:", error));
    })
    .catch((error) => console.log("Error loading data:", error));
}

function formatEdges(data) {
  const edgeData = [];
  data.forEach((node) => {
    const origin = node.origin;
    node.dest.forEach((destination) =>
      edgeData.push({
        source: origin,
        target: destination,
        value: Math.abs(origin - destination),
      })
    );
  });
  return edgeData;
}

function startForceLayout(nodes, links) {
  const allZones = new Set(nodes.map((row) => row.zone));
  const nZones = allZones.size;
  const color = d3.scaleOrdinal(allZones, [
    "#c35921",
    "#6376e6",
    "#5eb847",
    "#c06ee5",
    "#a6b535",
    "#714dbb",
    "#cca238",
    "#a738a6",
    "#5bbe7f",
    "#c9348b",
    "#557f2f",
    "#e668c0",
    "#39855f",
    "#dd3e77",
    "#4cc2bc",
    "#d5482e",
    "#52a0d6",
    "#df8c31",
    "#4a69b0",
    "#acb064",
    "#a26fc2",
    "#7b712b",
    "#d895e0",
    "#995e2e",
    "#9598de",
    "#d63d4f",
    "#745194",
    "#da9a69",
    "#b35397",
    "#e27b6a",
    "#b571a2",
    "#a6454c",
    "#e996b7",
    "#894b67",
    "#db748b",
    "#a13f6a",
  ]);

  const linkValues = links.map((row) => row.value);
  const forceScale = d3.scaleLinear(
    [d3.min(linkValues), d3.max(linkValues)],
    [2.25, 0.2]
  );

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .strength((d) => forceScale(d.value))
    )
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", ticked);

  const link = g
    .append("g")
    .attr("class", "can_remove")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll()
    .data(links)
    .join("line")
    .attr("stroke-width", (d) => Math.sqrt(d.value));

  const node = g
    .append("g")
    .attr("class", "can_remove")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll()
    .data(nodes)
    .join("circle")
    .attr("r", 5)
    .on("mouseover", (e, d) => {
      console.log(d.name);
    })
    .attr("fill", (d) => color(d.zone));

  function ticked() {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  }

  node.call(
    d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
  );

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
}

d3.select("#select_game").node().value = "DS1";
loadData("DS1", "darksouls1");
