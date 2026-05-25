import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ViewportFit from './components/ViewportFit';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ViewportFit>
      <App />
    </ViewportFit>
  </React.StrictMode>
);

reportWebVitals();
