/* global React, ReactDOM, ContentsPage, TenantPage, PreviewPage, ModulesPage,
   initialItems, initialTenant, initialModules */

// app.jsx — CMS shell with working tab routing

const { useState, useEffect } = React;

function readTab() {
  const h = (location.hash || '').replace(/^#/, '');
  return ['contents', 'tenant', 'modules', 'preview'].includes(h) ? h : 'contents';
}

function App() {
  const [tab, setTab] = useState(readTab());
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState(initialItems[0].id);
  const [tenant, setTenant] = useState(initialTenant);
  const [modules, setModules] = useState(initialModules);

  // Hash routing — keeps tab on refresh + supports browser back/forward
  useEffect(() => {
    const onHash = () => setTab(readTab());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    if (location.hash.replace(/^#/, '') !== tab) location.hash = tab;
  }, [tab]);

  return (
    <div className="app">
      <header className="topbar">
        <a href="#contents" className="brand" onClick={(e) => { e.preventDefault(); setTab('contents'); }}>
          <span className="brand__mark">M</span>
          <div>
            <span className="brand__name">{tenant.brandName}</span>
            <span className="brand__kind">CMS</span>
          </div>
          <span className="tag-interne">INTERNE</span>
        </a>

        <nav className="tabs">
          <button className={`tab ${tab === 'contents' ? 'on' : ''}`} onClick={() => setTab('contents')}>
            <span className="ic">◇</span>Contenus
          </button>
          <button className={`tab ${tab === 'tenant' ? 'on' : ''}`} onClick={() => setTab('tenant')}>
            <span className="ic">⚙</span>Tenant
          </button>
          <button className={`tab ${tab === 'modules' ? 'on' : ''}`} onClick={() => setTab('modules')}>
            <span className="ic">▤</span>Modules
          </button>
          <button className={`tab ${tab === 'preview' ? 'on' : ''}`} onClick={() => setTab('preview')}>
            <span className="ic">▶</span>Preview
          </button>
        </nav>

        <div className="user">
          <div className="user__info">
            <div className="nm">Jason Suárez</div>
            <div className="em">beviralaiapp@gmail.com</div>
          </div>
          <span className="user__av">J</span>
        </div>
      </header>

      {tab === 'contents' && (
        <ContentsPage items={items} setItems={setItems} selected={selected} setSelected={setSelected} />
      )}
      {tab === 'tenant' && (
        <TenantPage tenant={tenant} setTenant={setTenant} items={items} />
      )}
      {tab === 'modules' && (
        <ModulesPage modules={modules} setModules={setModules} />
      )}
      {tab === 'preview' && (
        <PreviewPage tenant={tenant} items={items} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
