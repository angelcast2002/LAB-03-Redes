import "./App.css";
import { XMPPProvider } from "./XmppContext/XmppContext";
import Home from "./pages/Home/Home";

const App = () => {
  return (
    <XMPPProvider>
      <Home />
    </XMPPProvider>
  );
};

export default App;
