function loadJSON(callback) {

	let xobj = new XMLHttpRequest();
	xobj.overrideMimeType('application/json');
	xobj.open('GET', 'db.json', true);
	xobj.onreadystatechange = function () {
		if (xobj.readyState == 4 && xobj.status == '200') {
			// Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
			callback(JSON.parse(xobj.responseText));
		}
	};
	xobj.send(null);
}

function zoom() {
	let {transform} = d3.event;
	rootGroup.attr('transform', 'translate(' + transform.x + ',' + transform.y + ') scale(' + transform.k + ')');
}


const radius = 30,
	svg = d3.select('svg'),
	rootGroup = svg.append('g').attr('class', 'zoom-wrapper').call(d3.zoom().on('zoom', zoom)),
	width = Number(svg.style('width').replace('px', '')),
	height = Number(svg.style('height').replace('px', ''));

let simulation = d3.forceSimulation()
	.force('link', d3.forceLink().id(d => d.id))
	.force('charge', d3.forceCollide(radius * 3))
	.force('center', d3.forceCenter(width / 2, height / 2));

function buildGraphData(movies) {
	let nodes = [];
	let links = [];
	movies.forEach(movie => {
		nodes.push({id: movie.name, image: movie.image});
		if (movie.refs && movie.refs.length) {
			movie.refs.forEach(referencedMovie => {
				links.push({source: movie.name, target: referencedMovie});
			});
		}
	});

	return {nodes, links};
}

loadJSON(function (data) {

	let graph = buildGraphData(data);
	let link = rootGroup.append('g')
		.attr('class', 'links')
		.selectAll('line')
		.data(graph.links)
		.enter().append('line')
		.attr('stroke-width', 1);

	let node = rootGroup.append('g')
		.attr('class', 'nodes')
		.selectAll('circle')
		.data(graph.nodes)
		.enter().append('circle')
		.attr('r', radius)
		.attr('fill', d => `url(#${d.image})`)
		.call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended));

	node.append('title').text(d => d.id);

	simulation.nodes(graph.nodes).on('tick', ticked);

	simulation.force('link').links(graph.links);

	function ticked() {
		link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
			.attr('x2', d => d.target.x).attr('y2', d => d.target.y);

		node.attr('cx', d => d.x = Math.max(radius, Math.min(width - radius, d.x)))
			.attr('cy', d => d.y = Math.max(radius, Math.min(height - radius, d.y)));
	}
});

function dragstarted(d) {
	if (!d3.event.active) {
		simulation.alphaTarget(0.3).restart();
	}
	d.fx = d.x;
	d.fy = d.y;
}

function dragged(d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
}

function dragended(d) {
	if (!d3.event.active) {
		simulation.alphaTarget(0);
	}
	d.fx = null;
	d.fy = null;
}