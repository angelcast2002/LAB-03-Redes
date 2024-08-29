import {createContext, useState, useEffect} from 'react';
import {connectToXMPP, logoutmng} from './connectToXMPP';

const AuthContext = createContext(undefined);

// eslint-disable-next-line react/prop-types
export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const email = localStorage.getItem('email');
        const password = localStorage.getItem('password');

        if (email && password) {
            connectToXMPP(email, password)
                .then(client => {
                    setUser({email, client});
                })
                .catch(error => {
                    console.error('Error al conectar automáticamente:', error);
                });
        }
    }, []);

    /**
     * Login function
     * @param email
     * @param password
     * @returns {Promise<void>}
     */
    const login = async (email, password) => {
        try {
            const client = await connectToXMPP(email, password);
            setUser({email, client});
            localStorage.setItem('email', email);
            localStorage.setItem('password', password);
        } catch (error) {
            console.error('Error al conectar:', error);
            throw error;
        }
    };

    /**
     * Logout function
     * @returns {Promise<void>}
     */
    const logout = async () => {
        if (user && user.client) {
            try {
                await logoutmng(user.client);
            } catch (error) {
                console.error('Error stopping XMPP client:', error);
            }
        }
        setUser(null);
        localStorage.removeItem('email');
        localStorage.removeItem('password');
        window.location.href = '/';
    };

    /**
     * Clear user context
     */
    const clearUserContext = () => {
        if (user && user.client) {
            user.client.stop().catch((error) => console.error('Error stopping XMPP client:', error));
        }
        setUser(null);
        localStorage.removeItem('email');
        localStorage.removeItem('password');
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    const isAuthenticated = () => {
        return !!user;
    };

    return (
        <AuthContext.Provider value={{user, login, logout, clearUserContext, isAuthenticated}}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;