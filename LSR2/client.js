const { client, xml } = require('@xmpp/client');
const { calculateShortestPaths } = require('./dijkstra');  // Importar la función desde Dijkstra.js

let xmppConnection;
let echoMessageTimestamps = {};  // Marca de tiempo de cada mensaje echo enviado
let roundTripTimesTable = {};  // Tiempos de ida y vuelta conocidos (RTT)
let routingTable = {};  // Tabla de enrutamiento
let currentNodeId;  // Almacenar el ID del nodo actual
let nodeMapping;
let networkTopology;
let routingTableReadyResolver;  // Resolver para la promesa de la tabla de enrutamiento

// Promesa que se resuelve cuando la tabla de enrutamiento esté lista
const routingTableReady = new Promise((resolve) => {
    routingTableReadyResolver = resolve;
});

/**
 * Construye un grafo completo usando la topología conocida y los RTT medidos.
 * @param {Object} nodeMapping - Mapeo de nombres de nodos a direcciones XMPP.
 * @param {Object} networkTopology - Topología de la red.
 * @returns {Object} Grafo completo de la red.
 */
const buildFullGraph = (nodeMapping, networkTopology) => {
    const fullGraph = {};

    for (const nodeKey in nodeMapping['config']) {
        const node = nodeMapping['config'][nodeKey];

        if (!fullGraph[node]) {
            fullGraph[node] = {};
        }

        // Agregar conexiones basadas en la topología conocida
        for (const neighbor of networkTopology['config'][nodeKey]) {
            fullGraph[node][nodeMapping['config'][neighbor]] = 1;  // Simular un peso de 1 para las conexiones
        }
    }

    return fullGraph;
};

/**
 * Actualiza la tabla de enrutamiento usando el algoritmo de Dijkstra.
 */
const updateRoutingTable = async () => {
    const fullGraph = buildFullGraph(nodeMapping, networkTopology);
    
    // Luego mezcla esta información con el RTT real
    for (const node in roundTripTimesTable) {
        if (!fullGraph[node]) {
            fullGraph[node] = {};
        }

        for (const neighbor in roundTripTimesTable[node]) {
            fullGraph[node][neighbor] = roundTripTimesTable[node][neighbor];
        }
    }

    console.log('Grafo completo para Dijkstra:', fullGraph);
    routingTable = await calculateShortestPaths(fullGraph, currentNodeId);
    console.log('Tabla de enrutamiento actualizada:', routingTable);

    // Resolver la promesa para indicar que la tabla de enrutamiento está lista
    routingTableReadyResolver();
};

/**
 * Inicia sesión en el servidor XMPP y configura el cliente.
 * @param {string} username - Nombre de usuario para el cliente XMPP.
 * @param {string} password - Contraseña para el cliente XMPP.
 * @param {Object} nodeMappingParam - Mapeo de nombres de nodos a direcciones XMPP.
 * @param {Object} networkTopologyParam - Información de la topología de la red.
 * @param {string} currentNode - Identificador del nodo actual.
 * @returns {Object} El cliente XMPP inicializado.
 */
const connectToXmppServer = async (username, password, nodeMappingParam, networkTopologyParam, currentNode) => {
    currentNodeId = currentNode;  // Asignar el nodo actual a la variable global
    nodeMapping = nodeMappingParam;
    networkTopology = networkTopologyParam;

    xmppConnection = client({
        service: 'ws://alumchat.lol:7070/ws/',
        domain: 'alumchat.lol',
        username: username,
        password: password,
    });

    xmppConnection.on('online', async (jid) => {
        console.log(`Conectado como ${jid.toString()}`);
        xmppConnection.send(xml('presence'));

        // Enviar un mensaje de echo inicial a los nodos vecinos
        setTimeout(() => {
            networkTopology['config'][currentNode].forEach(neighbor => {
                const currentTime = Date.now();
                echoMessageTimestamps[nodeMapping['config'][neighbor]] = currentTime;

                // Enviar mensaje de eco
                xmppConnection.send(
                    xml('message', { 'type': 'normal', 'to': nodeMapping['config'][neighbor] },
                        xml('type', {}, 'echo'),
                        xml('body', {}, 'Echo from ' + currentNode)
                    )
                );
            });
        }, 2000);
    });

    xmppConnection.on('stanza', handleIncomingMessage);

    xmppConnection.on('error', (error) => {
        console.error('ERROR:', error);
    });

    xmppConnection.on('offline', () => {
        console.log('Desconectado del servidor XMPP');
    });

    await xmppConnection.start().catch(console.error);

    return xmppConnection;
};

/**
 * Maneja los mensajes entrantes y responde a los mensajes de eco.
 * @param {Object} stanza - El mensaje XMPP recibido.
 */
const handleIncomingMessage = (stanza) => {
    if (stanza.is('message')) {
        const messageType = stanza.getChildText('type');
        const fromNodeJid = stanza.attrs.from.split('/')[0];
        
        if (messageType === 'echo') {
            console.log(`Echo recibido de: ${fromNodeJid}`);
            
            // Responder con un mensaje de echo-response
            xmppConnection.send(
                xml('message', { to: fromNodeJid },
                    xml('type', {}, 'echo-response'),
                    xml('body', {}, 'Echo response from ' + currentNodeId)
                )
            );
        } else if (messageType === 'echo-response') {
            // Calcular RTT basado en el tiempo de envío original
            const originalSendTime = echoMessageTimestamps[fromNodeJid];
            if (originalSendTime) {
                const roundTripTime = Date.now() - originalSendTime;
                console.log(`RTT a ${fromNodeJid}: ${roundTripTime} ms`);
                delete echoMessageTimestamps[fromNodeJid];
                
                // Asegurarse de que el formato de roundTripTimesTable sea correcto
                if (!roundTripTimesTable[currentNodeId]) {
                    roundTripTimesTable[currentNodeId] = {};
                }
                roundTripTimesTable[currentNodeId][fromNodeJid] = roundTripTime;

                // Después de actualizar RTT, actualiza la tabla de enrutamiento
                updateRoutingTable();
            }
        }
    }
};

// Nueva función para obtener la tabla de enrutamiento actual
const getRoutingTable = () => routingTable;

module.exports = { connectToXmppServer, handleIncomingMessage, routingTableReady, getRoutingTable };
