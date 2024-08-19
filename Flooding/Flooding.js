const { client, xml } = require("@xmpp/client");

let xmppClient;
let visitedMessages = new Set();

const getContacts = async () => {
  // Aquí deberías implementar la lógica para obtener los contactos de un nodo
  return [
    "mor21146@alumchat.lol",
    "contact2@alumchat.lol",
    "contact3@alumchat.lol",
  ];
};

const floodMessage = async (message, from=null) => {
  try {
    const contacts = await getContacts();

    for (const contact of contacts) {
      if (contact === from) continue;
      // console.log("Enviando mensaje a ", contact, from);
      await sendMessage(contact, message);
    }
    console.log("Flooding completed");
  } catch (err) {
    console.error("Failed to flood:", err);
  }
};

const sendMessage = async (to, message) => {
  if (!xmppClient) return;
  // console.log("Sending message:", message);
  const xmlMessage = xml(
    "message",
    { to, type: "chat" },
    xml("body", {}, JSON.stringify(message))
  );
  // console.log("Sending message:", xmlMessage);
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
        xml(
          "presence",
          {},
          xml("status", {}, `Hola soy ${Username}`),
          xml("show", {}, "chat")
        )
      );
    });

    xmppClient.on("stanza", async (stanza) => {
      if (stanza.is("message")) {
        const body = stanza.getChildText("body");
        if (body) {
          try {
            const jsonMessage = JSON.parse(body);
            const from = stanza.attrs.from.split("/")[0];
            // console.log("Received message:", jsonMessage.to);
            // console.log(jsonMessage);
            if (jsonMessage.to.split("@")[0] === Username) {
              console.log("Mensaje recibido de ", jsonMessage.from);
              console.log("Mensaje: ", jsonMessage.payload);
              console.log("Hops: ", jsonMessage.hops);
            } else {
              jsonMessage.hops++;
              await floodMessage(jsonMessage, from);
            }
          } catch (err) {
            console.log("Mensaje no sigue el formato correcto");
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
  const message = {
    type: "message",
    from: Username + "@alumchat.lol",
    to: "mor21146@alumchat.lol",
    hops: 0,
    headers: [],
    payload: "Este mensaje es para Mora",
  };
  await floodMessage(message);
  // await logOut();
};

main().catch((err) => console.error("Error en la ejecución:", err));
