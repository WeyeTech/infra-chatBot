import React, { useState, useEffect } from 'react';
import './ServiceFlowDiagram.css';

const ServiceFlowDiagram = ({ content }) => {
  const [diagramUrl, setDiagramUrl] = useState(null);

  useEffect(() => {
    const extractHtmlPath = (text) => {
      if (!text) return null;
      const match = text.match(/\[Open Interactive Diagram\]\(([^)]+)\)/);
      if (match) {
        // Remove any leading slashes and ensure proper URL format
        const path = match[1].replace(/^\/+/, '');
        return path;
      }
      return null;
    };

    const url = extractHtmlPath(content);
    console.log('Extracted diagram URL:', url); // Debug log
    setDiagramUrl(url);
  }, [content]);

  if (!diagramUrl) {
    return null;
  }

  return (
    <div className="container chat-container">
      <div className="diagram-container">
        <iframe 
          src={diagramUrl}
          style={{ width: '100%', height: '500px', border: 'none' }}
          title="Service Flow Diagram"
          onError={(e) => console.error('Error loading diagram:', e)}
        />
      </div>
    </div>
  );
};

export default ServiceFlowDiagram; 