import AuthContext from '../auxiliaryFunctions/AuthContext.jsx';
import { useContext, useEffect, useState } from 'react';

function Home() {
    const {user, logout } = useContext(AuthContext);
    const [logguedUser, setLogguedUser] = useState('');
    const [contacts, setContacts] = useState([]);

    const contactsData = {
        ale1: ['ale2@alumchat.lol', 2],
        ale2: ['ale3@alumchat.lol', 1],
        ale3: ['ale4@alumchat.lol', 3],
        ale4: ['ale5@alumchat.lol', 2],
        ale5: []
    };

    useEffect(() => {
        if(user){
            setLogguedUser(`${user.email}@alumchat.lol`);
            if (contactsData[user.email]) {
                setContacts(contactsData[user.email]);
            }
        }
    }, []);
    console.log('logguedUser: ', logguedUser);
    console.log('contacts: ', contacts);

    /**
     * Send neighbor request
     */

    



    const handleSendNRequest = async () => {
        console.log("Sending neighbor request");
    }

    const handleLogout = () => {
        logout();
    };

    return (
        <div className='h-screen w-screen flex flex-col justify-center items-center'>
            <div className='flex flex-col'>
                <h1>home</h1>
                <button className="rounded bg-red-500 mt-4 text-white py-2 px-4 hover:bg-red-700" onClick={handleLogout}>
                    Logout
                </button>
                <div className='flex-col gap-2'>
                    <button className="rounded bg-blue-500 mt-4 text-white py-2 px-4 hover:bg-blue-700" onClick={handleSendNRequest}>
                        send neighbor request
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Home;