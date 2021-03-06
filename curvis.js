var color = {
    "lowerdiv": "#ace",
    "upperdiv": "#17b",
    "math": "#2a2",
    "science": "#f70",
    "elective": "#96b",
    "writing": "#753"
};

// width and height for svg element
var width = Math.max(800, window.innerWidth - 20),
    height = Math.max(500, window.innerHeight - 20);

// initialize force layout
var force = d3.layout.force()
    .gravity(0.13)
    .charge(-340)
    .linkDistance(110)
    .size([width, height]);

// nodes and links for the force layout
var masterNodes = [],
    masterLinks = [];

// initialize svg elements
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

// link, node, and label for svg element
// putting elements inside container groups enforces drawing order
svg.append("g").attr("class", "links")
svg.append("g").attr("class", "nodes")
svg.append("g").attr("class", "labels")
var node = svg.select(".nodes").selectAll(".node"),
    link = svg.select(".links").selectAll(".link"),
    label = svg.select(".labels").selectAll(".label");

// define line arrow
svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("refX", 18)
    .attr("refY", 3)
    .attr("markerWidth", 8)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0,0 V 6 L8,3 Z")
    .attr("fill", "#BBBBBB");

// update svg element on each force tick
force.on("tick", function() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("transform", function(d) { 
      return "translate(" + d.x + "," + d.y + ")"; });

  label.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")"; });
});

// synchronize svg display of nodes and links in force layout
function updateGraph() {
  link = link.data(force.links(), function(d) { return d.source.name + "-" + d.target.name; });
  link.enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke-dasharray", function(d) {
      if(d.type == "Recommended") return "5,5";
      else return "0,0";
    })
    .attr("marker-end", "url(#arrowhead)");
  link.exit().remove();

  node = node.data(force.nodes(), function(d) { return d.name; });
  node.enter()
    .append("circle")
    .attr("r", 10)
    .style("fill", function(d) { return color[d.type]; })
    .call(force.drag);
  node.exit().remove();

  label = label.data(force.nodes(), function(d) { return d.name; });
  label.enter()
    .append("text")
    .attr("x", 12)
    .attr("dy", ".35em")
    .text(function(d) { return d.name; });
  label.exit().remove();

  // bind events to node
  node.on("mouseover", function(d){
      var currentNode = d3.select(this);
      var currentColor = d3.rgb(currentNode.style("fill"));

      currentNode
        .attr("r", 11.5)
        .style("fill", currentColor.brighter(0.5));
  }).on("mouseout",  function(d) {
      var currentNode = d3.select(this);
      var currentColor = d3.rgb(currentNode.style("fill"));
      currentNode
        .attr("r", 10)
        .style("stroke-width", 0)
        .style("fill", function(d) { return color[d.type]; });
  });
}

// update nodes and links in force layout based on checkboxes
function updateForce() {

  var show = {};
  d3.selectAll('input').each(function(e, i) {
      e = d3.select(this)
      show[e.property('value')] = e.property('checked');
  });
  masterNodes.forEach(function(e) {
    show[e.name] = show[e.type]
  });

  var nodes = masterNodes.filter(function(n) { return show[n.type]; });
  var links = masterLinks.filter(function(n) { return show[n.type] && show[n.source.name] && show[n.target.name]; });

  force
    .nodes(nodes)
    .links(links)
    .start()

  updateGraph();

}

// load data
d3.json("courses.json", function(error, graph) {

  // grab node and relation values from data
  masterNodes = graph.nodes;
  var relations = graph.relations;
  //parse relations into links
  relations.forEach(function(e) { 
      // get source and target index
      var sourceIndex = masterNodes.filter(function(n) { return n.name === e.source; })[0],
          targetIndex = masterNodes.filter(function(n) { return n.name === e.target; })[0];
      // push tuple onto link array
      masterLinks.push({source: sourceIndex, target: targetIndex, type: e.type});
  });

  updateForce()

});