/**
 * Encuentra el camino más corto entre dos nodos usando el algoritmo de Dijkstra.
 * @param {Object} topologia - La topología de la red.
 * @param {string} nodoActual - El nodo de origen.
 * @returns {Object} - Un objeto que contiene las distancias y los nodos anteriores.
 */
let dijkstra = async (topologia, nodoActual) => {
    const distancia = {};
    const anterior = {};
    const lista = [];

    // Inicializamos las distancias y los nodos anteriores
    for (let nodo in topologia) {
        distancia[nodo] = Infinity;
        anterior[nodo] = null;
        lista.push(nodo);
    }

    distancia[nodoActual] = 0;

    while (lista.length > 0) {
        let nodo = lista.reduce((a, b) => distancia[a] < distancia[b] ? a : b);
        let vecinos = topologia[nodo];

        for (let vecino in vecinos) {
            let nuevaDistancia = distancia[nodo] + vecinos[vecino];
            if (nuevaDistancia < distancia[vecino]) {
                distancia[vecino] = nuevaDistancia;
                anterior[vecino] = nodo;
            }
        }
        lista.splice(lista.indexOf(nodo), 1);
    }

    return { distancia, anterior };
}

/**
 * Construye la tabla de ruteo usando el algoritmo de Dijkstra.
 * @param {Object} topologia - La topología de la red.
 * @param {string} nodoActual - El nodo de origen.
 * @returns {Object} - La tabla de ruteo.
 */
let construirTablaRuteo = async (topologia, nodoActual) => {
    let { distancia, anterior } = await dijkstra(topologia, nodoActual);
    let tabla = {};

    for (let nodo in distancia) {
        let ruta = [];
        let actual = nodo;

        while (actual) {
            ruta.unshift(actual);
            actual = anterior[actual];
        }

        tabla[nodo] = {
            distancia: distancia[nodo],
            ruta
        }
    }

    return tabla;
}

/**
 * Determines the next hop towards the destination node in the shortest path.
 * @param {Object} anterior - The map of previous nodes in the shortest path.
 * @param {string} destino - The destination node.
 * @param {string} nodoActual - The source node.
 * @returns {string} - The next hop node towards the destination.
 */
function encontrarSiguienteNodo(anterior, destino, nodoActual) {
    let siguiente = destino;
    
    // Traverse backwards from the destination to the source to find the next hop
    while (anterior[siguiente] && anterior[anterior[siguiente]] !== null && anterior[siguiente] !== nodoActual) {
        siguiente = anterior[siguiente];
    }
  
    // If the previous node is the source, return the destination itself as the next hop, otherwise return the next hop
    return anterior[destino] === nodoActual ? destino : siguiente;
}

module.export = { dijkstra };