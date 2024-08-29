import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomTextInput from '../components/CustomTextInput';
import AuthContext from '../auxiliaryFunctions/AuthContext.jsx';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    /**
     * Handle login
     * @param e
     * @returns {Promise<void>}
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await login(email, password);
            navigate('/home');
        } catch (error) {
            console.error('Error al conectar:', error);
        }
    };

    return (
        <div className="flex w-full h-screen">
            <div className="flex flex-col justify-center w-full h-full">
                <h1 className='text-4xl'>Ingresa tus credenciales</h1>
                <form onSubmit={handleSubmit} className="">
                    <CustomTextInput
                        label="Username"
                        name="usernam"
                        placeholder="tu usuario"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <CustomTextInput
                        label="Password"
                        name="password"
                        placeholder="tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className='flex flex-row justify-evenly'>
                        <button type="submit"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-full mt-2">
                            Log in
                        </button>
                        <button type="button"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-full mt-2"
                                onClick={() => navigate('/signup')}>
                            Sign Up
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default Login;