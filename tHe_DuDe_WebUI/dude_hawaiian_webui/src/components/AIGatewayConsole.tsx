import React, { useState, useEffect } from 'react';
import '../ai_gateway.css';

interface ModelAlias {
  id: string;
  type: 'local' | 'cloud' | 'embedding';
  provider?: string;
}

const DEFAULT_ALIASES: ModelAlias[] = [
  { id: 'dude-fast', type: 'local', provider: 'Ollama/Cerebras' },
  { id: 'dude-local', type: 'local', provider: 'Ollama' },
  { id: 'dude-rag', type: 'local', provider: 'Ollama/Qdrant' },
  { id: 'dude-code', type: 'local', provider: 'Ollama/DeepSeek' },
  { id: 'dude-embed', type: 'embedding', provider: 'Ollama/Nomic' },
  { id: 'dude-cloud-fast', type: 'cloud', provider: 'Groq/Cerebras' },
  { id: 'dude-code-deepseek-small', type: 'local', provider: 'Ollama' },
];

export const AIGatewayConsole: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [models, setModels] = useState<ModelAlias[]>(DEFAULT_ALIASES);
  const [selectedModel, setSelectedModel] = useState('dude-fast');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [metrics, setMetrics] = useState<{ time: number | null, tokens?: number }>({ time: null });

  const checkStatus = async () => {
    try {
      const res = await fetch('/ai_gateway_health');
      if (res.ok) {
        setStatus('ok');
        // Try to fetch real models if available
        const modelRes = await fetch('/ai_gateway_v1/models');
        if (modelRes.ok) {
          const modelData = await modelRes.json();
          if (modelData.data) {
            // Map real models to our view
            const mappedModels: ModelAlias[] = modelData.data.map((m: any) => ({
              id: m.id,
              type: m.id.includes('embed') ? 'embedding' : m.id.includes('cloud') ? 'cloud' : 'local',
              provider: m.owned_by || 'Unknown'
            }));
            setModels(mappedModels);
          }
        }
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const executeTest = async () => {
    if (!prompt) return;
    setIsExecuting(true);
    setResponse('');
    const start = performance.now();
    
    try {
      const res = await fetch('/ai_gateway_v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100
        })
      });

      if (!res.ok) throw new Error(`Gateway Error: ${res.status}`);
      
      const data = await res.json();
      setResponse(data.choices[0].message.content);
      setMetrics({ 
        time: Math.round(performance.now() - start),
        tokens: data.usage?.total_tokens
      });
    } catch (err: any) {
      setResponse(`[ERROR] ${err.message}\nEnsure LiteLLM is running at http://127.0.0.1:4000 and proxy is active.`);
    } finally {
      setIsExecuting(false);
    }
  };

  const localModels = models.filter(m => m.type === 'local');
  const cloudModels = models.filter(m => m.type === 'cloud');
  const embedModels = models.filter(m => m.type === 'embedding');

  return (
    <div className="gateway-container">
      <header className="gateway-header">
        <div className="title-group">
          <h1>DUDE AI GATEWAY</h1>
          <div className="status-label">LITELLM CONSOLE v0.1</div>
        </div>
        <div className="warning-banner">
          ⚠️ ADMIN-ONLY LOCAL TOOL | DO NOT EXPOSE PUBLICLY
        </div>
      </header>

      <div className="status-grid">
        <div className="status-card">
          <div className="status-label">Gateway Status</div>
          <div className={`status-value ${status}`}>
            {status === 'ok' ? 'ONLINE' : status === 'error' ? 'OFFLINE' : 'CHECKING...'}
          </div>
        </div>
        <div className="status-card">
          <div className="status-label">Active Aliases</div>
          <div className="status-value">{models.length} Models</div>
        </div>
        <div className="status-card">
          <div className="status-label">Infrastructure</div>
          <div className="status-value">Localhost:4000</div>
        </div>
      </div>

      <section className="model-section">
        <h2 className="font-tech text-sm tracking-widest">REGISTERED ALIASES</h2>
        
        <div className="group-title">LOCAL MODELS (OLLAMA / ON-PREM)</div>
        <div className="model-list">
          {localModels.map(m => (
            <div key={m.id} className="model-item">
              <span className="model-name">{m.id}</span>
              <span className="model-type">{m.provider}</span>
            </div>
          ))}
        </div>

        <div className="group-title">CLOUD MODELS (CEREBRAS / GROQ)</div>
        <div className="model-list">
          {cloudModels.map(m => (
            <div key={m.id} className="model-item">
              <span className="model-name">{m.id}</span>
              <span className="model-type">{m.provider}</span>
            </div>
          ))}
        </div>

        <div className="group-title">SPECIALIZED / EMBEDDING</div>
        <div className="model-list">
          {embedModels.map(m => (
            <div key={m.id} className="model-item">
              <span className="model-name">{m.id}</span>
              <span className="model-type">{m.provider}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="console-section">
        <h2 className="font-tech text-sm tracking-widest mb-4">AI COMMAND CENTER</h2>
        <div className="console-panel">
          <div className="config-pane">
            <div className="status-label">Target Alias</div>
            <select 
              className="input-field" 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.id}</option>
              ))}
            </select>

            <div className="status-label">Prompt Configuration</div>
            <div className="text-[10px] text-slate-500 italic">
              Testing will use a 100-token limit for safety.
            </div>
            
            <button 
              className="btn-execute" 
              onClick={executeTest}
              disabled={isExecuting || !prompt || status !== 'ok'}
            >
              {isExecuting ? 'EXECUTING...' : 'RUN TEST PROMPT'}
            </button>
          </div>

          <div className="chat-pane">
            <textarea 
              className="input-field mb-4" 
              style={{height: '80px', resize: 'none'}}
              placeholder="Enter your test prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="output-area">
              {response || (isExecuting ? 'Waiting for gateway response...' : 'Result will appear here...')}
            </div>
            <div className="metadata">
              <span>Latency: <b>{metrics.time ? `${metrics.time}ms` : 'N/A'}</b></span>
              <span>Tokens: <b>{metrics.tokens || 'N/A'}</b></span>
              <span>Source: <b>{selectedModel}</b></span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
