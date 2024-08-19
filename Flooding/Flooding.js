const { client, xml } = require("@xmpp/client");

let xmppClient;
let visitedMessages = new Set();

const getContacts = async () => {
  // Aquí deberías implementar la lógica para obtener los contactos de un nodo
  return ["mor21146@alumchat.lol", "contact2@alumchat.lol", "contact3@alumchat.lol"];
};

const floodMessage = async (body, destination) => {
  try {
    const contacts = await getContacts();

    for (const contact of contacts) {
      await sendMessage(contact, body, destination);
    }
    console.log("Flooding completed");
  } catch (err) {
    console.error("Failed to flood:", err);
  }
};

const sendMessage = async (to, body, destination) => {
  if (!xmppClient) return;
  const message = {
    type: "message",
    from: xmppClient.jid.toString(),
    to: destination,
    hops: 0,
    headers: [],
    payload: body
  };

  const xmlMessage = xml("message", { to, type: "chat" }, xml("body", {}, JSON.stringify(message)));
  await xmppClient.send(xmlMessage);
};

const connect = async (Username, password) => {
  try {
    xmppClient = client({
      service: "ws://alumchat.lol:7070/ws",
      domain: "alumchat.lol",
      resource: "ReactNative",
      username: Username,
      password,
    });

    xmppClient.on("online", async (address) => {
      console.log("Connected as", address.toString());
      await xmppClient.send(
        xml("presence", {}, xml("status", {}, `Hola soy ${Username}`), xml("show", {}, "chat"))
      );
    });

    xmppClient.on("stanza", async (stanza) => {
      if (stanza.is("message")) {
        const body = stanza.getChildText("body");
        if (body) {
          console.log("Received message:", body);
          const jsonMessage = JSON.parse(body);
          if (jsonMessage.to === Username) {
            console.log("Received message:", jsonMessage);
          } else {
            jsonMessage.hops++;
            await floodMessage(jsonMessage.payload, jsonMessage.to);
          }
        }
      }
    });

    await xmppClient.start();
  } catch (err) {
    console.error("Failed to connect:", err);
    throw err;
  }
};

const logOut = async () => {
  if (xmppClient) {
    try {
      await xmppClient.send(xml("presence", { type: "unavailable" }));
      await xmppClient.stop();
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  }
};

// Punto de entrada
const main = async () => {
  const Username = "cas21700"; // Cambia por tu nombre de usuario
  const password = "18sep2002"; // Cambia por tu contraseña

  await connect(Username, password);
  await floodMessage("Este mensaje es para Azurdia", "azu21243");
  // await logOut();
};

main().catch((err) => console.error("Error en la ejecución:", err));
