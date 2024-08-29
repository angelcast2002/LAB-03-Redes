import { createContext, useState, useEffect } from 'react';
import { connectToXMPP, logoutmng } from './connectToXMPP';

const AuthContext = createContext(undefined);

// eslint-disable-next-line react/prop-types
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const email = localStorage.getItem('email');
        const password = localStorage.getItem('password');

        if (email && password) {
            connectToXMPP(email, password)
                .then(client => {
                    setUser({ email, client });
                })
                .catch(error => {
                    console.error('Error al conectar automáticamente:', error);
                });
        }
    }, []);

    const login = async (email, password) => {
        try {
            const client = await connectToXMPP(email, password);
            setUser({ email, client });
            localStorage.setItem('email', email);
            localStorage.setItem('password', password);
        } catch (error) {
            console.error('Error al conectar:', error);
            throw error;
        }
    };

    const logout = async () => {
        if (user && user.client) {
            try {
                await logoutmng(user.client);
            } catch (error) {
                console.error('Error stopping XMPP client:', error);
            }
        }
        clearUserContext();
        localStorage.clear(); // Limpiar todo el almacenamiento local
        window.location.href = '/';
    };

    const clearUserContext = () => {
        if (user && user.client) {
            user.client.stop().catch((error) => console.error('Error stopping XMPP client:', error));
        }
        setUser(null);
        localStorage.removeItem('email');
        localStorage.removeItem('password');
    }

    const isAuthenticated = () => {
        return !!user;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, clearUserContext, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;