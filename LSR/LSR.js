// Link State Routing

const { client, xml } = require("@xmpp/client");

let xmppClient;

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
      try {
        console.log("Stanza received:", stanza.toString());
        if (stanza.is("message")) {
          const type = stanza.attrs.type;
          if (type === "echo") {
            console.log("Echo stanza received");
          }
        }
      } catch (error) {
        console.error("Failed to process stanza:", error);
        throw new Error("Failed to process stanza");
      }
    });
    await xmppClient.start();
  } catch (err) {
    console.error("Failed to connect:", err);
  }
};

const logOut = async () => {
  if (xmppClient) {
    try {
      await xmppClient.send(xml("presence", { type: "unavailable" }));
      await xmppClient.stop();
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  }
};

/**
 * Pedir los contactos
 */
const getContacts = async () => {
  return [
    ["mor21146@alumchat.lol", 1],
    ["contact2@alumchat.lol", 1],
    ["contact3@alumchat.lol", 1]
  ];
};

/**
 * pedir la información de los contactos de nuestros contactos y sus pesos. 
 * Con una stanza personalizada, de tipo echo, que contenga el nombre de usuario y el peso.
 */
const getNeighbors = async (contact) => {
  // generar stanza
  const request_neighbors_stanza = xml(
    "message",
    { type: "echo", to: contact }
  );
  await xmppClient.send(request_neighbors_stanza);
}

const send_neighbors_stanza = async(contact) => {
  const neighbors = await getContacts();
  neighbors.forEach((neighbor) => {
    const neighbor_stanza = xml("neighbor", {}, neighbor[0], neighbor[1]);
    contact.append(neighbor_stanza);
  });
  await xmppClient.send(contact);
}
  

const main = async () => {
  const Username = "mor21146";
  const password = "1234";

  await connect(Username, password);
};

main().catch((err) => console.error("Error en la ejecución:", err));
