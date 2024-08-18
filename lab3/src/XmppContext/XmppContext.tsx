import React, { createContext, useContext, useState } from "react";
import { client, xml, Client } from "@xmpp/client";


// Define la interfaz para el contexto XMPP
interface XmppContextProps {
  xmppClient: Client | null;
  connect: (username: string, password: string) => Promise<void>;
}

// Clase para el manejo de mensajes
class Message {
  type: string;
  from: string;
  to: string;
  hops: number;
  headers: Record<string, string>;
  payload: string;

  constructor(type: string, from: string, to: string, payload: string) {
    this.type = type;
    this.from = from;
    this.to = to;
    this.hops = 0;
    this.headers = {};
    this.payload = payload;
  }

  incrementHops() {
    this.hops += 1;
  }
}

// Clase para representar un nodo en la red
class Node {
  id: string;
  neighbors: string[];
  routingTable: Map<string, string>;

  constructor(id: string, neighbors: string[]) {
    this.id = id;
    this.neighbors = neighbors;
    this.routingTable = new Map();
  }

  receiveMessage(message: Message) {
    console.log(`Mensaje recibido en nodo ${this.id}:`, message);
  }

  sendMessage(message: Message) {
    console.log(`Enviando mensaje desde ${this.id} a ${message.to}:`, message);
    // Aquí integrarías la lógica para enviar el mensaje por XMPP
  }

  updateRoutingTable() {
    // Lógica para actualizar la tabla de enrutamiento (opcional según tus necesidades)
  }
}

// Clase para manejar el algoritmo de Flooding
class FloodingAlgorithm {
  node: Node;

  constructor(node: Node) {
    this.node = node;
  }

  handleFlooding(message: Message) {
    // Ignorar el mensaje si ya ha sido procesado
    if (this.node.routingTable.has(message.payload)) return;

    // Marcar el mensaje como procesado
    this.node.routingTable.set(message.payload, message.from);

    // Propagar el mensaje a todos los vecinos excepto el origen
    this.node.neighbors.forEach((neighbor) => {
      if (neighbor !== message.from) {
        const newMessage = new Message(
          message.type,
          this.node.id,
          neighbor,
          message.payload
        );
        newMessage.incrementHops();
        this.node.sendMessage(newMessage);
      }
    });
  }
}

// Configuración del contexto para XMPP
const XmppContext = createContext<XmppContextProps | undefined>(undefined);

export const XMPPProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [xmppClient, setXmppClient] = useState<Client | null>(null);

  const connect = async (username: string, password: string) => {
    try {
      const clientInstance = client({
        service: "ws://alumchat.lol:7070/ws",
        domain: "alumchat.lol",
        resource: "React",
        username: username,
        password,
      });

      // Instancia de un nodo y el algoritmo de flooding
      const node = new Node(username, ["neighbor1", "neighbor2"]);
      const floodingAlgorithm = new FloodingAlgorithm(node);

      clientInstance.on("online", async () => {
        await clientInstance.send(
          xml(
            "presence",
            {},
            xml("status", {}, `Hola soy ${username}`),
            xml("show", {}, "chat")
          )
        );
      });

      clientInstance.on("stanza", (stanza) => {
        if (stanza.is("message")) {
          const from = stanza.attrs.from;
          const body = stanza.getChildText("body");

          if (body) {
            const message = new Message("chat", from, username, body);
            floodingAlgorithm.handleFlooding(message); // Integración del algoritmo de Flooding
          }
        }
      });

      await clientInstance.start();
      setXmppClient(clientInstance);
    } catch (err) {
      console.error("Failed to connect:", err);
      throw err;
    }
  };

  return (
    <XmppContext.Provider
      value={{
        xmppClient,
        connect,
      }}
    >
      {children}
    </XmppContext.Provider>
  );
};

// Hook para usar el contexto XMPP
export const useXMPP = (): XmppContextProps => {
  const context = useContext(XmppContext);
  if (!context) {
    throw new Error("useXMPP must be used within an XMPPProvider");
  }
  return context;
};
