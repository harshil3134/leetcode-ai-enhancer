import React, { useState } from 'react';

const HINT_LEVELS = {
  "1": "Conceptual",
  "2": "Algorithm/Data Structure",
  "3": "Step-by-Step Outline",
  "4": "Implementation & Edge Cases"
};


const Dashboard = () => {
  const [hints, setHints] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [problemTitle, setProblemTitle] = useState('');


const getContentData = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: "GET_LEETCODE_DATA" },
      (response) => {
        if (chrome.runtime.lastError) {
          setError("Could not get data from content script.");
          console.error("Runtime error:", chrome.runtime.lastError);
          return;
        }

        if (!response || !response.success) {
          setError("No problem data received.");
          console.error("Response error:", response);
          return;
        }

        console.log("📥 Got problem data:", response.data);

        // Now you can use fields inside response.data
        setProblemTitle(response.data?.title || "Unknown Problem");
        // If hints come from detector, also save them
        setHints(response.data?.hints || null);
      }
    );
  });
};


const sendData = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'getCurrentProblem' },
        (response) => {
          if (response) {
            setHintResult(response.success) // save result to state
          }
        }
      )
    })
  }
const sendHint = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'showHint' },
        (response) => {
          if (response) {
            setHintResult(response.result) // save result to state
          }
        }
      )
    })
  }
  const fetchHints = async () => {
    setLoading(true);
    setError('');
    sendHint()
    try {
      // Example: Replace with your actual API endpoint and request body
      const response = await fetch('http://localhost:8000/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_data: {
            title: "Add Two Numbers",
            difficulty: "Medium",
            description: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.",
            id: "2"
          },
          hint_level: 1
        })
      });
      if (!response.ok) throw new Error('Failed to fetch hints');
      const data = await response.json();
      console.log("data",data)
      setHints(data.hint);
      //setProblemTitle(data.problem_title);
    } catch (err) {
      setError('Could not fetch hints. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ width: 350, padding: 16, fontFamily: 'sans-serif' }}>
      <h2 style={{ margin: '0 0 12px 0', fontSize: 18 }}>LeetCode AI Hints</h2>
      <div>problem{problemTitle}</div>
      <button
        onClick={getContentData}
        style={{
          padding: '8px 16px',
          background: '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          marginBottom: 16
        }}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Get Hints'}
      </button>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {problemTitle && <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{problemTitle}</div>}

      {hints && typeof hints=="object" && (
        <div>
          <div>{problemTitle}</div>
          {Object.entries(HINT_LEVELS).map(([level, label]) => (
            <div key={level} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
                Level {level}: {label}
              </div>
              <div style={{ marginLeft: 8, marginTop: 4, fontSize: 14 }}>
                {hints[level] || <span style={{ color: '#888' }}>No hint available.</span>}
              </div>
            </div>
          ))}
        </div>
      )}
   
    </div>
  );
};

export default Dashboard;