const calculateShortestPaths = async (networkGraph, sourceNode) => {
    const shortestDistances = {};  // Almacena las distancias más cortas conocidas a cada nodo
    const previousNodes = {};  // Almacena el nodo previo en la ruta más corta
    const unvisitedNodes = new Set(Object.keys(networkGraph));  // Conjunto de nodos no visitados

    // Inicializar distancias y nodos previos
    for (const node in networkGraph) {
        shortestDistances[node] = Infinity;  // Inicialmente, todas las distancias son infinitas
        previousNodes[node] = null;  // No se conocen nodos previos
    }
    shortestDistances[sourceNode] = 0;  // La distancia al nodo fuente es 0

    // Mientras haya nodos no visitados
    while (unvisitedNodes.size > 0) {
        // Seleccionar el nodo no visitado con la distancia más corta
        let closestUnvisitedNode = null;
        for (const node of unvisitedNodes) {
            if (closestUnvisitedNode === null || shortestDistances[node] < shortestDistances[closestUnvisitedNode]) {
                closestUnvisitedNode = node;
            }
        }

        if (closestUnvisitedNode === null || shortestDistances[closestUnvisitedNode] === Infinity) {
            break;  // No hay más nodos alcanzables
        }

        // Remover el nodo más cercano de los nodos no visitados
        unvisitedNodes.delete(closestUnvisitedNode);

        // Actualizar distancias a los nodos vecinos
        for (const neighbor in networkGraph[closestUnvisitedNode]) {
            const newDistance = shortestDistances[closestUnvisitedNode] + networkGraph[closestUnvisitedNode][neighbor];
            if (newDistance < shortestDistances[neighbor]) {
                shortestDistances[neighbor] = newDistance;
                previousNodes[neighbor] = closestUnvisitedNode;
            }
        }
    }

    // Construir la tabla de enrutamiento basada en las distancias calculadas
    const routingTable = {};
    for (const destination in shortestDistances) {
        if (destination !== sourceNode && shortestDistances[destination] !== Infinity) {
            routingTable[destination] = {
                nextHop: determineNextHop(previousNodes, destination, sourceNode),
                cost: shortestDistances[destination]
            };
        }
    }
    return routingTable;
};

function determineNextHop(previousNodes, destinationNode, sourceNode) {
    let nextHopNode = destinationNode;
    while (previousNodes[nextHopNode] && previousNodes[nextHopNode] !== sourceNode) {
        nextHopNode = previousNodes[nextHopNode];
    }
    return nextHopNode;
}

module.exports = { calculateShortestPaths };
