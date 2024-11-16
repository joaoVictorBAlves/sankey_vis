// [DATA] dataset
const nodes = [
    { id: "A1" },
    { id: "A2" },
    { id: "A3" },
    { id: "Q1" },
    { id: "Q2" },
    { id: "Q3" },
    { id: "K1" },
    { id: "K2" },
    { id: "K3" }
];

const links = [
    { source: "A1", target: "Q1", value: 1, qtd: null },
    { source: "A1", target: "Q3", value: 2, qtd: null },
    { source: "A2", target: "Q1", value: 3, qtd: null },
    { source: "A2", target: "Q2", value: 3, qtd: null },
    { source: "A2", target: "Q3", value: 3, qtd: null },
    { source: "A3", target: "Q2", value: 2, qtd: null },
    { source: "A3", target: "Q1", value: 1, qtd: null },
    { source: "A3", target: "Q3", value: 2, qtd: null },
    { source: "Q1", target: "K1", value: 1, qtd: 2 },
    { source: "Q1", target: "K1", value: 3, qtd: 1 },
    { source: "Q2", target: "K1", value: 2, qtd: 1 },
    { source: "Q2", target: "K1", value: 3, qtd: 1 },
    { source: "Q2", target: "K2", value: 2, qtd: 1 },
    { source: "Q2", target: "K2", value: 3, qtd: 1 },
    { source: "Q3", target: "K3", value: 2, qtd: 2 },
    { source: "Q3", target: "K3", value: 3, qtd: 1 },
];

// [SETUP] width and height available
const width = window.innerWidth - 35;
const height = window.innerHeight - 20;
const K = 50;
const REDUCTOR = 0.5;
const FACTOR = K / 2;
const gap = 5;

// [ALL FUNCTIONS]

/**
 * Creates a map of nodes where the key is the node id and the value is an object containing node details and links.
 * @param {*} nodes - An array of nodes where each node is an object with an id property.
 * @param {*} links - An array of links where each link is an object with a source and target property that contains the id of the source and target node.
 * @returns {Object} A map of nodes where the key is the node id and the value is an object containing node details and links.
 */
function createNodeMap(nodes, links) {
    const nodeMap = {};
    nodes.forEach(node => {
        nodeMap[node.id] = {
            ...node,
            sourceLinks: [],
            targetLinks: []
        };
    });

    links.forEach(link => {
        const sourceNode = nodeMap[link.source];
        const targetNode = nodeMap[link.target];

        const linkWithNodes = {
            ...link,
            sourceNode: sourceNode,
            targetNode: targetNode
        };

        sourceNode.sourceLinks.push(linkWithNodes);
        targetNode.targetLinks.push(linkWithNodes);
    });
    return nodeMap;
}

/**
 * Groups nodes by the initial character of their id.
 *
 * @param {Object} nodeMap - A map of nodes where the key is the node id and the value is an object containing node details and links.
 * @returns {Object} An object where keys are the initial characters of node ids and values are arrays of nodes that share the same initial character.
 */
function groupNodesByInitial(nodeMap) {
    const groups = {};

    Object.values(nodeMap).forEach(node => {
        const initial = node.id.charAt(0);

        if (!groups[initial]) {
            groups[initial] = [];
        }

        groups[initial].push(node);
    });

    return groups;
}

/**
 * Calculates the height of a link based on its source node and a constant factor.
 *
 * @param {Object} link - The link object containing sourceNode and targetNode properties.
 * @param {number} K - A constant factor used to calculate the height.
 * @returns {number} The calculated height of the link.
 */
function heightLink(link, K) {
    const sourceInitial = link.sourceNode.id[0];
    let height;

    if (sourceInitial == "A") {
        height = K;
    } else if (sourceInitial == "Q") {
        const matchingLinks = link.sourceNode.targetLinks.filter(
            l => l.targetNode.id == link.sourceNode.id && l.value == link.value
        );
        height = K * matchingLinks.length;
    } else {
        height = 5; // MIN HEIGHT
    }

    link.height = height;
    return height;
}

/**
 * Calculates and assigns the positions of nodes within the node map.
 *
 * @param {Object} nodeMap - A map of nodes where the key is the node id and the value is an object containing node details and links.
 * @param {number} K - A constant factor used to calculate the height of nodes.
 * @param {number} gap - The gap between nodes in the same group.
 */
function calculateNodePositions(nodeMap, K, gap, reductor) {
    const nodeGroups = groupNodesByInitial(nodeMap);

    Object.entries(nodeGroups).forEach(([key, nodes]) => {
        let currentY = 0;

        nodes.forEach(node => {
            if (key == "A") {
                // Grupo A: altura é 3 * K
                node.height = 3 * K;
            } else if (key == "Q") {
                // Grupo Q: altura é quantidade de links de entrada * K
                node.height = node.targetLinks.length * K;
            } else if (key == "K") {
                // Grupo K: altura é o somatório das alturas dos links de saída
                node.height = node.targetLinks.reduce((sum, link) => {
                    return sum + (heightLink(link, K) * reductor);
                }, 0);
            }

            node.y = currentY;

            currentY += node.height + gap;
        });
    });
}

/**
 * Calculates and assigns the heights of links within the node map.
 *
 * @param {Object} nodeMap - A map of nodes where the key is the node id and the value is an object containing node details and links.
 * @param {number} K - A constant factor used to calculate the height of links.
 */
function calculateLinkHeights(nodeMap, K) {
    Object.values(nodeMap).forEach(node => {
        node.targetLinks.forEach(link => {
            link.height = heightLink(link, K);
        });

        node.sourceLinks.forEach(link => {
            link.height = heightLink(link, K);
        });
    });
}

/**
 * Defines the y0 position for links based on their source node and a factor.
 *
 * @param {Object} nodeMap - A map of nodes where the key is the node id and the value is an object containing node details and links.
 * @param {number} K - A constant factor used to calculate the height of links.
 * @param {number} factor - A factor used to adjust the y0 position of links.
 */
function defineY0ForLinks(nodeMap, links, K, factor, reductor) {
    const nodeGroups = groupNodesByInitial(nodeMap); // Agrupar nós por inicial (A, Q, K)
    Object.entries(nodeGroups).forEach(([key, nodes]) => {
        if (key == "A") {
            nodes.forEach(node => {
                const sortedLinks = node.sourceLinks.sort((a, b) => a.value - b.value);
                let yOffset = node.y + factor;

                sortedLinks.forEach(link => {
                    link.y0 = link.value == 1 ? yOffset : link.value == 2 ? yOffset + K : yOffset + 2 * K;
                });
            });
        } else if (key == "Q") {
            nodes.forEach((node, index) => {
                const sortedLinks = node.sourceLinks.sort((a, b) => a.value - b.value);

                let currentY = index == 0 ? node.y + sortedLinks[0].height / 2 : node.y;

                [1, 2, 3].forEach(value => {
                    const linksByValue = sortedLinks.filter(link => link.value
                        == value);

                    if (value > 1 && linksByValue.length > 0) currentY += linksByValue[0].height / 2;

                    if (linksByValue.length > 0) {
                        const y0 = currentY;
                        linksByValue.forEach(link => {
                            link.y0 = y0;
                        });
                        currentY += linksByValue[0].height / 2;
                    }
                });
            });
        }
    });
}


/**
 * This function processes a map of nodes and applies a given factor to each node.
 * 
 * @param {Object} nodeMap - An object where keys are node identifiers and values are node objects.
 * @param {number} factor - A numerical factor that will be applied to each node in the nodeMap.
 */
function defineY1ForLinks(nodeMap, link, K, factor, reductor) {
    const nodeGroups = groupNodesByInitial(nodeMap); // Agrupar nós por inicial (A, Q, K)

    Object.entries(nodeGroups).forEach(([key, nodes]) => {
        if (key == "Q") {
            nodes.forEach(node => {
                const sortedLinks = node.targetLinks.sort((a, b) => a.value - b.value);
                let currentY1 = node.y + factor;

                sortedLinks.forEach(link => {
                    link.y1 = currentY1;

                    link.targetNode.targetLinks.forEach(sourceLink => {
                        if (sourceLink == link) {
                            sourceLink.y1 = currentY1;
                        }
                    });

                    currentY1 += link.height;
                });
            });
        } else if (key == "K") {
            nodes.forEach((node) => {
                const sortedLinks = node.targetLinks.sort((a, b) => a.value - b.value);
                let currentY1 = node.y + (sortedLinks[0].height / 2) * reductor;

                sortedLinks.forEach((link, i) => {
                    const originalLink = links.find(l => l.id == link.id);
                    if (i != 0) {
                        currentY1 += (link.height / 2) * reductor;
                    }
                    link.y1 = currentY1;
                    originalLink.y1 = currentY1;

                    link.targetNode.targetLinks.forEach(sourceLink => {
                        if (sourceLink == link) {
                            sourceLink.y1 = currentY1;
                        }
                    });


                    currentY1 += (link.height / 2) * reductor;
                });
            });
        }
    });
}

/**
 * This function syncronize links based on nodeMap
 * @param {*} nodeMap - An object where keys are node identifiers and values are node objects.
 * @param {*} links - A list of original links
 */
function syncLinkPositions(nodeMap, links) {
    Object.values(nodeMap).forEach(node => {
        node.sourceLinks.forEach(sourceLink => {
            const originalLink = links.find(link =>
                link.source == sourceLink.sourceNode.id && link.target == sourceLink.targetNode.id && sourceLink.value == link.value
            );
            if (originalLink) {
                if (sourceLink.x0 !== undefined) originalLink.x0 = sourceLink.x0;
                if (sourceLink.x1 !== undefined) originalLink.x1 = sourceLink.x1;
                if (sourceLink.y0 !== undefined) originalLink.y0 = sourceLink.y0;
                if (sourceLink.y1 !== undefined) originalLink.y1 = sourceLink.y1;
                if (sourceLink.height !== undefined) originalLink.height = sourceLink.height;
            }
        });

        node.targetLinks.forEach(targetLink => {
            const originalLink = links.find(link =>
                link.source == targetLink.sourceNode.id && link.target == targetLink.targetNode.id && targetLink.value == link.value
            );
            if (originalLink) {
                if (targetLink.x0 !== undefined) originalLink.x0 = targetLink.x0;
                if (targetLink.x1 !== undefined) originalLink.x1 = targetLink.x1;
                if (targetLink.y0 !== undefined) originalLink.y0 = targetLink.y0;
                if (targetLink.y1 !== undefined) originalLink.y1 = targetLink.y1;
                if (targetLink.height !== undefined) originalLink.height = targetLink.height;
            }
        });
    });
}


// [MAP] map nodes and links
const nodeMap = createNodeMap(nodes, links);

// [MAP] define x position of node groups
const nodeGroups = groupNodesByInitial(nodeMap);
const nodeGroupKeys = Object.keys(nodeGroups);
const nodeWidth = 25;

const groupCount = nodeGroupKeys.length;
const groupSpacing = (width - nodeWidth) / (groupCount - 1);

nodeGroupKeys.forEach((key, index) => {
    let xPosition;
    if (index == 0) {
        xPosition = 0;
    } else if (index == groupCount - 1) {
        xPosition = width - nodeWidth;
    } else {
        xPosition = index * groupSpacing;
    }
    nodeGroups[key].forEach(node => {
        node.x = xPosition;
    });
});

// [MAP] map height of nodes
calculateNodePositions(nodeMap, K, gap, REDUCTOR);

// [MAP] map links height
calculateLinkHeights(nodeMap, K);
// [MAP] Define x0 and x1
Object.values(nodeMap).forEach(node => {
    node.targetLinks.forEach(link => {
        link.x0 = link.sourceNode.x;
        link.x1 = link.targetNode.x;
    });
});
// [MAP] Define y0 (out) and y1 (in)
defineY0ForLinks(nodeMap, links, K, FACTOR, REDUCTOR);
defineY1ForLinks(nodeMap, links, K, FACTOR, REDUCTOR);
syncLinkPositions(nodeMap, links);

// [DRAW] create svg
const svg = d3.select("#sankey")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// [DRAW] create nodes Vs
const Vs = svg.selectAll(".node")
    .data(Object.values(nodeMap))
    .enter()
    .append("rect")
    .attr("class", "node")
    .attr("x", d => {
        return d.x
    })
    .attr("y", d => d.y)
    .attr("width", nodeWidth)
    .attr("height", d => d.height)
    .style("fill", "steelblue");

const line = d3.line()
    .curve(d3.curveBasis)
    .x(d => d.x)
    .y(d => d.y);

const As = svg.selectAll(".link")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("d", d => {
        const sourceWidth = d.height;
        const targetWidth = d.target[0] === "K" ? d.height * REDUCTOR : d.height;

        const x0 = d.x0 + nodeWidth;
        const y0Top = d.y0 - sourceWidth / 2;
        const y0Bottom = d.y0 + sourceWidth / 2;

        const x1 = d.x1;
        const y1Top = d.y1 - targetWidth / 2;
        const y1Bottom = d.y1 + targetWidth / 2;

        const midX = (x0 + x1) / 2;

        return `
            M${x0},${y0Top}
            C${midX},${y0Top} ${midX},${y1Top} ${x1},${y1Top}
            L${x1},${y1Bottom}
            C${midX},${y1Bottom} ${midX},${y0Bottom} ${x0},${y0Bottom}
            Z
        `;
    })
    .attr("fill", d => {
        if (d.value == 1) return "#E07121";
        if (d.value == 2) return "#68E4C9";
        if (d.value == 3) return "#916BD4";
        return "lightgray"; // Cor padrão
    })
    .attr("opacity", 0.8) // Ajusta a opacidade do ribbon
    .on("mouseover", function () {
        d3.select(this)
            .attr("fill", "#D0D0D0") // Cor de destaque
            .attr("opacity", 1);   // Opacidade maior no hover
    })
    .on("mouseout", function () {
        d3.select(this)
            .attr("fill", d => {
                if (d.value == 1) return "#E07121";
                if (d.value == 2) return "#68E4C9";
                if (d.value == 3) return "#916BD4";
                return "lightgray";
            })
            .attr("opacity", 0.8); // Retorna ao estilo original
    });

