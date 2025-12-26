
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Index.tsx: Script execution started.");

const startApp = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error("Index.tsx: Root element not found!");
      return;
    }

    console.log("Index.tsx: Root element located. Mounting React...");
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Index.tsx: Render called.");
  } catch (error) {
    console.error("Index.tsx: Failed to mount app:", error);
  }
};

// 确保 DOM 加载完成后再执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
