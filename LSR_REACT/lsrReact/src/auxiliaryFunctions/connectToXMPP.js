import {client as xmppClient, xml} from '@xmpp/client';

/**
 * Connect to the XMPP server
 * @param jid
 * @param password
 * @returns {Promise<* & {tcp: *, sessionEstablishment: *, streamManagement: *, resolve: *, starttls: *, streamFeatures: *, iqCaller: *, sasl: *, resourceBinding: *, reconnect: *, websocket: *, tls: *, mechanisms: {}[], entity: *, middleware: *, iqCallee: *}>}
 */
export const connectToXMPP = async (jid, password) => {
    const client = xmppClient({
        service: 'ws://alumchat.lol:7070/ws/', // HTTP links should be avoided in production
        domain: 'alumchat.lol',
        username: jid,
        password: password,
    });

    client.on('error', (err) => {
        console.error('XMPP Error:', err);
    });

    try {
        await client.start();

        // Send presence stanza to indicate the user is online with show and status
        const presenceStanza = xml('presence', {},
            xml('show', {}, 'chat'),
            xml('status', {}, 'ready to chat')
        );
        client.send(presenceStanza);

        return client;
    } catch (error) {
        console.error('Failed to connect:', error);
        throw error;
    }
};




/**
 * Listen for all stanzas
 * @param client
 * @returns {(function(): void)|*}
 */
export const listenForAllStanzas = (client) => {
    const handleStanza = (stanza) => {
        console.log('Received stanza:', stanza.toString());
    };

    client.on('stanza', handleStanza);

    // Return a function to remove the listener when needed
    return () => {
        client.removeListener('stanza', handleStanza);
    };
};

/**
 * Logout the user
 * @param client
 * @returns {Promise<void>}
 */
export const logoutmng = async (client) => {
    try {
        // Send presence stanza to indicate the user is offline
        const presenceStanza = xml('presence', {type: 'unavailable'});
        await client.send(presenceStanza);

        // Stop the client
        await client.stop();
        console.log('Logged out successfully');
    } catch (error) {
        console.error('Failed to logout:', error);
        throw error;
    }
}
