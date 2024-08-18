import { useXMPP } from "../../XmppContext/XmppContext";

const Home = () => {
  const { connect } = useXMPP();
  const handleConnect = async () => {
    console.log("Connecting...");
    try {
      await connect("cas21700", "18sep2002");
    } catch (err) {
        console.error("Failed to connect:", err);
        throw err;
    }
  };
  return (
    <div>
      <button onClick={() => handleConnect()}>Connect</button>
    </div>
  );
};

export default Home;
