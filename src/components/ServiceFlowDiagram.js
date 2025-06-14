import React from 'react';
import './ServiceFlowDiagram.css';

const ServiceFlowDiagram = () => {
  const handleDiagramClick = () => {
    const diagramWindow = window.open('', '_blank');
    diagramWindow.document.write(` 
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shield Value Service Flow</title>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
          <style>
            body {
              margin: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              border-radius: 15px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 2.5em;
              font-weight: 300;
            }
            .diagram-container {
              padding: 40px;
              text-align: center;
              background: #f8f9fa;
            }
            .mermaid {
              background: white;
              border-radius: 10px;
              padding: 20px;
              box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            }
            .footer {
              background: #2c3e50;
              color: white;
              padding: 20px;
              text-align: center;
              font-size: 0.9em;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Shield Value Service Flow</h1>
            </div>
            <div class="diagram-container">
              <div class="mermaid">
                sequenceDiagram
                    title Shield Value Service Flow

                    participant Client
                    participant Shield
                    participant Vision

                    Client->>Shield: /banner
                    Shield->>Vision: Inter-Service Call
                    Vision->>Shield: Inter-Service Call

                    Note over Client,Vision: Shield Value Service Flow
              </div>
            </div>
            <div class="footer">
              Generated on ${new Date().toLocaleString()}
            </div>
          </div>
          <script>
            mermaid.initialize({ 
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
          </script>
        </body>
      </html>
    `);
    diagramWindow.document.close();
  };

  return (
    <div className="container chat-container" onClick={handleDiagramClick} style={{ cursor: 'pointer' }}>
      <div className="header chat-header">
        <h1>🔄 Shield Value Service Flow</h1>
        <div className="badge">Click to view full size</div>
      </div>
      
      <div className="diagram-container chat-diagram">
        <div className="mermaid">
          {`sequenceDiagram title Shield Value Service Flow participant Client participant Shield participant Vision Client->>Shield: /banner
            Shield->>Vision: Inter-Service Call
            Vision->>Shield: Inter-Service Call
            Note over Client,Vision: Shield Value Service Flow
          `}
        </div>
      </div>
      
      <div className="footer chat-footer">
        Generated on {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default ServiceFlowDiagram; 