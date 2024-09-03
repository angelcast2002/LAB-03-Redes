const { client, xml } = require('@xmpp/client');

let xmppConnection;
let echoMessageTimestamps = {};  // Marca de tiempo de cada mensaje echo enviado
let roundTripTimesTable = {};  // Tiempos de ida y vuelta conocidos (RTT)
let currentNodeId;  // Almacenar el ID del nodo actual

/**
 * Inicia sesión en el servidor XMPP y configura el cliente.
 * @param {string} username - Nombre de usuario para el cliente XMPP.
 * @param {string} password - Contraseña para el cliente XMPP.
 * @param {Object} nodeMapping - Mapeo de nombres de nodos a direcciones XMPP.
 * @param {Object} networkTopology - Información de la topología de la red.
 * @param {string} currentNode - Identificador del nodo actual.
 * @returns {Object} El cliente XMPP inicializado.
 */
const connectToXmppServer = async (username, password, nodeMapping, networkTopology, currentNode) => {
    currentNodeId = currentNode;  // Asignar el nodo actual a la variable global

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
}

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
                
                // Almacenar el RTT en la tabla de tiempos conocidos
                if (!roundTripTimesTable[currentNodeId]) {
                    roundTripTimesTable[currentNodeId] = {};
                }
                roundTripTimesTable[currentNodeId][fromNodeJid] = roundTripTime;
            }
        }
    }
};

module.exports = { connectToXmppServer, handleIncomingMessage };
