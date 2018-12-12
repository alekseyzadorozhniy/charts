import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { select } from 'd3-selection';
import { json } from 'd3-fetch';
import { format as d3Format } from 'd3-format';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

function responsivefy(svg) {
  // container will be the DOM element
  // that the svg is appended to
  // we then measure the container
  // and find its aspect ratio
  const container = select('.container'),
    width = parseInt(container.style('width'), 10),
    height = parseInt(container.style('height'), 10),
    aspect = width / height;

  // set viewBox attribute to the initial size
  // control scaling with preserveAspectRatio
  // resize svg on inital page load
  svg
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMinYMid')
    .call(resize);

  // add a listener so the chart will be resized
  // when the window resizes
  // multiple listeners for the same event type
  // requires a namespace, i.e., 'click.foo'
  // api docs: https://goo.gl/F3ZCFr
  select(window).on('resize.' + container.attr('id'), resize);

  // this is the code that resizes the chart
  // it will be called on load
  // and in response to window resizes
  // gets the width of the container
  // and resizes the svg to fill it
  // while maintaining a consistent aspect ratio
  function resize() {
    const w = parseInt(container.style('width'));
    svg.attr('width', w);
    svg.attr('height', Math.round(w / aspect));
  }
}

const svg = select('svg')
  .style('overflow', 'visible')
  .call(responsivefy);

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

const width = parseInt(svg.style('width'), 10);
const height = parseInt(svg.style('height'), 10);

const getColor = scaleOrdinal(schemeCategory10);

const color = id => (nodeColors[id] ? nodeColors[id] : getColor(id));

const format = (() => {
  const f = d3Format(',.0f');
  return d => `${f(d)}`;
})();

const sankey1 = (() => {
  const sankey2 = sankey()
    .nodeWidth(120)
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

json('data.json').then(initialData => {
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

  select('#completed-total-value').text(`${Math.round(averageCompleted)}%`);
  select('#partial-total-value').text(`${Math.round(averagePartial)}%`);
  select('#not-begun-total-value').text(`${Math.round(averageNotBegun)}%`);

  const getTotalForTarget = (target, totalTarget) => {
    const total =
      totalTarget || data.links.reduce((acc, link) => acc + link.value, 0);
    return `${target} - ${Math.round((target * 100) / total)}%`;
  };

  const setDefaultTotal = d => {
    return statuses.includes(d.name)
      ? getTotalForTarget(getTotalForOutcome(d))
      : data.links.reduce(
          (accumulator, link) =>
            d.id === link.source ? accumulator + link.value : accumulator,
          0
        );
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
    .attr('x', d => (statuses.includes(d.name) ? d.x0 + 10 : d.x0 - 10 + 65))
    .attr('y', d => d.y0)
    .attr('height', d => d.y1 - d.y0)
    .attr('width', d =>
      statuses.includes(d.name) ? d.x1 - d.x0 - 110 : d.x1 - d.x0 - 130
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
    .attr('x', d => (statuses.includes(d.name) ? d.x0 + 10 : d.x0 + 36 + 65))
    .attr('y', d => d.y0)
    .attr('height', d => d.y1 - d.y0)
    .attr('width', d =>
      statuses.includes(d.name) ? d.x1 - d.x0 - 110 : d.x1 - d.x0 - 101
    );

  nodeMock.attr('fill', d =>
    statuses.includes(d.name) ? 'transparent' : color(d.id)
  );

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
    .attr('x', d => (statuses.includes(d.name) ? d.x1 - 85 : d.x0 + 10))
    .attr('y', d =>
      statuses.includes(d.name) ? (d.y1 + d.y0) / 2 - 10 : (d.y1 + d.y0) / 2
    )
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
    .attr('x', d => (statuses.includes(d.name) ? d.x1 - 85 : d.x0 + 65))
    .attr('y', d =>
      statuses.includes(d.name) ? (d.y1 + d.y0) / 2 + 10 : (d.y1 + d.y0) / 2
    )
    .attr('dy', '0.35em')
    .attr('text-anchor', 'start')
    .attr('fill', d => (statuses.includes(d.name) ? 'black' : 'white'))
    .text(d => setDefaultTotal(d));

  const setDefaultGraphAndTotalValues = () => {
    value.text(d => setDefaultTotal(d));
    path.style('stroke-opacity', 1);
    node.style('fill-opacity', 1);
    nodeMock.style('fill-opacity', 1);
  };

  const textValue = cd => {
    const preparedCd = cd && cd.source ? cd.source : cd;
    value.text(d =>
      cd && statuses.includes(d.name)
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
    if (cd.sourceLinks.length) {
      textValue(cd);
      path.style('stroke-opacity', d => (cd.id !== d.source.id ? 0.25 : 1));
      node.style('fill-opacity', d =>
        !statuses.includes(d.name) && cd.id !== d.id ? 0.25 : 1
      );
      nodeMock.style('fill-opacity', d =>
        !statuses.includes(d.name) && cd.id !== d.id ? 0.25 : 1
      );
    } else {
      setDefaultGraphAndTotalValues();
    }
  });

  nodeMock.on('mouseover', cd => {
    if (cd.sourceLinks.length) {
      textValue(cd);
      path.style('stroke-opacity', d => (cd.id !== d.source.id ? 0.25 : 1));
      node.style('fill-opacity', d =>
        !statuses.includes(d.name) && cd.id !== d.id ? 0.25 : 1
      );
      nodeMock.style('fill-opacity', d =>
        !statuses.includes(d.name) && cd.id !== d.id ? 0.25 : 1
      );
    } else {
      setDefaultGraphAndTotalValues();
    }
  });

  value.on('mouseover', cd => {
    if (cd.sourceLinks.length) {
      textValue(cd);
      path.style('stroke-opacity', d => (cd.id !== d.source.id ? 0.25 : 1));
      node.style('fill-opacity', d =>
        !statuses.includes(d.name) && cd.id !== d.id ? 0.25 : 1
      );
      nodeMock.style('fill-opacity', d =>
        !statuses.includes(d.name) && cd.id !== d.id ? 0.25 : 1
      );
    } else {
      setDefaultGraphAndTotalValues();
    }
  });

  // Set opacity value to 0.25 for mouseleave event
  path.on('mouseleave', cd => {
    textValue(cd);
    path.style('stroke-opacity', d => cd.id === d.source.id && 0.25);
    node.style(
      'fill-opacity',
      d => !statuses.includes(d.name) && cd.id === d.id && 0.25
    );
    nodeMock.style(
      'fill-opacity',
      d => !statuses.includes(d.name) && cd.id === d.id && 0.25
    );
  });

  node.on('mouseleave', cd => {
    textValue(cd);
    path.style('stroke-opacity', d => cd.id === d.source.id && 0.25);
    node.style(
      'fill-opacity',
      d => !statuses.includes(d.name) && cd.id === d.id && 0.25
    );
    nodeMock.style(
      'fill-opacity',
      d => !statuses.includes(d.name) && cd.id === d.id && 0.25
    );
  });

  nodeMock.on('mouseleave', cd => {
    if (cd.sourceLinks.length) {
      textValue(cd);
      path.style('stroke-opacity', d => cd.id === d.source.id && 0.25);
      node.style(
        'fill-opacity',
        d => !statuses.includes(d.name) && cd.id === d.id && 0.25
      );
      nodeMock.style(
        'fill-opacity',
        d => !statuses.includes(d.name) && cd.id === d.id && 0.25
      );
    } else {
      setDefaultGraphAndTotalValues();
    }
  });

  svg.on('mouseleave', cd => {
    value.text(d => setDefaultTotal(d));
    path.style('stroke-opacity', 1);
    node.style('fill-opacity', 1);
    nodeMock.style('fill-opacity', 1);
  });

  link
    .append('title')
    .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);
});
