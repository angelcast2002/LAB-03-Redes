// App.jsx
import { useEffect, useState, useRef } from 'react';
import { connect, getLocalContacts } from './helpers/xmppHelper';

function App() {
  
  const username = "azu21242";
  const password = "azu21242";

  const [localContacts, setLocalContacts] = useState([]);
  const clientRef = useRef(null); // useRef para mantener la instancia del cliente

  // Conectar al servidor XMPP solo una vez al montar el componente
  useEffect(() => {
    const initializeClient = async () => {
      if (!clientRef.current) {
        clientRef.current = await connect(username, password); // Guardar la instancia del cliente en clientRef
      }
    };
    initializeClient();
  }, [username, password]);

  // Obtener los contactos locales una vez que el cliente esté conectado
  useEffect(() => {
    setLocalContacts(getLocalContacts());
    console.log('setted local contacts:\n',localContacts);
  }, []);

  return (
    <div>
      {/* Renderiza lo que necesites aquí */}
    </div>
  );
}

export default App;

