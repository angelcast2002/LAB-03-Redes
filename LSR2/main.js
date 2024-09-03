// Variables globales para manejar los tiempos de eco y RTT
let echoMessageTimestamps = {};  // Marca de tiempo de cada mensaje echo enviado
let roundTripTimesTable = {};  // Tiempos de ida y vuelta conocidos (RTT)

const fs = require('fs');
const readline = require('readline');
const { connectToXmppServer } = require('./client');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Carga un archivo JSON y devuelve el objeto correspondiente.
 * @param {string} filename - Nombre del archivo JSON a cargar.
 * @returns {Object} Objeto JSON parseado.
 */
const loadJSONFromFile = (filename) => {
    try {
        const data = fs.readFileSync(filename, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error al leer o parsear el archivo", err);
        return null;
    }
};

const main = async () => {
    const nodeMapping = loadJSONFromFile('./names.txt');
    const networkTopology = loadJSONFromFile('./topo.txt');

    if (!nodeMapping || !networkTopology) {
        console.error("Error loading JSON files.");
        return;
    }

    const currentNode = await new Promise((resolve) => rl.question("Input the node to use in the topology: ", resolve));
    const password = await new Promise((resolve) => rl.question("Input user password: ", resolve));

    console.log('nodeMapping:', nodeMapping);
    console.log('currentNode:', currentNode);

    if (!nodeMapping['config'] || !nodeMapping['config'][currentNode]) {
        console.error(`Node ${currentNode} not found in nodeMapping['config']`);
        rl.close();
        return;
    }

    // Conectarse al servidor XMPP
    const xmppClient = await connectToXmppServer(
        nodeMapping['config'][currentNode].split('@')[0],   
        password, 
        nodeMapping, 
        networkTopology, 
        currentNode
    );

    console.log('Cliente XMPP conectado:', xmppClient.jid);

    // Puedes añadir aquí más lógica para enviar mensajes de prueba, etc.

    // Cerrar la interfaz readline
    rl.close();
};

main();
