import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import * as d3 from 'd3';

var svg = d3
  .select('svg')
  .style('width', '100%')
  .style('height', 'auto')
  .style('padding-left', '65px')
  .style('overflow', 'hidden');

const initialData = [
  { name: 'TEAM A', total: 20, notBegun: 9, partial: 6, completed: 5 }
];

const hoverState = {
  isHover: false,
  hoveringNode: null
};

const statuses = ['COMPLETED', 'PARTIAL', 'NOT BEGUN'];

const data = {
  nodes: [
    { name: 'COMPLETED' },
    { name: 'PARTIAL' },
    { name: 'NOT BEGUN' },
    { name: 'TEAM A' },
    { name: 'TEAM B' },
    { name: 'TEAM C' },
    { name: 'TEAM D' },
    { name: 'TEAM E' },
    { name: 'TEAM F' },
    { name: 'TEAM G' },
    { name: 'TEAM H' }
  ],
  links: [
    {
      source: 3,
      target: 0,
      value: 9
    },
    {
      source: 4,
      target: 0,
      value: 9
    },
    {
      source: 5,
      target: 0,
      value: 5
    },
    {
      source: 6,
      target: 0,
      value: 13
    },
    {
      source: 7,
      target: 0,
      value: 8
    },
    {
      source: 8,
      target: 0,
      value: 4
    },
    {
      source: 9,
      target: 0,
      value: 12
    },
    {
      source: 10,
      target: 0,
      value: 5
    },
    {
      source: 3,
      target: 1,
      value: 6
    },
    {
      source: 4,
      target: 1,
      value: 12
    },
    {
      source: 5,
      target: 1,
      value: 3
    },
    {
      source: 6,
      target: 1,
      value: 6
    },
    {
      source: 7,
      target: 1,
      value: 5
    },
    {
      source: 8,
      target: 1,
      value: 4
    },
    {
      source: 9,
      target: 1,
      value: 10
    },
    {
      source: 10,
      target: 1,
      value: 9
    },
    {
      source: 3,
      target: 2,
      value: 4
    },
    {
      source: 4,
      target: 2,
      value: 4
    },
    {
      source: 5,
      target: 2,
      value: 3
    },
    {
      source: 6,
      target: 2,
      value: 2
    },
    {
      source: 7,
      target: 2,
      value: 12
    },
    {
      source: 8,
      target: 2,
      value: 6
    },
    {
      source: 9,
      target: 2,
      value: 9
    },
    {
      source: 10,
      target: 2,
      value: 2
    }
  ]
};

const width = 964;
const height = 600;

const color = (() => {
  const color = d3.scaleOrdinal(d3.schemeAccent);
  return name => color(name);
})();

const format = (() => {
  const f = d3.format(',.0f');
  return d => `${f(d)}`;
})();

const sankey1 = (() => {
  const sankey2 = sankey()
    .nodeWidth(35)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 5]]);
  return ({ nodes, links }) =>
    sankey2({
      nodes: nodes.map(d => Object.assign({}, d)),
      links: links.map(d => Object.assign({}, d))
    });
})();

const { nodes, links } = sankey1(data);

function hover(name) {
  // link.selectAll('path').attr('fill', '#000');
  // svg.style('opacity', 0.3);
  d3.selectAll(link).attr('fill', '#fff');
  // console.log(name); //.attr('fill', '#000');
}

const node = svg
  .append('g')
  // .attr('stroke', '#000')
  .selectAll('rect')
  .data(nodes)
  .enter()
  .append('rect')
  .attr('x', d => (statuses.includes(d.name) ? d.x0 + 10 : d.x0 - 10))
  .attr('y', d => d.y0)
  .attr('height', d => d.y1 - d.y0);

node
  // .transition(t)
  // .delay(500)
  .attr('width', d =>
    statuses.includes(d.name) ? d.x1 - d.x0 - 20 : d.x1 - d.x0
  );

node
  .attr('fill', d => color(d.name))
  .append('title')
  .text(d => `${d.name}\n${format(d.value)}`);

const link = svg
  .append('g')
  .attr('fill', 'none')
  .attr('stroke-opacity', 0.6)
  .selectAll('g')
  .data(links)
  .enter()
  .append('g')
  .style('mix-blend-mode', 'multiply');

// var t = d3
//   .transition()
//   .duration(750)
//   .ease(d3.easeLinear);

const path = link
  .append('path')
  .attr('d', sankeyLinkHorizontal())
  .attr('stroke', d => color(d.source.name))
  .attr('class', 'data-path');

console.log(path);
// link
//   .transition()
//   .duration(800)
//   .attr('stroke-dashoffset', 0);

link
  // .transition(t)
  // .delay(700)
  .attr('stroke-width', d => Math.max(1, d.width));
// .on('click', hover);

link
  .append('title')
  .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

const label = svg
  .append('g')
  .style('font', '12px sans-serif')
  .style('font-weight', 'bold')
  .selectAll('text')
  .data(nodes)
  .enter()
  .append('text')
  .attr('x', d => (statuses.includes(d.name) ? d.x1 + 70 : d.x0 - 65))
  // .attr('x', d => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
  .attr('y', d => (d.y1 + d.y0) / 2)
  .attr('dy', '0.35em')
  .attr('text-anchor', d => (d.x0 < width / 2 ? 'start' : 'end'))
  .attr('fill', d => color(d.name));
// .attr('transform', 'scale(0)');

label
  // .transition(t)
  // .attr('transform', 'scale(1)')
  // .transition()
  // .transition()
  // .duration(1500)
  // .attr('transform', 'scale(1)')
  .text(d => d.name)
  .attr('class', 'team-names');
