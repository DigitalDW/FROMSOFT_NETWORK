const width = window.innerWidth;
const height = window.innerHeight - 120;
let view_dir = true;

d3.select("#select_game").on("change", selectGame);
d3.select("#change_network_function").on("click", (event) => {
  if (view_dir) {
    event.target.innerHTML = "Switch to directed graph";
  } else {
    event.target.innerHTML = "Switch to simplified graph";
  }
  view_dir = !view_dir;
  selectGame("reload");
});

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewbox", [0, 0, width, height])
  .attr("style", "max-width: 100%; height: auto; border: 1px solid black;");

const g = svg.append("g").attr("cursor", "grab");

g.append("defs")
  .append("marker")
  .attr("id", "arrowhead")
  .attr("viewBox", "-0 -5 10 10") //the bound of the SVG viewport for the current SVG fragment. defines a coordinate system 10 wide and 10 high starting on (0,-5)
  .attr("refX", 7) // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
  .attr("refY", 0)
  .attr("orient", "auto")
  .attr("markerWidth", 8)
  .attr("markerHeight", 8)
  .attr("xoverflow", "visible")
  .append("svg:path")
  .attr("d", "M 0,-2 L 4 ,0 L 0,2")
  .attr("fill", "#999")
  .attr("opacity", 0.75)
  .style("stroke", "none");

svg.call(
  d3
    .zoom()
    .extent([
      [0, 0],
      [width, height],
    ])
    .scaleExtent([0.1, 8])
    .on("zoom", zoomed)
);

function zoomed({ transform }) {
  g.attr("transform", transform);
}

function selectGame(event) {
  let target;
  let value;
  if (event != "reload") {
    target = event.target;
    value = target.value;
  } else {
    value = d3.select("#select_game").node().value;
  }
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
  const edgesPath = `../${folder}/${game}_dir_edges.json`;

  d3.json(nodesPath)
    .then((nodes) => {
      d3.json(edgesPath)
        .then((data) => {
          const edges = formatEdges(data);
          g.selectAll(".nodes").remove();
          g.selectAll(".links").remove();
          g.selectAll("g").remove();
          if (view_dir) {
            startForceLayoutDir(nodes, edges);
          } else if (!view_dir) {
            startForceLayout(nodes, edges);
          }
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

function startForceLayoutDir(nodes, links) {
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

  // Initialize the links
  const link = g
    .selectAll(".links")
    .data(links)
    .enter()
    .append("path")
    .attr("stroke", "#999")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .attr("stroke-width", 4)
    .attr("class", "links")
    .attr("marker-end", "url(#arrowhead)")
    .on("click", (event, d) => {
      console.log(d.source.id, d.target.id);
    }); //The marker-end attribute defines the arrowhead or polymarker that will be drawn at the final vertex of the given shape.

  // Initialize the nodes
  const node = g
    .selectAll(".nodes")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "nodes")
    .call(
      d3
        .drag() //sets the event listener for the specified typenames and returns the drag behavior.
        .on("start", dragstarted) //start - after a new pointer becomes active (on mousedown or touchstart).
        .on("drag", dragged) //drag - after an active pointer moves (on mousemove or touchmove).
        .on("end", dragended) //end - after an active pointer becomes inactive (on mouseup, touchend or touchcancel).
    );

  node
    .append("circle")
    .attr("r", 12) //+ d.runtime/20 )
    .attr("fill", (d) => color(d.zone));

  node.each(function (p, j) {
    const words = p.name.split(" ");
    words.forEach((word, idx) => {
      d3.select(this)
        .append("text")
        .attr("dy", idx + "em")
        .attr("dx", -6)
        .style("font-size", "8px")
        .text(word);
    });
  });

  const simulation = d3
    .forceSimulation()
    .alphaDecay(0)
    .force(
      "link",
      d3
        .forceLink() // This force provides links between nodes
        .id((d) => d.id) // This sets the node id accessor to the specified function. If not specified, will default to the index of a node.
        .distance(30)
    )
    .force("charge", d3.forceManyBody().strength(-100)) // This adds repulsion (if it's negative) between nodes.
    .force("center", d3.forceCenter(width / 2, height / 2)) // This force attracts nodes to the center of the svg area
    .on("tick", ticked);
  //Listen for tick events to render the nodes as they update in your Canvas or SVG.
  simulation.nodes(nodes);

  simulation.force("link").links(links);

  // This function is run at each iteration of the force algorithm, updating the nodes position (the nodes data array is directly manipulated).
  function ticked() {
    link.attr("d", function (d) {
      var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
      return (
        "M" +
        d.source.x +
        "," +
        d.source.y +
        "A" +
        dr +
        "," +
        dr +
        " 0 0,1 " +
        d.target.x +
        "," +
        d.target.y
      );
    });

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  }

  //When the drag gesture starts, the targeted node is fixed to the pointer
  //The simulation is temporarily “heated” during interaction by setting the target alpha to a non-zero value.
  function dragstarted(event) {
    if (event.active) simulation.alphaTarget(0.3).restart(); //sets the current target alpha to the specified number in the range [0,1].
    event.subject.fy = event.subject.y; //fx - the node’s fixed x-position. Original is null.
    event.subject.fx = event.subject.x; //fy - the node’s fixed y-position. Original is null.
    simulation.restart();
  }

  //When the drag gesture starts, the targeted node is fixed to the pointer
  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
    simulation.stop();
  }
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
    .attr("stroke-opacity", 0.5)
    .selectAll()
    .data(links)
    .join("line")
    .attr("stroke-width", (d) => Math.sqrt(d.value) + 3);

  // Initialize the nodes
  const node = g
    .selectAll(".nodes")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "nodes")
    .call(
      d3
        .drag() //sets the event listener for the specified typenames and returns the drag behavior.
        .on("start", dragstarted) //start - after a new pointer becomes active (on mousedown or touchstart).
        .on("drag", dragged) //drag - after an active pointer moves (on mousemove or touchmove).
        .on("end", dragended) //end - after an active pointer becomes inactive (on mouseup, touchend or touchcancel).
    );

  node
    .append("circle")
    .attr("r", 12) //+ d.runtime/20 )
    .attr("fill", (d) => color(d.zone));

  node.each(function (p, j) {
    const words = p.name.split(" ");
    words.forEach((word, idx) => {
      d3.select(this)
        .append("text")
        .attr("dy", idx + "em")
        .attr("dx", -6)
        .style("font-size", "8px")
        .text(word);
    });
  });

  function ticked() {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
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
selectGame("reload");
