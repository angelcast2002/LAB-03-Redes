const fs = require('fs');
const readline = require('readline');
const { connectToXmppServer, routingTableReady, getRoutingTable } = require('./client');  // Importar getRoutingTable
const { xml } = require('@xmpp/client');  // Importación necesaria para enviar mensajes
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

const sendMessageBasedOnRoutingTable = (xmppClient, destinationNode, message) => {
    const routingTable = getRoutingTable();  // Obtener la tabla de enrutamiento actualizada
    const nextHop = routingTable[destinationNode];
    if (nextHop) {
        xmppClient.send(xml('message', { to: nextHop.nextHop },
            xml('type', {}, 'chat'),
            xml('body', {}, message)
        ));
        console.log(`Mensaje enviado a ${destinationNode} a través de ${nextHop.nextHop}`);
    } else {
        console.error(`No se encontró ruta hacia ${destinationNode}`);
    }
};

const main = async () => {
    const nodeMapping = loadJSONFromFile('./names.txt');
    const networkTopology = loadJSONFromFile('./topo.txt');

    if (!nodeMapping || !networkTopology) {
        console.error("Error al cargar los archivos JSON.");
        return;
    }

    const currentNode = await new Promise((resolve) => rl.question("Ingrese el nodo a utilizar en la topología: ", resolve));
    const password = await new Promise((resolve) => rl.question("Ingrese la contraseña del usuario: ", resolve));

    console.log('Mapeo de Nodos:', nodeMapping);
    console.log('Nodo Actual:', currentNode);

    if (!nodeMapping['config'] || !nodeMapping['config'][currentNode]) {
        console.error(`El nodo ${currentNode} no se encuentra en nodeMapping['config']`);
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

    // Esperar a que se actualice la tabla de enrutamiento usando Promesas
    await routingTableReady;

    console.log('Verificando la tabla de enrutamiento...');
    const routingTable = getRoutingTable();  // Obtener la tabla de enrutamiento actualizada
    if (Object.keys(routingTable).length > 0) {
        console.log('Tabla de enrutamiento calculada:', routingTable);

        // Enviar un mensaje de prueba a un nodo de destino basado en la tabla de enrutamiento
        const testDestination = 'mor21146@alumchat.lol';  // Ahora utilizando la dirección XMPP completa
        const testMessage = 'Hola desde ' + currentNode;
        sendMessageBasedOnRoutingTable(xmppClient, testDestination, testMessage);
    } else {
        console.error("La tabla de enrutamiento no se ha calculado correctamente.");
    }

    // Cerrar la interfaz readline
    rl.close();
};

main();
