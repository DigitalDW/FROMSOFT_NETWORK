const width = window.innerWidth;
const height = window.innerHeight - 120;
let view_dir = true;
let nodes_labels = "all";
let simulation;

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
const links_group = g.append("g");
const nodes_group = g.append("g");

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

const borderOnOff = document.getElementById("borderOnOff");
borderOnOff.addEventListener("click", (event) => {
  if (event.target.value == "on") {
    event.target.value = "off";
    svg.attr("style", "border: 0px solid black;");
    event.target.innerHTML = "Turn border on";
  } else {
    event.target.value = "on";
    svg.attr("style", "border: 1px solid black;");
    event.target.innerHTML = "Turn border off";
  }
});

const saveToSVG = document.getElementById("saveToSVG");
saveToSVG.addEventListener("click", (event) => exportToSVG(event, svg));

const nodeLabels = document.getElementById("nodeLabels");
nodes_labels = nodeLabels.value;
nodeLabels.addEventListener("change", (event) => {
  nodes_labels = nodeLabels.value;
  selectGame("reload");
});

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
          nodes_group.selectAll(".nodes").remove();
          links_group.selectAll(".links").remove();
          startForceLayout(nodes, edges);
          //g.selectAll("g").remove();
          //if (view_dir) {
          //  startForceLayoutDir(nodes, edges);
          //} else if (!view_dir) {
          //  startForceLayout(nodes, edges);
          //}
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
  const color = returnColor(allZones);
  let forceScale;

  const linkValues = links.map((row) => row.value);
  forceScale = d3.scaleLinear(
    [d3.min(linkValues), d3.max(linkValues)],
    [0.5, 0.1]
  );
  // Initialize the links
  const link = links_group
    .selectAll(".links")
    .data(links)
    .enter()
    .append(view_dir ? "path" : "line")
    .attr("class", "links")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.5)
    .attr("stroke-width", view_dir ? 4 : (d) => Math.sqrt(d.value) + 3)
    .attr("fill", "none")
    .attr("marker-end", view_dir ? "url(#arrowhead)" : "none");

  // Initialize the nodes
  const node = nodes_group
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
    )
    .on("click", function () {
      d3.select(this).moveToFront();
    });

  node
    .append("circle")
    .attr("r", 12) //+ d.runtime/20 )
    .attr("fill", (d) => color(d.zone));

  if (nodes_labels != "none") {
    node.each(function (data, j) {
      displayNames(data, this);
    });
  }

  simulation = d3
    .forceSimulation()
    .alphaDecay(0)
    .force(
      "link",
      d3
        .forceLink() // This force provides links between nodes
        .id((d) => d.id) // This sets the node id accessor to the specified function. If not specified, will default to the index of a node.
        //.distance(30)
        .strength((d) => forceScale(d.value))
    )
    .force("charge", d3.forceManyBody().strength(view_dir ? -100 : -10)) // This adds repulsion (if it's negative) between nodes.
    .force("center", d3.forceCenter(width / 2, height / 2)) // This force attracts nodes to the center of the svg area
    .on("tick", ticked);
  //Listen for tick events to render the nodes as they update in your Canvas or SVG.
  simulation.nodes(nodes);

  simulation.force("link").links(links);

  // This function is run at each iteration of the force algorithm, updating the nodes position (the nodes data array is directly manipulated).
  function ticked() {
    if (view_dir) {
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
    } else {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
    }

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  }
}

//When the drag gesture starts, the targeted node is fixed to the pointer
//The simulation is temporarily “heated” during interaction by setting the target alpha to a non-zero value.
function dragstarted(event) {
  console.log(event.subject);
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

function exportToSVG(event, SVG) {
  event.preventDefault();

  SVG.attr("width", width);

  const svgNode = SVG.node();
  let data = new XMLSerializer().serializeToString(svgNode);

  let svgBlob = new Blob([data], { type: "image/svg+xml;" });
  let svgUrl = URL.createObjectURL(svgBlob);

  let downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = document.getElementById("select_game").value + ".svg";
  downloadLink.click();
}

function returnColor(data) {
  return d3.scaleOrdinal(data, [
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
}

function displayNames(data, node) {
  const words = data.name.split(" ");
  if (nodes_labels === "all") {
    words.forEach((word, idx) => {
      d3.select(node)
        .append("text")
        .attr("dy", idx + "em")
        .attr("dx", -6)
        .style("font-size", "8px")
        //.style("font-weight", important_name ? "bold" : "normal")
        .text(word);
    });
  } else if (nodes_labels === "central") {
    let important_name = false;
    if (
      [
        "Firelink Shrine",
        "The Far Fire",
        "Cathedral Ward",
        "Table of Lost Grace",
        "Hunter's Dream",
        "Crucifixion Woods",
      ].includes(data.name)
    ) {
      important_name = true;
    }
    if (important_name) {
      words.forEach((word, idx) => {
        d3.select(node)
          .append("text")
          .attr("dy", idx + "em")
          .attr("dx", -6)
          .style("font-size", "30px")
          .text(word);
      });
    }
  }
}

d3.selection.prototype.moveToFront = function () {
  console.log(this);
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};

d3.select("#select_game").node().value = "DS1";
selectGame("reload");
