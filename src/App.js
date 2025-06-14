import React, { useEffect } from 'react';
import './App.css';
import VoiceChat from './components/VoiceChat';

function App() {
  useEffect(() => {
    // Load Mermaid script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';
    script.async = true;
    script.onload = () => {
      window.mermaid.initialize({ 
        startOnLoad: true,
        theme: 'default',
        themeVariables: {
          primaryColor: '#3498db',
          primaryTextColor: '#2c3e50',
          primaryBorderColor: '#2980b9',
          lineColor: '#34495e',
          secondaryColor: '#ecf0f1',
          tertiaryColor: '#bdc3c7'
        }
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="App">
      <VoiceChat />
    </div>
  );
}

export default App;
