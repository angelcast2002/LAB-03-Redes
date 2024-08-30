// Link State Routing

const { client, xml } = require("@xmpp/client");

let xmppClient;
let localUsername;
let fetchedNodes = new Set();
// {nodo: [[vecino, peso], [vecino, peso]]}
let allNodes = {};

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
        // Ignorar stanzas que contienen el elemento <event> con el namespace http://jabber.org/protocol/pubsub#event
        if (
          stanza.getChild("event", "http://jabber.org/protocol/pubsub#event")
        ) {
          return;
        }
        if (stanza.is("message")) {
          console.log("Message stanza received:", stanza.toString());
          const type = stanza.attrs.type;
          if (type === "chat") {
            const body = stanza.getChildText("body");
            if (body) {
              const jsonBody = JSON.parse(body);
              if (jsonBody.type === "echo") {
                const neighbors = getLocalContacts();
                const response = [];
                for (let i = 0; i < neighbors.length; i++) {
                  response.push(neighbors[i]);
                }

                for (let i = 0; i < neighbors.length; i++) {
                  if (
                    neighbors[i][0] === jsonBody.from ||
                    neighbors[i][0] === localUsername ||
                    fetchedNodes.has(neighbors[i][0])
                  ) {
                    continue;
                  }
                  fetchedNodes.add(neighbors[i][0]);
                  const contacts = await getNeighbors(
                    neighbors[i][0],
                    localUsername
                  );
                  if (contacts) {
                    response.push(contacts);
                  }
                }

                console.log("allNodes:", response);
                await sendNeighbors(response, jsonBody.from);
              } else if (jsonBody.type === "info") {
                const from =
                  stanza.attrs.from?.split("/")[0] || stanza.attrs.from;
                console.log("payLoad:", jsonBody.payload);
                allNodes[from] = jsonBody.payload;
                console.log("allNodes:", allNodes);
              }
            }
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
const getLocalContacts = () => {
  //["mor21146@alumchat.lol", 1], ["cas21700@alumchat.lol", 1]
  return [["mor21146@alumchat.lol", 1]];
};

/**
 * pedir la información de los contactos de nuestros contactos y sus pesos.
 * Con una stanza personalizada, de tipo echo, que contenga el nombre de usuario y el peso.
 */
const getNeighbors = async (contact, username) => {
  const body = {
    type: "echo",
    from: username,
  };
  const request_neighbors_stanza = xml(
    "message",
    { type: "chat", to: contact },
    xml("body", {}, JSON.stringify(body))
  );

  const response = await xmppClient.send(request_neighbors_stanza);
  return response;
};

const sendNeighbors = async (neighbors, to) => {
  body = {
    type: "info",
    payload: neighbors,
  };
  const message = xml(
    "message",
    { type: "chat", to: to },
    xml("body", {}, JSON.stringify(body))
  );

  await xmppClient.send(message);
};

const send_neighbors_stanza = async (contact) => {
  const neighbors = await getContacts();
  neighbors.forEach((neighbor) => {
    const neighbor_stanza = xml("neighbor", {}, neighbor[0], neighbor[1]);
    contact.append(neighbor_stanza);
  });
  await xmppClient.send(contact);
};

const main = async () => {
  const Username = "cas21700";
  const password = "18sep2002";
  localUsername = `${Username}@alumchat.lol`;
  const localContacts = getLocalContacts();
  console.log("Local contacts:", localContacts);
  for (let i = 0; i < localContacts.length; i++) {
    allNodes[localContacts[i][0]] = localContacts[i][1];
  }

  allNodes[localUsername] = getLocalContacts();

  await connect(Username, password);
  const contacts = getLocalContacts();

  for (let i = 0; i < contacts.length; i++) {
    await getNeighbors(contacts[i][0], `${Username}@alumchat.lol`);
  }
  console.log("All nodes:\n", allNodes);
};

main().catch((err) => console.error("Error en la ejecución:", err));
