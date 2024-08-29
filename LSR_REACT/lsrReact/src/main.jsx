import {createRoot} from 'react-dom/client';
import {BrowserRouter as Router} from 'react-router-dom';
import App from './App';
import {AuthProvider} from './auxiliaryFunctions/AuthContext.jsx';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <AuthProvider>
        <Router>
            <App/>
        </Router>
    </AuthProvider>
);