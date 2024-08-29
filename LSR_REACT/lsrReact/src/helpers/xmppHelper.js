import { client as xmppClient, xml } from '@xmpp/client';



/**
 * Se encarga de conectar al usuario con el servidor XMPP.
 * Envia un mensaje de presencia al conectarse.
 * A partir de esta funcion, el cliente XMPP se mantiene conectado como variable global. 
 * @param {*} jid 
 * @param {*} password 
 * @returns {Promise<xmppClient>}
 */
export const connect = async (jid, password) => {


    const client = xmppClient({
        service: 'ws://alumchat.lol:7070/ws/',
        domain: 'alumchat.lol',
        resource: 'rn',
        username: jid,
        password: password,
    });

    client.on('online', async (address) => {
        console.log('Connected as', address.toString());
        await client.send(xml('presence', {}, xml('status', {}, `Hello, I'm ${jid}`), xml('show', {}, 'chat')));
    });

    client.on('offline', () => {
        console.log('Client went offline, attempting to reconnect...');
        client.start().catch(console.error);
    });

    try {
        await client.start();

        const presenceStanza = xml('presence', {}, xml('status', {}, `Hello, I'm ${jid}`), xml('show', {}, 'chat'));
        await client.send(presenceStanza);
        return client;
    } catch (err) {
        console.error(err);
        throw err;
    }
};


/**
 * Esta funcion debe ser reemplazada por la proporcionada por Yass. 
 * Por el momento, dejar así. 
 * @returns {Array<[string, number]>}
 */
export const getLocalContacts = () => {
    return [
        ['azu21243@alumchat.lol', 1]
    ];
};


/**
 * 
 * @param {*} contact 
 * @param {*} username 
 */
export const sendNeighborRequest = async (client, contact, username) => {
    const stanza = xml(
        'message',
        { to: contact },
        xml('body', {}, JSON.stringify({ type: 'echo', from: username }))
    );
    await client.send(stanza);
};

/**
 * Listener. Al recibir la stanza de tipo 'message' que en su body tiene un JSON con type: 'echo',
 * Obtiene LocalContacts y envia un mensaje a cada uno de ellos usando sendNeighborRequest.
 * Debe esperar a que se resuelvan todas las promesas de sendNeighborRequest antes de enviar la respuesta.
 * La respuesta es un array con los contactos locales y sus respectivos pesos.
 * 
 * @param callback
 * @returns {Promise<Array<[string, number]>>}
 */


export const listenerForNeighborRequests = async (client, callback) => {
    client.on('stanza', async (stanza) => {
        try {
            const body = JSON.parse(stanza.getChildText('body'));
            if (body.type === 'echo') {
                const localContacts = getLocalContacts();
                const promises = localContacts.map(([contact, weight]) => sendNeighborRequest(contact, body.from));
                await Promise.all(promises);
                const response = localContacts;
                callback(response);
            }
        } catch (error) {
            console.error('Failed to process stanza:', error);
            throw new Error('Failed to process stanza');
        }
    });
}


