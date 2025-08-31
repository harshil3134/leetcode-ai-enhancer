import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Book, Code, List, Settings } from 'lucide-react';

const HINT_LEVELS = {
  "1": { label: "Conceptual", icon: Book, color: "#10B981" },
  "2": { label: "Algorithm/Data Structure", icon: Code, color: "#3B82F6" },
  "3": { label: "Step-by-Step Outline", icon: List, color: "#F59E0B" },
  "4": { label: "Implementation & Edge Cases", icon: Settings, color: "#EF4444" }
};

const Dashboard = () => {
  const [hints, setHints] = useState({
    "1": "",
    "2": "",
    "3": "",
    "4": ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [problem, setProblem] = useState({
    title: "",
    difficulty: "",
    description: ""
  });
  const [showDesc, setShowDesc] = useState(false);
  const [expandedHints, setExpandedHints] = useState({});

  const toggleHint = (level) => {
    setExpandedHints(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const getContent = async () => {
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
          fetchHints();
        }
      );
    });
  };

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
    } catch (err) {
      setError('Could not fetch hints. Please try again.');
    }
    setLoading(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div style={{ 
      width: 450, 
      height: 700, 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      overflow: 'auto'
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

        <button
          onClick={getContent}
          style={{
            width: '100%',
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: 12,
            cursor: 'pointer',
            marginBottom: 20,
            fontSize: 16,
            fontWeight: 600,
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          disabled={loading}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.background = 'rgba(255,255,255,0.3)';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          {loading ? 'Loading...' : 'Get Hints'}
        </button>

        {error && (
          <div style={{ 
            color: '#FEE2E2', 
            background: 'rgba(239, 68, 68, 0.2)',
            padding: '12px',
            borderRadius: 8,
            marginBottom: 16,
            border: '1px solid rgba(239, 68, 68, 0.3)'
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
  );
};

export default Dashboard;