import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronRight, Book, Code, List, Settings, MessageCircle, Send, X, Minimize2 } from 'lucide-react';

// Copper aquamarine dream color palette
const COLORS = {
  primary: '#30525C', // Dark teal
  secondary: '#4C848D', // Light teal  
  accent: '#C35627', // Copper orange
  warm: '#D6794D', // Warm orange
  light: '#DCAA89', // Light copper
  neutral: '#BFB9B5' // Light gray
};

const HINT_LEVELS = {
  "1": { label: "Conceptual", icon: Book, color: COLORS.primary },
  "2": { label: "Algorithm/Data Structure", icon: Code, color: COLORS.secondary },
  "3": { label: "Step-by-Step Outline", icon: List, color: COLORS.accent },
  "4": { label: "Implementation & Edge Cases", icon: Settings, color: COLORS.warm }
};



const ChatWindow = ({ isOpen, onClose, onMinimize, problem,code }) => {
  const problemdes= `
  problem title:${problem.title}
  problem difficult:${problem.difficulty}
  problem id:${problem.id}
  problem description:${problem.description .trim()
    .replace(/\s+/g, ' ')
    .replace(/^\s*$(?:\r\n?|\n)/gm, '')}`
  const defaultMessages = [
    { id:0, text:`You are a helpful AI assistant`, sender:'system', timestamp:new Date() },
    { id:1, text:`Hi! I'm here to help you. What would you like to discuss about this problem?`, sender:'ai', timestamp:new Date() }
  ];
  const [messages, setMessages] = useState(defaultMessages);

  useEffect(() => {
    const saved = localStorage.getItem('leetcode_ai_chat');
    if (saved) {
      try {
        const parsedobj = JSON.parse(saved);
        const parsed = parsedobj.messages;
        if(parsedobj.problemid === problem.id) {
          setMessages(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
          return;
        }
      } catch (e) {
        console.error("Err", e);
      }
    }
    else{

      //setMessages(defaultMessages);
    }
  }, [problem.id]);

  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if(messages.length!=2)
    {
      localStorage.setItem('leetcode_ai_chat', JSON.stringify({messages:messages,problemid:problem.id}));
    }
  }, [messages]);

  const clearChat = () => {
    setMessages(defaultMessages);
    localStorage.removeItem('leetcode_ai_chat');
  };

  const sendMessage = async() => {
    if (!inputText.trim()) return;
console.log('---code---',code);

    const newMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
     setInputText('');
    const updatedMessages=[...messages,newMessage]
    setMessages(prev => [...prev, newMessage]);
     try {
      let textadd=""
      const response = await fetch('http://localhost:8000/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
         chat:updatedMessages,
         problem:problemdes,
         code:code
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch hints');
      const data = await response.json();
      console.log("data", data);

      if(!data.explanation||data.explanation==""||data.explanation==null){
        console.log("exmpty found in if");
        
        textadd="Sorry, I couldn't generate a response right now. Please try again, check your question, or reload the extension."
      } else{
        textadd=data.explanation
      }

       const aiResponse = {
        id: Date.now() + 1,
        text: textadd,
        sender: 'ai',
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, aiResponse]);
      
    } catch (err) {
      setError('Could not fetch hints. Please try again.');
    }

    // Simulate AI response
    // setTimeout(() => {  
    //   const aiResponse = {
    //     id: Date.now() + 1,
    //     text: "I understand your question. Let me help you think through this step by step...",
    //     sender: 'ai',
    //     timestamp: new Date()
    //   };
    //   setMessages(prev => [...prev, aiResponse]);
    // }, 1000);

   
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '500px',
        height: '600px',
        background: `linear-gradient(135deg, ${COLORS.light} 0%, ${COLORS.secondary} 100%)`,
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          background: COLORS.primary,
          borderRadius: '20px 20px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>AI Assistant</h3>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Problem: {problem.title}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear the chat?')) {
                  clearChat();
                }
              }}
              style={{
                background: COLORS.primary,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              Clear Chat
            </button>
            <button
              onClick={onMinimize}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 6,
                padding: 6,
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 6,
                padding: 6,
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {messages.map(message => (
            <div
              key={message.id}
              style={{
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%'
              }}
            >
           <div style={{
  background: message.sender === 'user' ? COLORS.accent : 'rgba(255,255,255,0.9)',
  color: message.sender === 'user' ? '#fff' : '#333',
  padding: '12px 16px',
  borderRadius: message.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
  fontSize: 14,
  lineHeight: 1.4,
  maxWidth: '80vw',           // limit width
  overflowX: 'auto',          // allow horizontal scroll
  wordBreak: 'break-word',    // break long words
}}>
  {message.sender === 'ai' ? (
    <ReactMarkdown
      components={{
        code({node, inline, className, children, ...props}) {
          return !inline ? (
            <pre style={{overflowX: 'auto', margin: 0}}>
              <code className={className} {...props}>{children}</code>
            </pre>
          ) : (
            <code className={className} {...props}>{children}</code>
          );
        }
      }}
    >
      {message.text}
    </ReactMarkdown>
  ) : (
    message.text
  )}
</div>
              <div style={{
                fontSize: 10,
                opacity: 0.6,
                marginTop: 4,
                textAlign: message.sender === 'user' ? 'right' : 'left'
              }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            display: 'flex',
            gap: 8,
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 25,
            padding: '8px 16px',
            alignItems: 'center'
          }}>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me anything about this problem..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 14
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                background: COLORS.accent,
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
    const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [problem, setProblem] = useState({
    id: "",
    title: "",
    difficulty: "",
    description: "",
  });
    print("--problem--",problem)
  const [hints, setHints] = useState({ "1": "", "2": "", "3": "", "4": "" });

  useEffect(() => {
    if (problem && problem.id) {
      const saved = localStorage.getItem(`hints-${problem.id}`);
      if (saved) {
        try {
          setHints(JSON.parse(saved));
        } catch (e) {
          console.error("Err", e);
          setHints({ "1": "", "2": "", "3": "", "4": "" });
        }
      } else {
        setHints({ "1": "", "2": "", "3": "", "4": "" });
      }
    }
  }, [problem.id]);
    useEffect(() => {
    // localStorage.setItem('hints', JSON.stringify(hints));
  }, [hints]);
    const [code,setCode]=useState("")
  const [showDesc, setShowDesc] = useState(false);
  const [expandedHints, setExpandedHints] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);

useEffect(()=>{
chrome?.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
        chrome?.tabs?.sendMessage(
          tabs[0].id,
          { type: "GETDATA" },
          (response) => {
            if (chrome?.runtime?.lastError) {
              console.error("Runtime error:", chrome.runtime.lastError);
              setError("Could not get data from content script.");
              return;
            }

            if (!response || !response.success) {
              setError("No problem data received.");
              console.error("Response error:", response);
              return;
            }

            console.log("📥 Got problem data:", response.data);
            setProblem(response.data.result);
            console.log("code",response?.data?.result?.code)
            //setCode(response?.data?.result?.code)
          })
        }
      )
},[])

useEffect(()=>{
  if(!chatOpen) return;
  chrome?.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
        chrome?.tabs?.sendMessage(
          tabs[0].id,
          { type: "GETUSERCODE" },
          (response) => {
            if (chrome?.runtime?.lastError) {
              console.error("Runtime error:", chrome.runtime.lastError);
              setError("Could not get data from content script.");
              return;
            }

            if (!response || !response.success) {
              setError("No problem data received.");
              console.error("Response error:", response);
              return;
            }
            console.log("User code detector:", response.data);
            setCode(response?.data?.result?.code)
          })
        }
      )

},[chatOpen])



  const toggleHint = (level) => {
    setExpandedHints(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const getContent = async () => {
  
    if (typeof chrome !== 'undefined') {
      chrome?.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
        chrome?.tabs?.sendMessage(
          tabs[0].id,
          { type: "GETDATA" },
          (response) => {
            if (chrome?.runtime?.lastError) {
              console.error("Runtime error:", chrome.runtime.lastError);
              setError("Could not get data from content script.");
              return;
            }

            if (!response || !response.success) {
              setError("No problem data received.");
              console.error("Response error:", response);
              return;
            }

            console.log("📥 Got problem data getCon:", response.data);
            setProblem(response?.data?.result);
            setCode(response?.data?.result?.code)
            fetchHints();
          }
        );
      });
    
  };
}

  const fetchHints = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_data: {
            title: problem.title,
            difficulty: problem.difficulty,
            description: problem.description,
            id: problem.id
          },
          hint_level: 1
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch hints');
      const data = await response.json();
      console.log("data", data);
      setHints(data.hint);
      localStorage.setItem(`hints-${problem.id}`, JSON.stringify(data.hint));
    } catch (err) {
      setError('Could not fetch hints. Please try again.');
    }
    setLoading(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return COLORS.primary;
      case 'medium': return COLORS.accent;
      case 'hard': return COLORS.warm;
      default: return COLORS.neutral;
    }
  };
// useEffect(()=>{
//  const saved = localStorage.getItem('hints');
//     if (saved) {
//       try {
//         const parsed = JSON.parse(saved);
//         // Restore Date objects
//         setHints(parsed)
//       } catch {
//         print("Err",e)
//       }
//     }
// },[])
   

  return (
    <div style={{margin:'0px',padding:'0px'}}>
      <div style={{ 
        width: 450, 
        height: 700, 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: `linear-gradient(135deg, ${COLORS.light} 0%, ${COLORS.secondary} 50%, ${COLORS.primary} 100%)`,
        color: '#fff',
        overflow: 'auto',
        position: 'relative'
      }}>
        <div style={{ padding: '20px' }}>
          <h2 style={{ 
            margin: '0 0 20px 0', 
            fontSize: 24, 
            fontWeight: 700,
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            LeetCode AI Hints
          </h2>

          {/* Chat Button */}
          {!chatMinimized && (
            <button
              onClick={() => setChatOpen(true)}
              style={{
                position: 'absolute',
                top: 10,
                right: 20,
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: COLORS.accent,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
              }}
            >
              <MessageCircle size={24} />
            </button>
          )}

          <button
            onClick={()=>getContent()}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.warm} 100%)`,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              marginBottom: 20,
              fontSize: 16,
              fontWeight: 600,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
            disabled={loading}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }}
          >
            {loading ? 'Loading...' : 'Get Hints'}
          </button>

          {error && (
            <div style={{ 
              color: '#fff', 
              background: `rgba(195, 86, 39, 0.3)`,
              padding: '12px',
              borderRadius: 8,
              marginBottom: 16,
              border: `1px solid ${COLORS.accent}`
            }}>
              {error}
            </div>
          )}

          {problem.title && (
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '20px',
              marginBottom: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 18, 
                  fontWeight: 700 
                }}>
                  {problem.title}
                </h3>
                <span style={{
                  background: getDifficultyColor(problem.difficulty),
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600
                }}>
                  {problem.difficulty}
                </span>
              </div>
              
              <div
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setShowDesc(prev => !prev)}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  padding: '8px 0'
                }}>
                  {showDesc ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span style={{ fontWeight: 600 }}>Problem Description</span>
                </div>
              </div>
              
              {showDesc && (
                <div style={{ 
                  marginTop: 12, 
                  padding: '16px',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: 8,
                  fontSize: 14,
                  lineHeight: 1.6
                }}>
                  {problem.description || <span style={{ color: '#D1D5DB' }}>No description available.</span>}
                </div>
              )}
            </div>
          )}

          {hints && typeof hints === "object" && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                marginBottom: 16,
                textAlign: 'center'
              }}>
                AI Hints
              </h3>
              
              {Object.entries(HINT_LEVELS).map(([level, config]) => {
                const IconComponent = config.icon;
                const isExpanded = expandedHints[level];
                const hasHint = hints[level];
                
                return (
                  <div
                    key={level}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.2)',
                      marginBottom: 12,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div
                      onClick={() => hasHint && toggleHint(level)}
                      style={{
                        padding: '16px',
                        cursor: hasHint ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: hasHint ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          background: config.color,
                          borderRadius: 8,
                          padding: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <IconComponent size={16} color="#fff" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            Level {level}
                          </div>
                          <div style={{ fontSize: 13, opacity: 0.8 }}>
                            {config.label}
                          </div>
                        </div>
                      </div>
                      
                      {hasHint ? (
                        <div style={{
                          transition: 'transform 0.2s',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}>
                          <ChevronDown size={20} />
                        </div>
                      ) : (
                        <span style={{ 
                          fontSize: 12, 
                          opacity: 0.6,
                          fontStyle: 'italic'
                        }}>
                          No hint available
                        </span>
                      )}
                    </div>
                    
                    {hasHint && isExpanded && (
                      <div style={{
                        padding: '16px',
                        background: 'rgba(0,0,0,0.1)',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        fontSize: 14,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line'
                      }}>
                        {hints[level]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Minimized Chat Button */}
      {chatMinimized && (
        <div
          onClick={() => {
            setChatMinimized(false);
            setChatOpen(true);
          }}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: COLORS.accent,
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 25,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 999
          }}
        >
          <MessageCircle size={20} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Chat with AI</span>
        </div>
      )}

      {/* Chat Window */}
      < ChatWindow 
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onMinimize={() => {
          setChatOpen(false);
          setChatMinimized(true);
        }}
        problem={problem}
        code={code}
      />
    </div>
  );
};

export default Dashboard;