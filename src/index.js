import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import * as d3 from 'd3';

var svg = d3
  .select('svg')
  .style('width', '100%')
  .style('padding-left', '65px')
  .style('overflow', 'visible');

const initialTeams = [
  { name: 'TEAM A', total: 20, notBegun: 9, partial: 6, completed: 5 },
  { name: 'TEAM B', total: 25, notBegun: 9, partial: 12, completed: 4 },
  { name: 'TEAM B', total: 25, notBegun: 9, partial: 12, completed: 4 },
  { name: 'TEAM B', total: 25, notBegun: 9, partial: 12, completed: 4 },
  { name: 'TEAM B', total: 25, notBegun: 9, partial: 12, completed: 4 },
  { name: 'TEAM B', total: 25, notBegun: 9, partial: 12, completed: 4 },
  { name: 'TEAM B', total: 25, notBegun: 9, partial: 12, completed: 4 }
];

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

const width = 964;
const height = 600;

const color = id => nodeColors[id];

const format = (() => {
  const f = d3.format(',.0f');
  return d => `${f(d)}`;
})();

const sankey1 = (() => {
  const sankey2 = sankey()
    .nodeWidth(195)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 5]]);
  return ({ nodes, links }) =>
    sankey2({
      nodes: nodes.map(d => Object.assign({}, d)),
      links: links.map(d => Object.assign({}, d))
    });
})();

const transformData = initialData => {
  const statusNodes = statuses.map((status, index) => ({
    name: status,
    id: index
  }));
  const nodes = initialData.map((item, index) => ({
    ...item,
    id: statuses.length + index
  }));
  const links = nodes.reduce((list, node) => {
    const res = statusNodes.map(status => ({
      target: status.id,
      source: node.id,
      value:
        status.id === 0
          ? node.completed
          : status.id === 1
          ? node.partial
          : node.notBegun
    }));
    return [...list, ...res];
  }, []);
  return { links, nodes: [...statusNodes, ...nodes] };
};

d3.json('data.json').then(initialData => {
  const data = transformData(initialData);

  const averageCompleted =
    initialData.reduce((acc, node) => {
      return acc + Math.round((node.completed * 100) / node.total);
    }, 0) / initialData.length;
  const averagePartial =
    initialData.reduce((acc, node) => {
      return acc + Math.round((node.partial * 100) / node.total);
    }, 0) / initialData.length;
  const averageNotBegun =
    initialData.reduce((acc, node) => {
      return acc + Math.round((node.notBegun * 100) / node.total);
    }, 0) / initialData.length;

  d3.select('#completed-total-value').text(`${Math.round(averageCompleted)}%`);
  d3.select('#partial-total-value').text(`${Math.round(averagePartial)}%`);
  d3.select('#not-begun-total-value').text(`${Math.round(averageNotBegun)}%`);

  const getTotalForTarget = (target, totalTarget) => {
    const total =
      totalTarget || data.links.reduce((acc, link) => acc + link.value, 0);
    return `${target} - ${Math.round((target * 100) / total)}%`;
  };

  const getTotalForOutcome = d =>
    data.links.reduce((acc, link) => {
      return d.id === link.target ? acc + link.value : acc;
    }, 0);

  const getTotalForIncomeLink = ({ sourceId, targetId }) =>
    data.links.reduce((acc, link) => {
      return targetId === link.target && link.source === sourceId
        ? acc + link.value
        : acc;
    }, 0);

  const { nodes, links } = sankey1(data);

  const node = svg
    .append('g')
    .selectAll('rect')
    .data(nodes)
    .enter()
    .append('rect')
    .attr('class', d =>
      statuses.includes(d.name) ? 'status-node' : 'team-node'
    )
    .attr('id', d => `node${d.id}`)
    .attr('x', d => (statuses.includes(d.name) ? d.x0 + 10 : d.x0 - 10))
    .attr('y', d => d.y0)
    .attr('height', d => d.y1 - d.y0)
    .attr('width', d =>
      statuses.includes(d.name) ? d.x1 - d.x0 - 180 : d.x1 - d.x0
    );

  node
    .attr('fill', d => color(d.id))
    .append('title')
    .text(d => `${d.name}\n${format(d.value)}`);

  const nodeMock = svg
    .append('g')
    .selectAll('rect')
    .data(nodes)
    .enter()
    .append('rect')
    .attr('class', d =>
      statuses.includes(d.name) ? 'status-mock-node' : 'team-mock-node'
    )
    .attr('id', d => `node${d.id}`)
    .attr('x', d => (statuses.includes(d.name) ? d.x0 + 10 : d.x0 + 35))
    .attr('y', d => d.y0)
    .attr('height', d => d.y1 - d.y0)
    .attr('width', d =>
      statuses.includes(d.name) ? d.x1 - d.x0 - 180 : d.x1 - d.x0 - 35
    );

  nodeMock.attr('fill', d => color(d.id));

  const link = svg
    .append('g')
    .attr('fill', 'none')
    .attr('stroke-opacity', 1)
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

  const label = svg
    .append('g')
    .selectAll('text')
    .data(nodes)
    .enter()
    .append('text')
    .attr('x', d => (statuses.includes(d.name) ? d.x1 - 135 : d.x0 - 65))
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
    .attr('x', d => (statuses.includes(d.name) ? d.x1 - 135 : d.x0))
    .attr('y', d =>
      statuses.includes(d.name) ? (d.y1 + d.y0) / 2 + 20 : (d.y1 + d.y0) / 2
    )
    .attr('dy', '0.35em')
    .attr('text-anchor', 'start')
    .attr('fill', d => (statuses.includes(d.name) ? 'black' : 'white'))
    .text(d => {
      return statuses.includes(d.name)
        ? getTotalForTarget(getTotalForOutcome(d))
        : data.links.reduce(
            (accumulator, link) =>
              d.id === link.source ? accumulator + link.value : accumulator,
            0
          );
    });

  const textValue = cd => {
    const preparedCd = cd.source ? cd.source : cd;
    value.text(d =>
      statuses.includes(d.name)
        ? getTotalForTarget(
            getTotalForIncomeLink({ sourceId: preparedCd.id, targetId: d.id }),
            preparedCd.value
          )
        : data.links.reduce(
            (accumulator, link) =>
              d.id === link.source ? accumulator + link.value : accumulator,
            0
          )
    );
  };

  path.on('mouseover', cd => {
    textValue(cd);
    path.style('stroke-opacity', d =>
      cd.source.id !== d.source.id ? 0.25 : 1
    );
    node.style('fill-opacity', d =>
      !statuses.includes(d.name) && cd.source.id !== d.id ? 0.25 : 1
    );
    nodeMock.style('fill-opacity', d =>
      !statuses.includes(d.name) && cd.source.id !== d.id ? 0.25 : 1
    );
  });

  node.on('mouseover', cd => {
    textValue(cd);
    path.style('stroke-opacity', d => (cd.id !== d.source.id ? 0.25 : 1));
    node.style('fill-opacity', d =>
      !statuses.includes(d.name) && cd.id !== d.id ? 0.25 : 1
    );
    nodeMock.style('fill-opacity', d =>
      !statuses.includes(d.name) && cd.id !== d.id ? 0.25 : 1
    );
  });

  nodeMock.on('mouseover', cd => {
    textValue(cd);
    path.style('stroke-opacity', d => (cd.id !== d.source.id ? 0.25 : 1));
    node.style('fill-opacity', d =>
      !statuses.includes(d.name) && cd.id !== d.id ? 0.25 : 1
    );
    nodeMock.style('fill-opacity', d =>
      !statuses.includes(d.name) && cd.id !== d.id ? 0.25 : 1
    );
  });

  let onSvgOver = false;

  svg.on('mouseover', () => (onSvgOver = true));
  svg.on('mouseleave', () => (onSvgOver = false));

  document.addEventListener('click', () => {
    if (!onSvgOver) {
      path.style('stroke-opacity', 1);
      node.style('fill-opacity', 1);
      nodeMock.style('fill-opacity', 1);
    }
  });

  link
    .append('title')
    .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);
});
