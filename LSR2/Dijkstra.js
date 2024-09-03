/**
 * Implementación del algoritmo de Dijkstra para calcular las rutas más cortas desde un nodo fuente a todos los demás nodos en la red.
 * @param {Object} networkGraph - Grafo de la red representado como una tabla de adyacencia con tiempos de ida y vuelta (RTT).
 * @param {string} sourceNode - Nodo fuente desde el cual se calcularán las rutas más cortas.
 * @returns {Object} routingTable - Tabla de enrutamiento con el siguiente salto y el costo hacia cada nodo de destino.
 */
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
        if (destination !== sourceNode) {
            routingTable[destination] = {
                nextHop: determineNextHop(previousNodes, destination, sourceNode),
                cost: shortestDistances[destination]
            };
        }
    }
    return routingTable;
};

/**
 * Determina el siguiente salto hacia el destino en la ruta más corta.
 * @param {Object} previousNodes - Mapa de nodos previos en la ruta más corta.
 * @param {string} destinationNode - Nodo de destino.
 * @param {string} sourceNode - Nodo fuente.
 * @returns {string} nextHopNode - Nodo del siguiente salto hacia el destino.
 */
function determineNextHop(previousNodes, destinationNode, sourceNode) {
    let nextHopNode = destinationNode;
    while (previousNodes[nextHopNode] && previousNodes[nextHopNode] !== sourceNode) {
        nextHopNode = previousNodes[nextHopNode];
    }
    return nextHopNode;
}

module.exports = { calculateShortestPaths };
