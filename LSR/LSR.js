const { client, xml } = require("@xmpp/client");

let xmppClient;

const connect = async (Username, password) => {
  try {
    xmppClient = client({
      service: "ws://alumchat.lol:7070/ws",
      domain: "alumchat.lol",
      resource: "LSR",
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
      console.log("Stanza received:", stanza.toString());
      if (stanza.is("message")) {
        
      }
    });
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

const main = async () => {
  const Username = "mor21146";
  const password = "1234";

  await connect(Username, password);
};
