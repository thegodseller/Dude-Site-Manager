import './App.css';

function App() {
  const combinedHtml = `
<div class="cover">
  <div class="cover-grid"></div>
  <div class="cover-title">Du<span>De</span></div>
  <div class="cover-sub">SaaS Platform — UX Wireframe v1.0</div>
  <div class="cover-desc">Digital Site/Factory Manager · Multi-Tenant · Multi-Role · Real-Time AI</div>
</div>

<hr class="divider">

<div class="section">
  <div class="section-label">01 — User Architecture</div>
  <div class="section-title">Role × Screen Matrix</div>
  <div class="flow-grid">
    <div class="flow-col">
      <div class="flow-role r1">SUPER ADMIN<br>Ake</div>
      <div class="flow-item highlight">🌐 All Sites Overview</div>
    </div>
    <div class="flow-col">
      <div class="flow-role r3">MANAGER<br>เจ้าของโรงงาน</div>
      <div class="flow-item highlight">📊 Executive Dashboard</div>
    </div>
  </div>
</div>

<div class="lib-wrap">
  <div class="lib-header">
    <h1>DuDe Component Library <span class="lib-version">v1.0</span></h1>
  </div>
  <div class="comp-grid">
    <div class="comp-card">
      <h3>Alert Status</h3>
      <div class="badge-row">
        <span class="badge badge-critical"><span class="badge-dot"></span>วิกฤต</span>
        <span class="badge badge-ok"><span class="badge-dot"></span>ปกติ</span>
      </div>
    </div>
  </div>
</div>
`;

  return (
    <div className="app-container" dangerouslySetInnerHTML={{ __html: combinedHtml }} />
  );
}

export default App;
