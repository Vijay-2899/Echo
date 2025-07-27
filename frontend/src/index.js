// index.js (React 18+)
import ReactDOM from 'react-dom/client'; // <-- NOTE: from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
