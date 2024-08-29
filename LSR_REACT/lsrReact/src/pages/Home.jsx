// eslint-disable-next-line no-unused-vars
import AuthContext from '../auxiliaryFunctions/AuthContext.jsx';
import {useContext, useState} from 'react';

function Home() {
    const {user, logout} = useContext(AuthContext);

    const [localUser, setLocalUser] = useState(user);

    




    const handleSendNRequest = async (e) => {
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
