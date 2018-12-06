import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import * as d3 from 'd3';

var svg = d3
  .select('svg')
  .style('width', '100%')
  .style('padding-left', '65px')
  .style('overflow', 'visible');

const initialData = [
  { name: 'TEAM A', total: 20, notBegun: 9, partial: 6, completed: 5 }
];

const getTotalForTarget = d => {
  const totalForTarget = data.links.reduce((acc, link) => {
    return d.id === link.target ? acc + link.value : acc;
  }, 0);
  const total = data.links.reduce((acc, link) => acc + link.value, 0);
  return { total: totalForTarget, percent: (totalForTarget * 100) / total };
};

const hoverState = {
  isHover: false,
  hoveringNode: null
};

const statuses = ['COMPLETED', 'PARTIAL', 'NOT BEGUN'];

const nodeColors = [
  '#648C8C',
  '#B1C5C5',
  '#F4F4F0',
  '#99407A',
  '#4FB0A9',
  '#8BA9A9',
  '#FFDA70',
  '#73A5CA',
  '#D4677C',
  '#0B5A79',
  '#96D173'
];

const data = {
  nodes: [
    { name: 'COMPLETED', id: 0 },
    { name: 'PARTIAL', id: 1 },
    { name: 'NOT BEGUN', id: 2 },
    { name: 'TEAM A', id: 3 },
    { name: 'TEAM B', id: 4 },
    { name: 'TEAM C', id: 5 },
    { name: 'TEAM D', id: 6 },
    { name: 'TEAM E', id: 7 },
    { name: 'TEAM F', id: 8 },
    { name: 'TEAM G', id: 9 },
    { name: 'TEAM H', id: 10 }
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

const color = id => nodeColors[id];

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

const node = svg
  .append('g')
  .selectAll('rect')
  .data(nodes)
  .enter()
  .append('rect')
  .attr('class', d => (statuses.includes(d.name) ? 'status-node' : 'team-node'))
  .attr('id', d => `node${d.id}`)
  .attr('x', d => (statuses.includes(d.name) ? d.x0 + 10 : d.x0 - 10))
  .attr('y', d => d.y0)
  .attr('height', d => d.y1 - d.y0)
  .attr('width', d =>
    statuses.includes(d.name) ? d.x1 - d.x0 - 20 : d.x1 - d.x0
  );

node
  .attr('fill', d => color(d.id))
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

const path = link
  .append('path')
  .attr('d', sankeyLinkHorizontal())
  .attr('stroke', d => color(d.source.id))
  .attr('class', 'data-path')
  .attr('id', d => `path${d.index}`)
  .attr('stroke-width', d => Math.max(1, d.width));

link
  .append('title')
  .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

const label = svg
  .append('g')
  .selectAll('text')
  .data(nodes)
  .enter()
  .append('text')
  .attr('x', d => (statuses.includes(d.name) ? d.x1 : d.x0 - 65))
  .attr('y', d => (d.y1 + d.y0) / 2)
  .attr('dy', '0.35em')
  .attr('text-anchor', 'start')
  .attr('fill', d => (statuses.includes(d.name) ? '#648C8C' : color(d.id)))
  .attr('class', d =>
    statuses.includes(d.name) ? 'status-names' : 'team-names'
  )
  .text(d => d.name);

const value = svg
  .append('g')
  .selectAll('text')
  .data(nodes)
  .enter()
  .append('text')
  .style('text-align', 'left')
  .style('font', 'sans-serif')
  .style('font-weight', d => (statuses.includes(d.name) ? 'regular' : 'bold'))
  .attr('class', d =>
    statuses.includes(d.name) ? 'status-value' : 'team-value'
  )
  .attr('x', d => (statuses.includes(d.name) ? d.x1 : d.x0))
  .attr('y', d =>
    statuses.includes(d.name) ? (d.y1 + d.y0) / 2 + 20 : (d.y1 + d.y0) / 2
  )
  .attr('dy', '0.35em')
  .attr('text-anchor', 'start')
  .attr('fill', d => (statuses.includes(d.name) ? 'black' : 'white'))
  .text(d => {
    const { total, percent } = getTotalForTarget(d);
    return statuses.includes(d.name)
      ? `${total} - ${Math.round(percent)}%`
      : data.links.reduce((accumulator, link) => {
          return d.id === link.source ? accumulator + link.value : accumulator;
        }, 0);
  });
