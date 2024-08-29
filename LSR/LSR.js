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
        //console.log("Stanza received:", stanza);
        if (stanza.is("message")) {
          console.log("Stanza message received", stanza.toString());
          const type = stanza.attrs.type;
          if (type === "chat") {
            const body = stanza.getChildText("body");
            if (body) {
              const jsonBody = JSON.parse(body);
              if (jsonBody.type === "echo") {
                console.log("Echo stanza received from", jsonBody.from);
                const neighbors = getLocalContacts();
                const response = [];
                for (let i = 0; i < neighbors.length; i++) {
                  response.push(neighbors[i]);
                }
                console.log("Response:", response);
				await sendNeighbors(response, jsonBody.from);
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
  return [
    ["azu21242@alumchat.lol", 1],
    ["contact2@alumchat.lol", 1],
    ["contact3@alumchat.lol", 1],
  ];
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
  console.log("Response:", response.toString());
  return response;
};

const sendNeighbors = async (neighbors, to) => {
	body = {
		type: "info",
		payload: neighbors
	}
	const message = xml(
		"message",
		{type: "chat", to: to},
		xml("body", {}, JSON.stringify(body))
	)
	await xmppClient.send(message)
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
  const Username = "mor21146";
  const password = "1234";

  await connect(Username, password);
  const contacts = getLocalContacts();

  for (let i = 0; i < contacts.length; i++) {
    console.log("Contacto: ", contacts[i][0]);
    await getNeighbors(contacts[i][0], `${Username}@alumchat.lol`);
  }
};

main().catch((err) => console.error("Error en la ejecución:", err));
