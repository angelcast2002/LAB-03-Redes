const calculateShortestPaths = (graph, startNode) => {
    const distances = {};
    const previousNodes = {};
    const remainingNodes = new Set(Object.keys(graph));

    // Inicializar las distancias
    for (const node of remainingNodes) {
        distances[node] = Infinity;
        previousNodes[node] = null;
    }
    distances[startNode] = 0;

    while (remainingNodes.size > 0) {
        const closestNode = Array.from(remainingNodes).reduce((closest, node) => 
            distances[node] < distances[closest] ? node : closest
        );

        remainingNodes.delete(closestNode);

        for (const neighbor in graph[closestNode]) {
            const alternateDist = distances[closestNode] + graph[closestNode][neighbor];
            if (alternateDist < distances[neighbor]) {
                distances[neighbor] = alternateDist;
                previousNodes[neighbor] = closestNode;
            }
        }
    }

    // Construir la tabla de enrutamiento
    const routingTable = {};
    for (const node in distances) {
        if (node !== startNode) {
            let nextHop = node;
            while (previousNodes[nextHop] !== startNode && previousNodes[nextHop] !== null) {
                nextHop = previousNodes[nextHop];
            }

            routingTable[node] = { nextHop, cost: distances[node] };
        }
    }

    return routingTable;
};

module.exports = { calculateShortestPaths };
