class SkyNightRenderer {
  constructor() {
    this.canvas = document.querySelector("canvas");
    this.context = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(this.width/2, this.height/2))

    this.minFilterElement = document.querySelector("#filter__min");
    this.maxFilterElement = document.querySelector("#filter__max");
    [this.minFilterElement, this.maxFilterElement].forEach(function(node) {
      node.addEventListener("change", function() {
        this.refreshFilter();
      }.bind(this));
    }.bind(this));

    this.refreshFilter();
    this.debug();

    var targetJsonFile = window.location.search.split("?jsonFile=")[1];
    var hostBaseUrl = "https://raw.githubusercontent.com/gincla/nightsky/master/lib/";
    fetch(`${hostBaseUrl}${targetJsonFile}`)
      .then(function(response) {
        return response.json();
      })
      .then(function(myJson) {
        this.buildChart(myJson);
      }.bind(this));
  }

  refreshFilter() {
    this.filterMin = parseInt(this.minFilterElement.value) || 0;
    this.filterMax = parseInt(this.maxFilterElement.value) || 0;

    if(this.filterMin > this.filterMax) {
      alert("The minimum filter cannot be greater than the maximum filter. Resetting min. to 0.");
      this.filterMin = 0;
      this.minFilterElement.value = 0;
    }
  }

  debug() {
    console.log(`Fiter: ${this.filterMin} > ${this.filterMax}`);
  }

  buildChart(graph) {
    this.graph = graph;
    this.simulation
        .nodes(graph.nodes)
        .on("tick", this.ticked.bind(this))

    this.simulation.force("link")
        .links(graph.links);

    d3.select(this.canvas)
      .on("click", this.clicked.bind(this));
  }

  clicked() {
    var node = this.simulation.find(d3.event.x, d3.event.y, 50);
    if(node) {
      if(this.currentNode) {
        this.currentNode.selected = false;
      }
      this.currentNode = node;
      this.currentNode.selected = true;
      this.displayTooltip(node);
      this.simulation.restart();
    } else {
      this.currentNode.selected = false;
      this.currentNode = false;
      console.log("No node found");
    }
  }

  displayTooltip(node) {
    const left = node.x;
    const top = node.y;
    const width = 200;
    const height = 200;

    const virtualReference = {
      getBoundingClientRect() {
        return {
          width: width,
          height: height,
          top: top,
          left: left - 100,
          right: left + width,
          bottom: top + height
        }
      },
      clientHeight: width,
      clientWidth: height
    }

    const categoryHTML = node.categories.map((category) => `<li>${category}</li>`)
                             .slice(0, 5)
                             .join("");
    const content = `
    <div style="padding: 10px; text-align: left">
      <h2>${node.id}</h2>
      <div><strong>EBITDA</strong> approx. EUR ${node.arcSize * this.getRandomInt(1, 7)} million</div>
      <div><strong>Liquidity ${node.radius * this.getRandomInt(1, 100) / 20}</strong> approx. months left</div>
      <ul>
      ${categoryHTML}
      </ul>
    </div>
    `;
    tippy(virtualReference, { content: content, showOnInit: true });
  }

  ticked() {
    var context = this.context;
    var width = this.width;
    var height = this.height;
    var graph = this.graph;
    context.clearRect(0, 0, width, height);
    context.save();

    context.beginPath();
    graph.links.forEach(this.drawLink.bind(this));
    context.strokeStyle = "#aaa";
    context.stroke();

    context.beginPath();
    graph.nodes.forEach(this.drawNode.bind(this));
    context.fillStyle = "#fff";
    context.fill();
    context.strokeStyle = "#fff";
    context.stroke();

    context.restore();
  }

  drawLink(d) {
    this.context.moveTo(d.source.x, d.source.y);
    this.context.lineTo(d.target.x, d.target.y);
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

  drawNode(node) {
    if(!node.arcSize) {
      node.arcSize = this.getRandomInt(Math.PI, 2 * Math.PI)
    }
    if(!node.radius) {
      node.radius = this.getRandomInt(3, 6);
    }

    var radius = node.selected ? node.radius * 3 : node.radius * 1.5;
    this.context.strokeStyle = "white";
    this.context.stroke();
    this.context.moveTo(node.x + radius, node.y);
    this.context
      .arc(node.x, node.y, radius, 0, node.arcSize);
  }

}

window.SkyNightRenderer = SkyNightRenderer;
