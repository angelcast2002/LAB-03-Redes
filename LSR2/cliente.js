const { client, xml } = require('@xmpp/client');
const debug = require('@xmpp/debug');

// Importamos la función `dijkstra` del archivo LSR
const { dijkstra } = require('./dijsktra');

let XMPPclient;
let echoTimes = {};
let knownTimes = {};
let routingTable = {};
let logs = true;

/**
 * Inicia sesión en el servidor XMPP e inicializa el cliente.
 * @param {string} username - El nombre de usuario para el cliente XMPP.
 * @param {string} password - La contraseña para el cliente XMPP.
 * @param {Object} names - Mapeo de nombres de nodos a direcciones XMPP.
 * @param {Object} topo - Información de la topología de la red.
 * @param {string} currentNode - El identificador del nodo actual.
 * @returns {Object} El cliente XMPP inicializado.
 */
const login = async (username, password, names, topo, currentNode) => {
    XMPPclient = client({
        service: 'ws://alumchat.lol:7070/ws/',
        domain: 'alumchat.lol',
        username: username,
        password: password,
    });

    // debug(XMPPclient, true);

    XMPPclient.on('online', async (address) => {
        console.log(`Connected as ${address.toString()}`);
        XMPPclient.send(xml('presence'));

        knownTimes[names['config'][currentNode]] = {};

        setTimeout(() => {
            topo['config'][currentNode].forEach(element => {
                const timestamp = Date.now();
                echoTimes[names['config'][element]] = timestamp;

                XMPPclient.send(
                    xml('message', { 'type': 'normal', 'to': names['config'][element] },
                        xml('type', {}, 'echo'),
                        xml('body', {}, 'echo'),
                        xml('hops', {}, '1')
                    )
                );
            });
        }, 2000);
    });

    XMPPclient.on('stanza', async (stanza) => {
        if (stanza.is('message') && stanza.getChildText('type') === 'echo') {
            const fromNode = stanza.attrs.from.split('/')[0];
            const hops = stanza.getChildText('hops');

            if (hops === '1') {
                XMPPclient.send(
                    xml('message', { 'to': fromNode },
                        xml('type', {}, 'echo'),
                        xml('body', {}, stanza.getChild('body').text()),
                        xml('hops', {}, '2')
                    )
                );

                if (!knownTimes[names['config'][currentNode]][fromNode]) {
                    const timestamp = Date.now();
                    echoTimes[fromNode] = timestamp;

                    XMPPclient.send(
                        xml('message', { 'type': 'normal', 'to': fromNode },
                            xml('type', {}, 'echo'),
                            xml('body', {}, 'echo'),
                            xml('hops', {}, '1')
                        )
                    );
                }

            } else if (hops === '2') {
                const sentTime = echoTimes[fromNode];
                if (sentTime) {
                    const roundTripTime = Date.now() - sentTime;
                    console.log(`Round-trip time to ${fromNode}: ${roundTripTime} ms`);
                    delete echoTimes[fromNode];

                    if (!knownTimes[names['config'][currentNode]]) {
                        knownTimes[names['config'][currentNode]] = {};
                    }

                    knownTimes[names['config'][currentNode]][fromNode] = roundTripTime;

                    startFlood(XMPPclient, topo['config'][currentNode].map(node => {
                        return names['config'][node];
                    }));
                }
            }
        } else if (stanza.is('message') && stanza.getChildText('type') === 'info') {
            const receivedTimes = JSON.parse(stanza.getChild('table').getText());

            mergeKnownTimes(receivedTimes, names['config'][currentNode]);

            if (!stanza.getChild('headers')) {
                propagateFlood(XMPPclient, stanza, topo['config'][currentNode].map(node => {
                    return names['config'][node];
                }));

                XMPPclient.send(
                    xml('message', { to: stanza.attrs.from.split('/')[0] },
                        xml('type', {}, 'info'),
                        xml('headers', {}, ['no-flood']),
                        xml('table', {}, 
                            JSON.stringify(knownTimes)
                        ),
                        xml('hops', {}, 1)
                    )
                );
            }

        } else if (stanza.is('message') && stanza.attrs.type === 'chat') {
            const message = JSON.parse(stanza.getChildText('body'));

            if (message.to === `${XMPPclient.jid._local}@alumchat.lol`) {
                console.log(`\nMESSAGE RECEIVED FROM ${message.from} AFTER ${message.hops} HOPS: ${message.payload}\n`);
            } else {
                if (routingTable[message.to]) {
                    const nextHop = routingTable[message.to]['nextHop'];
                    console.log(`\nFORWARDING MESSAGE FROM ${stanza.attrs.from.split('/')[0]} TO ${nextHop}\n`);
                    XMPPclient.send(xml('message', { to: nextHop, type: 'chat' }, 
                        xml('body', {}, JSON.stringify({
                            type: 'message',
                            from: message.from,
                            to: message.to,
                            headers: message.headers,
                            hops: parseInt(message.hops) + 1,
                            payload: message.payload,
                        })))
                    );
                } else {
                    console.error(`\nFORWARDING ERROR: No viable route found for the message (to: ${message.to})\n`);
                }
            }
        }
    });

    XMPPclient.on('error', (err) => {
        console.error('ERROR', err);
    });

    XMPPclient.on('offline', () => {
        console.log('Disconnected');
    });

    XMPPclient.start().catch(console.error);

    return XMPPclient;
}

/**
 * Fusiona los tiempos conocidos recibidos con los tiempos conocidos locales y actualiza la tabla de ruteo.
 * @param {Object} receivedTimes - Los tiempos de ida y vuelta recibidos de otro nodo.
 * @param {string} source - El identificador del nodo fuente.
 */
const mergeKnownTimes = async (receivedTimes, source) => {
    for (const node in receivedTimes) {
        if (!knownTimes[node]) {
            knownTimes[node] = receivedTimes[node];
        } else {
            for (const target in receivedTimes[node]) {
                if (!knownTimes[node][target] || receivedTimes[node][target] < knownTimes[node][target]) {
                    knownTimes[node][target] = receivedTimes[node][target];
                }
            }
        }
    }

    // Usar la función dijkstra para construir la tabla de ruteo
    routingTable = await construirTablaRuteo(knownTimes, source);

    if (logs) {
        console.log('\nUPDATED ROUTING TABLE');
        console.log(routingTable);
    }
};

/**
 * Envía un mensaje al destinatario especificado, determinando el siguiente salto según la tabla de ruteo.
 * @param {Object} client - La instancia del cliente XMPP.
 * @param {string} to - El identificador del destinatario.
 * @param {string} payload - La carga útil del mensaje a enviar.
 */
const sendMessage = (client, to, payload) => {
    if (!routingTable[`${to}@alumchat.lol`]) {
        console.log('ERROR: No viable route found for the message');
        return;
    }
    const nextHop = routingTable[`${to}@alumchat.lol`]['nextHop'];
    client.send(xml('message', { to: nextHop, type: 'chat' }, 
        xml('body', {}, JSON.stringify({
            type: 'message',
            from: `${client.jid._local}@alumchat.lol`,
            to: `${to}@alumchat.lol`,
            headers: [],
            hops: 1,
            payload: payload,
        })))
    );
};

/**
 * Reenvía mensajes de eco a todos los nodos vecinos para medir nuevamente los tiempos de ida y vuelta.
 * @param {Object} client - La instancia del cliente XMPP.
 * @param {Object} names - Mapeo de nombres de nodos a direcciones XMPP.
 * @param {Object} topo - Información de la topología de la red.
 * @param {string} currentNode - El identificador del nodo actual.
 */
const resendEchoes = (client, names, topo, currentNode) => {
    topo['config'][currentNode].forEach(element => {
        const timestamp = Date.now();
        echoTimes[names['config'][element]] = timestamp;

        client.send(
            xml('message', { 'type': 'normal', 'to': names['config'][element] },
                xml('type', {}, 'echo'),
                xml('body', {}, 'echo'),
                xml('hops', {}, '1')
            )
        );
    });
};

/**
 * Activa o desactiva el registro de actualizaciones de la tabla de ruteo y otra información de depuración.
 * @param {boolean} newValue - El nuevo valor para la configuración de registro (true para activar, false para desactivar).
 */
const toggleLogs = (newValue) => {
    logs = newValue;
};

module.exports = { login, sendMessage, resendEchoes, toggleLogs };

// Exportamos la función dijkstra y la función de construir la tabla de ruteo
module.exports = { dijkstra, construirTablaRuteo, encontrarSiguienteNodo };
