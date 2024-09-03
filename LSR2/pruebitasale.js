const { login, sendMessage, resendEchoes, toggleLogs, dijkstra, construirTablaRuteo, encontrarSiguienteNodo } = require('./cliente'); // Reemplaza 'tuArchivo' por el nombre del archivo donde está tu código

(async () => {
    // Definir un ejemplo de topología de red
    const topologia = {
        'A': { 'B': 1, 'C': 4 },
        'B': { 'A': 1, 'C': 2, 'D': 5 },
        'C': { 'A': 4, 'B': 2, 'D': 1 },
        'D': { 'B': 5, 'C': 1 }
    };

    // Nodo actual (por ejemplo, 'A')
    const nodoActual = 'A';

    // Probar el algoritmo de Dijkstra
    console.log("Probando el algoritmo de Dijkstra:");
    const { distancia, anterior } = await dijkstra(topologia, nodoActual);
    console.log("Distancias:", distancia);
    console.log("Nodos anteriores:", anterior);

    // Probar la construcción de la tabla de ruteo
    console.log("\nConstruyendo la tabla de ruteo:");
    const tablaRuteo = await construirTablaRuteo(topologia, nodoActual);
    console.log("Tabla de ruteo:", tablaRuteo);

    // Probar encontrar el siguiente nodo hacia un destino (por ejemplo, hacia 'D')
    console.log("\nEncontrando el siguiente nodo hacia 'D':");
    const siguienteNodo = encontrarSiguienteNodo(anterior, 'D', nodoActual);
    console.log("Siguiente nodo hacia 'D':", siguienteNodo);

    // Configurar credenciales y detalles de conexión
    const username = 'azu21242@alumchat.lol';  // Reemplaza con tu nombre de usuario XMPP
    const password = 'azu21242';  // Reemplaza con tu contraseña XMPP
    const names = {
        'config': {
            'A': 'azu21242@alumchat.lol',
            'B': 'mor21146@alumchat.lol',
            'C': 'cas@alumchat.lol'
        }
    };
    const topo = {
        'config': {
            'A': ['B', 'C'],
            'B': ['A', 'C'],
            'C': ['A', 'B'],
        }
    };

    // Iniciar sesión en el servidor XMPP
    const client = await login(username, password, names, topo, nodoActual);

    // Probar el envío de un mensaje
    console.log("\nEnviando un mensaje de prueba:");
    sendMessage(client, 'C', 'Este es un mensaje de prueba desde A hacia C.');

    // Alternar logs
    toggleLogs(true);

    // Probar el reenvío de ecos
    console.log("\nReenviando mensajes de eco:");
    resendEchoes(client, names, topo, nodoActual);

    // Desconectar el cliente después de las pruebas
    setTimeout(() => {
        client.stop();
        console.log("Cliente desconectado.");
    }, 10000);  // Desconectar después de 10 segundos
})();
