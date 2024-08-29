import { useEffect } from 'react';
import { connect } from '../helpers/xmppHelper';

function Home() {
    
    const username = "azu21242";
    const password = "azu21242";

    useEffect(() => {
        connect(username, password);
    }, []);
    
    

    return (
        <div>
        <h1>Home</h1>
        </div>
    );
}

export default Home;