import React from 'react';
import './ServiceFlowDiagram.css';

const ServiceFlowDiagram = ({ content }) => {
  if (!content || !content.includes('.html')) {
    return null;
  }

  return (
    <div className="container chat-container">
      <div className="diagram-container">
        <iframe 
          src={content}
          style={{ width: '100%', height: '500px', border: 'none' }}
          title="Service Flow Diagram"
          onError={(e) => console.error('Error loading diagram:', e)}
        />
      </div>
    </div>
  );
};

export default ServiceFlowDiagram; 