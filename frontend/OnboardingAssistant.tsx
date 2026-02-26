// Example: RAG Q&A and onboarding status in a React component
// Place in your frontend (e.g., Next.js app/page or component)

import { useState } from 'react';

export default function OnboardingAssistant() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    setLoading(true);
    setResponse(null);
    // Call your backend API that wraps OnboardingOpsAgent
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: input }),
    });
    setResponse(await res.json());
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>Onboarding Assistant</h2>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Ask a question or enter member ID"
        style={{ width: '100%', padding: 8, marginBottom: 8 }}
      />
      <button onClick={handleAsk} disabled={loading || !input} style={{ padding: 8 }}>
        {loading ? 'Loading...' : 'Ask'}
      </button>
      {response && (
        <div style={{ marginTop: 16 }}>
          {response.type === 'knowledge_base_answer' ? (
            <>
              <div><b>Answer:</b> {response.answer}</div>
              {response.sources?.length > 0 && (
                <ul>
                  {response.sources.map((src, i) => (
                    <li key={i}><a href={src.url} target="_blank" rel="noopener noreferrer">{src.title}</a></li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <pre>{JSON.stringify(response, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
