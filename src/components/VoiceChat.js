import React, { useState, useRef, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { 
  Container, Paper, Typography, IconButton, Box, CircularProgress,
  Alert, Avatar, TextField, InputAdornment, Tooltip, Select, MenuItem, FormControl, InputLabel, Button
} from '@mui/material';
import { Mic, MicOff, Send, SmartToy, VolumeUp, VolumeOff } from '@mui/icons-material';
import ServiceFlowDiagram from './ServiceFlowDiagram';

const VoiceChat = () => {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [searchType, setSearchType] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionCount = useRef(0);
  const speechSynthesis = window.speechSynthesis;
  const isInitialized = useRef(false);
  const silenceTimeoutRef = useRef(null);

  // Add debug logging for state changes
  useEffect(() => {
    console.log('Session ID changed:', sessionId);
  }, [sessionId]);

  useEffect(() => {
    console.log('Messages changed:', messages);
  }, [messages]);

  useEffect(() => {
    console.log('Input text changed:', inputText);
  }, [inputText]);

  const searchTypes = [
    { value: 'OPERATOR_SEARCH', label: 'Operator Search', clientId: 'b37deea6401ddb33423dd5c83cbbea09' },
    { value: 'DEV_SEARCH', label: 'Developer Experience', clientId: '69876ccedb16b10df730febee45a3104' },
    { value: 'QUERY_GPT', label: 'Query GPT', clientId: '207fe2f9f58345293d678d3c6376d5a0' },
    { value: 'PRODUCT_GPT', label: 'Product GPT', clientId: '2b2165cc8f35d12465794ea6b9590df9' }
  ];

  // Initialize component with strict checks
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      // Don't reset session ID on initialization
      setMessages([]);
      setInputText('');
      resetTranscript();
    }
  }, []);

  const createSession = async (type) => {
    try {
      console.log('Creating new session for type:', type);
      // Only clear messages and input, don't reset session ID
      setMessages([]);
      setError(null);
      setInputText('');

      const selectedType = searchTypes.find(t => t.value === type);
      if (!selectedType) {
        throw new Error('Invalid search type');
      }

      const response = await fetch('https://2529-14-194-100-114.ngrok-free.app/session/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Request-ID': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        body: JSON.stringify({
          client_id: selectedType.clientId,
          timestamp: Date.now()
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('Session created with ID:', data.session_id);
      setSessionId(data.session_id);
      setMessages([{ type: 'bot', text: `Session created for ${selectedType.label}. You can now start asking questions.` }]);
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create session. Please try again.');
    }
  };

  const handleSearchTypeChange = (event) => {
    const selectedType = event.target.value;
    console.log('Search type changed to:', selectedType);
    setSearchType(selectedType);
    createSession(selectedType);
  };

  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    listening
  } = useSpeechRecognition({
    transcribing: isListening,
    clearTranscriptOnListen: true,
    autoStart: false
  });

  // Only update input text when explicitly listening
  useEffect(() => {
    if (isListening && transcript) {
      setInputText(transcript);
      // Clear any existing timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      // Set new timeout for 2 seconds of silence
      silenceTimeoutRef.current = setTimeout(() => {
        if (transcript.trim() && sessionId && !isProcessing) {
          console.log('Auto-sending after silence:', transcript);
          const textToSend = transcript;
          resetTranscript();
          setInputText('');
          sendMessage(textToSend);
          stopListening();
        }
      }, 2000);
    }
  }, [transcript, isListening]);

  // Handle voice recognition state changes
  useEffect(() => {
    if (!isListening && transcript?.trim() && sessionId && !isProcessing) {
      console.log('Voice input completed, sending:', transcript);
      const textToSend = transcript;
      resetTranscript();
      setInputText('');
      sendMessage(textToSend);
    }
  }, [isListening, transcript]);

  const stopListening = () => {
    if (!isListening) return;
    console.log('Stopping voice recognition...');
    setIsListening(false);
    SpeechRecognition.stopListening();
  };

  const startListening = () => {
    // Strict validation before starting
    if (!browserSupportsSpeechRecognition || !isMicrophoneAvailable || !sessionId || isProcessing) {
      setError('Please select a search type first and ensure microphone is available.');
      return;
    }

    if (recognitionCount.current >= 75) {
      setError('Speech recognition session limit reached. Please refresh.');
      return;
    }

    console.log('Starting voice recognition...');
    recognitionCount.current++;
    setIsListening(true);
    resetTranscript();
    setInputText('');
    SpeechRecognition.startListening({ continuous: true });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && sessionId) {
      e.preventDefault();
      if (isListening) {
        stopListening();
      } else {
        handleSendMessage();
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
      if (isListening) {
        SpeechRecognition.stopListening();
      }
    };
  }, []);

  // Handle browser visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        stopListening();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isListening]);

  // Handle window focus changes
  useEffect(() => {
    const handleFocusChange = () => {
      if (!document.hasFocus() && isListening) {
        stopListening();
      }
    };

    window.addEventListener('blur', handleFocusChange);
    return () => {
      window.removeEventListener('blur', handleFocusChange);
    };
  }, [isListening]);

  const sendMessage = async (text) => {
    // Strict validation before sending
    if (!text?.trim() || !sessionId || isProcessing) {
      console.log('Cannot send message:', { text, sessionId, isProcessing });
      return;
    }

    setIsProcessing(true);
    setError(null);
    setMessages(prev => [...prev, { type: 'user', text }]);
    setInputText(''); // Clear input immediately after adding to messages

    try {
      const selectedType = searchTypes.find(t => t.value === searchType);
      if (!selectedType) {
        throw new Error('Invalid search type');
      }

      const requestBody = {
        session_id: sessionId,
        question: text
      };
      
      console.log('Sending request with body:', requestBody);

      const response = await fetch('https://2529-14-194-100-114.ngrok-free.app/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Request-ID': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('Received response:', data);
      
      const botResponse = data.answer || 'No answer received';
      const hasDiagram = botResponse.includes('[Open Interactive Diagram]');

      // Extract the text before the diagram link
      const textContent = hasDiagram 
        ? botResponse.split('[Open Interactive Diagram]')[0].trim()
        : botResponse;

      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: botResponse // Pass the full response for diagram extraction
      }]);
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      const errorMessage = error.message.includes('fetch')
        ? 'Network error: Could not connect to the server.'
        : `Error: ${error.message}`;
      setError(errorMessage);
      setMessages(prev => [...prev, { type: 'bot', text: errorMessage }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = () => {
    // Strict validation before sending
    if (!inputText?.trim() || !sessionId || isProcessing) {
      console.log('Cannot send message:', { inputText, sessionId, isProcessing });
      return;
    }
    const textToSend = inputText;
    setInputText(''); // Clear input before sending
    sendMessage(textToSend);
  };

  const speakText = (text) => {
    if (!speechSynthesis) return;

    // Stop any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('female') || v.name.includes('Samantha'));
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add debug logging for session changes
  useEffect(() => {
    console.log('Session state changed:', { sessionId, searchType, isListening });
  }, [sessionId, searchType, isListening]);

  // Add function to handle voice button click
  const handleVoiceClick = () => {
    const lastBotMessage = messages.filter(m => m.type === 'bot').pop();
    if (lastBotMessage) {
      const textContent = lastBotMessage.text.split('[Open Interactive Diagram]')[0].trim();
      if (isSpeaking) {
        stopSpeaking();
      } else {
        speakText(textContent);
      }
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <Typography>Browser doesn't support speech recognition.</Typography>;
  }

  return (
    <Container maxWidth={false} disableGutters style={{ height: '100vh', padding: 0, margin: 0, background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)' }}>
      <Paper elevation={3} style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fffaf0', margin: 0 }}>
        <Box style={{ 
          padding: '20px', 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', 
          color: 'white', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Typography variant="h5" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SmartToy /> AgentX
          </Typography>
          <Tooltip title={isSpeaking ? "Stop speaking" : "Play last response"}>
            <span>
              <IconButton 
                color="inherit" 
                onClick={handleVoiceClick}
                disabled={!messages.length}
              >
                {isSpeaking ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {error && <Alert severity="error" style={{ margin: '10px' }}>{error}</Alert>}

        <Box style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#fffaf0' }}>
          <Box style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start' }}>
            <FormControl variant="outlined" style={{ width: '300px' }}>
              <InputLabel>Select Search Type</InputLabel>
              <Select
                value={searchType}
                onChange={handleSearchTypeChange}
                label="Select Search Type"
                style={{ background: 'white', textAlign: 'left' }}
              >
                {searchTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value} style={{ textAlign: 'left' }}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {messages.map((m, i) => (
            <Box key={i} style={{ display: 'flex', justifyContent: m.type === 'user' ? 'flex-start' : 'flex-start', gap: '10px' }}>
              {m.type === 'bot' && <Avatar style={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' }}><SmartToy /></Avatar>}
              <Paper style={{ 
                padding: '12px 16px', 
                background: m.type === 'user' ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' : 'white', 
                color: m.type === 'user' ? 'white' : 'black', 
                borderRadius: '15px',
                maxWidth: '80%',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                textAlign: 'left'
              }}>
                <Typography style={{ 
                  whiteSpace: 'pre-wrap',
                  textAlign: 'left'
                }}>
                  {m.type === 'user' ? m.text : (
                    m.type === 'bot' && m.text.includes('[Open Interactive Diagram]') ? (
                      <>
                        {m.text.split('[Open Interactive Diagram]')[0]}
                        <a 
                          href={m.text.match(/\[Open Interactive Diagram\]\(([^)]+)\)/)?.[1]}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#1976d2',
                            textDecoration: 'underline',
                            marginLeft: '4px'
                          }}
                        >
                          Open Interactive Diagram
                        </a>
                      </>
                    ) : m.text
                  )}
                </Typography>
              </Paper>
              {m.type === 'user' && <Avatar style={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' }}>U</Avatar>}
            </Box>
          ))}
          {isProcessing && (
            <Box style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar style={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' }}><SmartToy /></Avatar>
              <Paper style={{ padding: '12px 16px', background: '#fffaf0' }}><CircularProgress size={20} /></Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />

          {/* Service Flow Diagram */}
          <Box sx={{ 
            width: '100%', 
            bgcolor: 'white',
            borderRadius: 1,
            boxShadow: 1
          }}>
            <ServiceFlowDiagram content={messages[messages.length - 1]?.text} />
          </Box>
        </Box>

        <Box style={{ padding: '20px', background: '#fffaf0', borderTop: '1px solid #e0e0e0' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={isProcessing ? "Waiting for response..." : "Type a message or use mic..."}
            value={isListening ? transcript : inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isProcessing || !sessionId}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    color={isListening ? 'secondary' : 'primary'}
                    onClick={isListening ? stopListening : startListening}
                    disabled={!browserSupportsSpeechRecognition || !isMicrophoneAvailable || isProcessing || !sessionId}
                  >
                    {isListening ? <MicOff /> : <Mic />}
                  </IconButton>
                  {!isListening && inputText.trim() && !isProcessing && sessionId && (
                    <IconButton color="primary" onClick={handleSendMessage}><Send /></IconButton>
                  )}
                </InputAdornment>
              ),
            }}
            style={{ background: 'white' }}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default VoiceChat; 