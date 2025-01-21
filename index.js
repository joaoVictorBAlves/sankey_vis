// [DATA] dataset
let { nodes, links } = generateDataset(10, 5, 5, 20, 40, 60);

// [SETUP] width and height available
const width = window.innerWidth - 35;
const height = window.innerHeight - 20;

// [SETUP] Spatial constants
const K = 10;
const REDUCTOR_Q = 0.8;
const REDUCTOR_K = 0.3;
const FACTOR = K / 2;
const gapA = 30;
const gapQ = 50;
const gapK = 50;

// [SETUP] Orders
const nodeOrder = { value: 3, order: "descending" }
const linksOrder = [1, 2, 3];

// [SETUP] Filters
const appearingValues = [2];

// [SETUP] Colors
let nodeColor = appearingValues.length > 2 ? "steelblue" : "gray";
let nodeColorOver = appearingValues.length > 2 ? "#003049" : "#444444";

// [ALL FUNCTIONS]
/**
 * Gera um dataset contendo nós de alunos (A), questões (Q) e habilidades (K),
 * e links que conectam esses nós. A função permite especificar a porcentagem de 
 * valores nos links de A → Q (valores 1, 2 ou 3). Se as porcentagens não forem 
 * especificadas, a distribuição será feita de forma aleatória.
 *
 * A função cria os seguintes tipos de links:
 * - A → Q: Conecta alunos (A) a questões (Q) com valores de 1, 2 ou 3.
 * - Q → K: Conecta questões (Q) a habilidades (K) com valores de 1, 2 ou 3, 
 *           baseados na quantidade de links A → Q com o mesmo valor.
 *
 * @param {number} numA - O número de alunos (A).
 * @param {number} numQ - O número de questões (Q).
 * @param {number} numK - O número de habilidades (K).
 * @param {number} [percentage1=null] - A porcentagem de links A → Q com valor 1 (entre 0 e 100).
 * @param {number} [percentage2=null] - A porcentagem de links A → Q com valor 2 (entre 0 e 100).
 * @param {number} [percentage3=null] - A porcentagem de links A → Q com valor 3 (entre 0 e 100).
 * 
 * @returns {Object} - Um objeto contendo:
 *  - `nodes` (Array): Um array com os nós gerados, incluindo alunos (A), questões (Q) e habilidades (K).
 *  - `links` (Array): Um array com os links gerados, contendo conexões A → Q e Q → K.
 */
function generateDataset(numA, numQ, numK, percentage1 = null, percentage2 = null, percentage3 = null) {
    const nodes = [];
    const links = [];
    const aToQLinks = []; // Armazena os links de A → Q

    // Gerar nós de alunos (A), questões (Q) e habilidades (K)
    for (let i = 1; i <= numA; i++) nodes.push({ id: `A${i}` });
    for (let i = 1; i <= numQ; i++) nodes.push({ id: `Q${i}` });
    for (let i = 1; i <= numK; i++) nodes.push({ id: `K${i}` });

    // Se não passar as porcentagens, gerar aleatoriamente
    if (percentage1 == null && percentage2 == null && percentage3 == null) {
        percentage1 = Math.random() * 100;
        percentage2 = Math.random() * (100 - percentage1);
        percentage3 = 100 - percentage1 - percentage2;
    }

    // Normalizar as porcentagens para garantir que somem 100%
    const totalPercentage = percentage1 + percentage2 + percentage3;
    const scale = 100 / totalPercentage;
    percentage1 = Math.round(percentage1 * scale);
    percentage2 = Math.round(percentage2 * scale);
    percentage3 = 100 - percentage1 - percentage2;

    // Função para gerar um valor aleatório de 1, 2 ou 3 com base nas porcentagens
    function getRandomValue() {
        const rand = Math.random() * 100;
        if (rand < percentage1) return 1;
        if (rand < percentage1 + percentage2) return 2;
        return 3;
    }

    // Gerar conexões de A → Q (um link único por A → Q)
    for (let i = 1; i <= numA; i++) {
        for (let j = 1; j <= numQ; j++) {
            aToQLinks.push({
                source: `A${i}`,
                target: `Q${j}`,
                value: getRandomValue() // Usar a função de valor aleatório com base nas porcentagens
            });
        }
    }

    // Adicionar links de A → Q ao array principal de links
    links.push(...aToQLinks);

    // Gerar conexões aleatórias de Q → K
    for (let i = 1; i <= numQ; i++) {
        const connectedKs = new Set(); // Evitar repetição de conexões Q → K

        // Decidir quantos K serão conectados aleatoriamente ao Q
        const numConnections = Math.floor(Math.random() * numK) + 1; // Pelo menos 1 K

        while (connectedKs.size < numConnections) {
            const randomK = `K${Math.floor(Math.random() * numK) + 1}`;
            if (!connectedKs.has(randomK)) {
                connectedKs.add(randomK);

                // Adicionar até 3 links para o mesmo Q → K com valores 1, 2, 3
                for (let value = 1; value <= 3; value++) {
                    // Calcular qtd para cada link
                    const qtd = aToQLinks.filter(
                        link => link.target == `Q${i}` && link.value == value
                    ).length;

                    // Adicionar o link Q → K
                    links.push({
                        source: `Q${i}`,
                        target: randomK,
                        value: value,
                        qtd: qtd
                    });
                }
            }
        }
    }

    return { nodes, links };
}


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
 * @param {number} gapA - The gapA between nodes in the same group.
 */
function calculateNodePositions(nodeMap, K, gapA, gapQ, gapK, reductor_Q, reductor_K) {
    const nodeGroups = groupNodesByInitial(nodeMap);

    Object.entries(nodeGroups).forEach(([key, nodes]) => {
        let currentY = 0;
        let gap;

        if (key == "A") {
            gap = gapA;
        } else if (key == "Q") {
            gap = gapQ;
        } else if (key == "K") {
            gap = gapK;
        }

        nodes.forEach(node => {
            if (key == "A") {
                // Grupo A: altura é 3 * K
                node.height = 3 * K;
            } else if (key == "Q") {
                // Grupo Q: altura é quantidade de links de entrada * K
                node.height = node.targetLinks.length * K * reductor_Q;
            } else if (key == "K") {
                // Grupo K: altura é o somatório das alturas dos links de saída
                node.height = node.targetLinks.reduce((sum, link) => {
                    return sum + (heightLink(link, K) * reductor_K);
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
function defineY0ForLinks(nodeMap, links, K, factor, reductor_Q, reductor_K) {
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

                let currentY = index == 0 ? node.y + (sortedLinks[0].height / 2) * reductor_Q : node.y + (sortedLinks[0].height / 2) * reductor_Q;

                [1, 2, 3].forEach(value => {
                    const linksByValue = sortedLinks.filter(link => link.value
                        == value);

                    if (value > 1 && linksByValue.length > 0) currentY += (linksByValue[0].height / 2) * reductor_Q;

                    if (linksByValue.length > 0) {
                        const y0 = currentY;
                        linksByValue.forEach(link => {
                            link.y0 = y0;
                        });
                        currentY += (linksByValue[0].height / 2) * reductor_Q;
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
function defineY1ForLinks(nodeMap, link, K, factor, reductor_Q, reductor_K) {
    const nodeGroups = groupNodesByInitial(nodeMap); // Agrupar nós por inicial (A, Q, K)

    Object.entries(nodeGroups).forEach(([key, nodes]) => {
        if (key == "Q") {
            nodes.forEach(node => {
                const sortedLinks = node.targetLinks.sort((a, b) => a.value - b.value);
                let currentY1 = node.y + (sortedLinks[0].height / 2) * reductor_Q;

                sortedLinks.forEach((link, i) => {
                    const originalLink = links.find(l => l.id == link.id);
                    if (i != 0) {
                        currentY1 += (link.height / 2) * reductor_Q;
                    }

                    link.y1 = currentY1;
                    originalLink.y1 = currentY1;

                    link.targetNode.targetLinks.forEach(sourceLink => {
                        if (sourceLink == link) {
                            sourceLink.y1 = currentY1;
                        }
                    });

                    currentY1 += (link.height / 2) * reductor_Q;
                });
            });
        } else if (key == "K") {
            nodes.forEach((node) => {
                const sortedLinks = node.targetLinks.sort((a, b) => a.value - b.value);
                let currentY1 = node.y + (sortedLinks[0].height / 2) * reductor_K;

                sortedLinks.forEach((link, i) => {
                    const originalLink = links.find(l => l.id == link.id);
                    if (i != 0) {
                        currentY1 += (link.height / 2) * reductor_K;
                    }
                    link.y1 = currentY1;
                    originalLink.y1 = currentY1;

                    link.targetNode.targetLinks.forEach(sourceLink => {
                        if (sourceLink == link) {
                            sourceLink.y1 = currentY1;
                        }
                    });


                    currentY1 += (link.height / 2) * reductor_K;
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

/**
 * Atualiza a cor de preenchimento dos nós conectados e a opacidade dos links relacionados com base em um link específico.
 *
 * @param {Object} link - O link central que será usado como base para encontrar nós e links conectados.
 * @param {number} opacityValue - O valor de opacidade a ser aplicado nos links relacionados.
 * @param {string} fillColor - A cor de preenchimento a ser aplicada aos nós conectados.
 */
function updateLinksAndNodesByLink(link, opacityValue, fillColor) {
    let conNodes = [];
    Vs._groups[0].forEach(node => {
        if (node.__data__.id == link.source || node.__data__.id == link.target)
            conNodes.push(node.__data__);
    });

    let midNode = conNodes.find(node => node.id[0] == "Q");
    let conLinks = [];

    if (midNode.id == link.source) {
        // Search in targetLinks
        conLinks = midNode.targetLinks.filter(l => l.value == link.value);
        conLinks.forEach(link => {
            Vs._groups[0].forEach(node => {
                if (node.__data__.id == link.source)
                    conNodes.push(node.__data__);
            });
        });
    } else {
        // Search in sourceLinks
        conLinks = midNode.sourceLinks.filter(l => l.value == link.value);
        conLinks.forEach(link => {
            Vs._groups[0].forEach(node => {
                if (node.__data__.id == link.target)
                    conNodes.push(node.__data__);
            });
        });
    }

    // Update the fill color of the nodes
    Vs._groups[0].filter(node => conNodes.includes(node.__data__)).forEach(node => {
        d3.select(node).select("rect").style("fill", fillColor);
    });

    // Update the opacity of the links
    As._groups[0].filter(linkElement =>
        conLinks.some(conLink =>
            conLink.source == linkElement.__data__.source &&
            conLink.target == linkElement.__data__.target &&
            conLink.value == linkElement.__data__.value
        )
    ).forEach(linkElement => {
        d3.select(linkElement).attr("opacity", opacityValue).raise();
    });
}

/**
 * Atualiza a cor de preenchimento dos nós conectados e a opacidade dos links relacionados com base em um nó específico.
 *
 * @param {Object} node - O nó central que será usado como base para encontrar nós e links conectados.
 * @param {number} opacityValue - O valor de opacidade a ser aplicado nos links relacionados.
 * @param {string} fillColor - A cor de preenchimento a ser aplicada aos nós conectados.
 */
function updateLinksAndNodesByNode(node, opacityValue, fillColor) {
    let conLinks = [];
    let conNodes = [];

    if (node?.targetLinks) conLinks.push(...node.targetLinks);
    if (node?.sourceLinks) conLinks.push(...node.sourceLinks);

    conLinks.forEach(link => {
        Vs._groups[0].forEach(node => {
            if (node.__data__.id == link.source || node.__data__.id == link.target)
                conNodes.push(node.__data__);
        });
    });

    if (node.id[0] != "Q") {
        conNodes.forEach(n => {
            if (node.id[0] == "K")
                if (n?.targetLinks) {
                    conLinks.push(...n.targetLinks)
                    n.targetLinks.forEach(l => {
                        Vs._groups[0].forEach(node => {
                            if (node.__data__.id == l.source)
                                conNodes.push(node.__data__);
                        });
                    })
                };
            if (node.id[0] == "A")
                if (n?.sourceLinks) {
                    conLinks.push(...n.sourceLinks)
                    n.sourceLinks.forEach(l => {
                        Vs._groups[0].forEach(nn => {
                            if (nn.__data__.id == l.target && nn.id[0] != node.id[0])
                                conNodes.push(nn.__data__);
                        });
                    })
                };

        })
    }

    conNodes = conNodes.filter(n => n.id[0] !== node.id[0]);

    // Update the fill color of the nodes
    Vs._groups[0].filter(node => conNodes.includes(node.__data__)).forEach(node => {
        d3.select(node).select("rect").style("fill", fillColor);
    });

    // Update the opacity of the links
    As._groups[0].filter(linkElement =>
        conLinks.some(conLink =>
            conLink.source == linkElement.__data__.source &&
            conLink.target == linkElement.__data__.target &&
            conLink.value == linkElement.__data__.value
        )
    ).forEach(linkElement => {
        d3.select(linkElement).attr("opacity", opacityValue).raise();
    });
}

/**
 * Sorts nodes based on the number of links with a specific value.
 *
 * @param {Object} nodeMap - A map of nodes where the key is the node id and the value is an object containing node details and links.
 * @param {number} value - The value to count in the links.
 * @param {string} order - The order to sort the nodes, either "ascending" or "descending".
 */
function sortNodesByLinkValue(nodeMap, value, order) {
    const nodes = Object.values(nodeMap);

    nodes.sort((a, b) => {
        let aLinksCount, bLinksCount;

        if (a.id[0] == 'A') {
            aLinksCount = a.sourceLinks.filter(link => link.value == value).length;
        } else {
            aLinksCount = a.targetLinks.filter(link => link.value == value).length;
        }

        if (b.id[0] == 'A') {
            bLinksCount = b.sourceLinks.filter(link => link.value == value).length;
        } else {
            bLinksCount = b.targetLinks.filter(link => link.value == value).length;
        }

        if (order == "ascending") {
            return aLinksCount - bLinksCount;
        } else if (order == "descending") {
            return bLinksCount - aLinksCount;
        } else {
            return 0;
        }
    });

    nodes.sort((a, b) => {
        if (a.id[0] == b.id[0]) {
            return 0;
        } else if (a.id[0] == 'A') {
            return -1;
        } else if (a.id[0] == 'Q' && b.id[0] !== 'A') {
            return -1;
        } else {
            return 1;
        }
    });

    return nodes;
}


// [MAP] map nodes and links
let nodeMap = createNodeMap(nodes, links);

// [SORT] Nodes
nodeMap = sortNodesByLinkValue(nodeMap, nodeOrder.value, nodeOrder.order)

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
calculateNodePositions(nodeMap, K, gapA, gapQ, gapK, REDUCTOR_Q, REDUCTOR_K);

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
defineY0ForLinks(nodeMap, links, K, FACTOR, REDUCTOR_Q, REDUCTOR_K);
defineY1ForLinks(nodeMap, links, K, FACTOR, REDUCTOR_Q, REDUCTOR_K);
syncLinkPositions(nodeMap, links);

// [SORT] Links
links = links.sort((a, b) => linksOrder.indexOf(a.value) - linksOrder.indexOf(b.value));

// [FILTER] Filter nodeMap
let nodeMapFiltered = Object.fromEntries(
    Object.entries(nodeMap).filter(([key, node]) => {
        if (node.id[0] == 'A') {
            return node.sourceLinks.some(link => appearingValues.includes(parseInt(link.value)));
        } else {
            return node.sourceLinks.some(link => appearingValues.includes(parseInt(link.value)) && link.qtd > 0) ||
                node.targetLinks.some(link => appearingValues.includes(parseInt(link.value)) && link.qtd > 0);
        }
    })
);

// [FILTER] Filter links
let filteredLinks = links.filter(link => appearingValues.includes(link.value));

// [DRAW] create svg
const svg = d3.select("#sankey")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("overflow", "visible");

d3.select("#sankey")
    .style("width", "100%")
    .style("height", `${height * 2}px`)
    .style("overflow-y", "auto")
    .style("overflow-x", "hidden");

// [DRAW] create nodes Vs (Nodes)
const Vs = svg.selectAll(".node")
    .data(Object.values(nodeMapFiltered))
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x}, ${d.y})`)

Vs.append("rect")
    .attr("width", nodeWidth)
    .attr("height", d => d.height)
    .style("fill", nodeColor)
    .on("mouseover", function () {
        d3.select(this)
            .style("fill", nodeColorOver);

        const node = d3.select(this)._groups[0][0].__data__;
        updateLinksAndNodesByNode(node, 1, nodeColorOver)

    })
    .on("mouseout", function () {
        d3.select(this)
            .style("fill", nodeColor);

        const node = d3.select(this)._groups[0][0].__data__;
        updateLinksAndNodesByNode(node, 0.5, nodeColor)

    });

// if (appearingValues.length < 3 && appearingValues.includes(1)) {
//     Vs.append("rect")
//         .attr("width", nodeWidth)
//         .attr("y", d => 0)
//         .attr("height", d => {
//             let Ys0 = []
//             let Ys1 = []
//             const links = filteredLinks.filter(link => link.source == d.id || link.target == d.id);
//             const mod = d.id[0] == "Q" ? K * REDUCTOR_Q : d.id[0] == "K" ? K * REDUCTOR_K : K;
//             links.forEach(link => {
//                 if (link.source == d.id) {
//                     Ys0.push(link.y0 - (link.qtd ? link.qtd * (mod / 2) : (mod / 2)));
//                 } else {
//                     Ys0.push(link.y1 - (link.qtd ? link.qtd * (mod / 2) : (mod / 2)));
//                 }
//             });
//             links.forEach(link => {
//                 if (link.source == d.id) {
//                     Ys1.push(link.y0 + (link.qtd ? link.qtd * (mod / 2) : (mod / 2)));
//                 } else {
//                     Ys1.push(link.y1 + (link.qtd ? link.qtd * (mod / 2) : (mod / 2)));
//                 }
//             });
//             const height = Math.max(...Ys1) - Math.min(...Ys0)
//             return height;
//         })
//         .style("fill", "steelblue")
// }
// if (appearingValues.length < 3 && appearingValues.includes(2)) {
//     Vs.append("rect")
//         .attr("width", nodeWidth)
//         .attr("y", d => {
//             console.log(d)
//             if (d.sourceLinks.filter(link => link.value == 1).length == 0) {
//                 return 0;
//             } else {
//                 const sourceLinks = d.sourceLinks.filter(link => link.value == 2);
//                 const minYLink = sourceLinks.sort((a, b) => a.y0 - b.y0)[0];
//                 return minYLink.y0 - (minYLink.qtd ? minYLink.qtd * (K * REDUCTOR_Q / 2) : (K * REDUCTOR_Q / 2));
//                 // return sourceLinks.y0 - (sourceLinks.value * (K * REDUCTOR_Q));
//             }
//             // if (d.id[0] == "Q") {
//             //     const sourceLinks = d.sourceLinks.find(link => link.value == 2);
//             //     console.log(sourceLinks)
//             //     return sourceLinks.y0 - (sourceLinks.value * (K * REDUCTOR_Q));
//             // } else if (d.id[0] == "K") {
//             //     // const links = filteredLinks.filter(link => link.source == d.id || link.target == d.id);
//             //     // const minYLink = links.reduce((minLink, currentLink) => {
//             //     //     return currentLink.y0 < minLink.y0 ? currentLink : minLink;
//             //     // }, links[0]);

//             //     // return minYLink.y0 - (minYLink.qtd ? minYLink.qtd * (K * REDUCTOR_K / 2) : (K * RED / 2));
//             // }
//             return K
//         })
//         .attr("height", d => {
//             let Ys0 = []
//             let Ys1 = []
//             const links = filteredLinks.filter(link => link.source == d.id || link.target == d.id);
//             const mod = d.id[0] == "Q" ? K * REDUCTOR_Q : d.id[0] == "K" ? K * REDUCTOR_K : K;
//             links.forEach(link => {
//                 if (link.source == d.id) {
//                     Ys0.push(link.y0 - (link.qtd ? link.qtd * (mod / 2) : (mod / 2)));
//                 } else {
//                     Ys0.push(link.y1 - (link.qtd ? link.qtd * (mod / 2) : (mod / 2)));
//                 }
//             });
//             links.forEach(link => {
//                 if (link.source == d.id) {
//                     Ys1.push(link.y0 + (link.qtd ? link.qtd * (mod / 2) : (mod / 2)));
//                 } else {
//                     Ys1.push(link.y1 + (link.qtd ? link.qtd * (mod / 2) : (mod / 2)));
//                 }
//             });
//             const height = Math.max(...Ys1) - Math.min(...Ys0)
//             return height;
//         })
//         .style("fill", "steelblue")
// }
// if (appearingValues.length < 3 && appearingValues.includes(3)) {
//     Vs.append("rect")
//         .attr("width", nodeWidth)
//         .attr("y", d => 0)
//         .attr("height", d => {
//             let Ys0 = []
//             let Ys1 = []
//             const links = filteredLinks.filter(link => link.source == d.id || link.target == d.id);
//             const mod = d.id[0] == "Q" ? K * REDUCTOR_Q : d.id[0] == "K" ? K * REDUCTOR_K : K;
//             links.forEach(link => {
//                 if (link.source == d.id) {
//                     Ys0.push(link.y0 - (link.qtd ? link.qtd * (mod / 2) : (mod / 2)));
//                 } else {
//                     Ys0.push(link.y1 - (link.qtd ? link.qtd * (mod / 2) : (mod / 2)));
//                 }
//             });
//             links.forEach(link => {
//                 if (link.source == d.id) {
//                     Ys1.push(link.y0 + (link.qtd ? link.qtd * (mod / 2) : (mod / 2)));
//                 } else {
//                     Ys1.push(link.y1 + (link.qtd ? link.qtd * (mod / 2) : (mod / 2)));
//                 }
//             });
//             const height = Math.max(...Ys1) - Math.min(...Ys0)
//             return height;
//         })
//         .style("fill", "steelblue")
// }

Vs.append("text")
    .text(d => d.id)
    .attr("x", nodeWidth / 2)
    .attr("y", d => d.height / 2)
    .attr("dy", "0.35em")
    .style("fill", "white")
    .style("font-size", "12px")
    .style("text-anchor", "middle")
    .style("font-family", "Arial, sans-serif");

// [DRAW] create links As (Links)
const line = d3.line()
    .curve(d3.curveBasis)
    .x(d => d.x)
    .y(d => d.y);

const As = svg.selectAll(".link")
    .data(filteredLinks)
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("d", d => {
        const sourceWidth = d.source[0] == "Q" ? d.height * REDUCTOR_Q : d.height;
        const targetWidth = d.target[0] == "Q" ? d.height * REDUCTOR_Q : d.target[0] == "K" ? d.height * REDUCTOR_K : d.height;

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
        if (d.value == 2) return "#916BD4";
        if (d.value == 3) return "#68E4C9";
        return "lightgray";
    })
    .attr("opacity", 0.5)
    .on("mouseover", function () {
        d3.select(this)
            .attr("opacity", 1.2)
            .raise();

        const link = d3.select(this)._groups[0][0].__data__;
        updateLinksAndNodesByLink(link, 1, nodeColorOver)

    })
    .on("mouseout", function () {
        d3.select(this)
            .attr("fill", d => {
                if (d.value == 1) return "#E07121";
                if (d.value == 2) return "#916BD4";
                if (d.value == 3) return "#68E4C9";
                return "lightgray";
            })
            .attr("opacity", 0.5);

        const link = d3.select(this)._groups[0][0].__data__;
        updateLinksAndNodesByLink(link, 0.5, nodeColor)

    });

