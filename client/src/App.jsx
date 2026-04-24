import { useMemo, useState } from 'react'
import './App.css'

const SAMPLE_INPUT = `A->B
A->C
B->D
C->E
E->F
X->Y
Y->Z
Z->X
P->Q
Q->R
G->H
G->H
G->I
hello
1->2
A->`

function parseEntries(rawInput) {
  const trimmed = rawInput.trim()

  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed)

    if (!Array.isArray(parsed)) {
      throw new Error('JSON input must be an array of strings.')
    }

    return parsed
  }

  return rawInput
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function TreeNode({ label, branch }) {
  const entries = Object.entries(branch)

  return (
    <li className="tree-node">
      <div className="node-content">
        <span className="tree-connector"></span>
        <span className="tree-label">[{label}]</span>
      </div>
      {entries.length > 0 ? (
        <ul className="tree-children">
          {entries.map(([childLabel, childBranch]) => (
            <TreeNode key={childLabel} label={childLabel} branch={childBranch} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function HierarchyCard({ hierarchy }) {
  const [rootKey, rootBranch] = Object.entries(hierarchy.tree)[0] || []

  return (
    <article className="hierarchy-card">
      <div className="hierarchy-header">
        <div>
          <p className="eyebrow">ROOT_NODE</p>
          <h3 className="card-title">{hierarchy.root}</h3>
        </div>
        <div className={`status-pill ${hierarchy.has_cycle ? 'cycle' : 'tree'}`}>
          {hierarchy.has_cycle ? 'CYCLE_DETECTED' : `DEPTH_${hierarchy.depth}`}
        </div>
      </div>

      {hierarchy.has_cycle ? (
        <div className="cycle-warning">
          <p className="cycle-copy">
            {'>'} CYCLE DETECTED IN THIS GRAPH. TREE EVALUATION HALTED.
          </p>
        </div>
      ) : (
        <div className="tree-shell">
          <ul className="tree-root">
            <TreeNode label={rootKey} branch={rootBranch} />
          </ul>
        </div>
      )}
    </article>
  )
}

function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [input, setInput] = useState(SAMPLE_INPUT)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isJsonOpen, setIsJsonOpen] = useState(false)

  const endpoint = useMemo(() => {
    const base = apiBaseUrl.trim()
    return `${base ? base.replace(/\/$/, '') : ''}/bfhl`
  }, [apiBaseUrl])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    let data

    try {
      data = parseEntries(input)
    } catch (parseError) {
      setResponse(null)
      setError(parseError instanceof Error ? parseError.message : 'Could not parse input.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await fetch(endpoint || '/bfhl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      })

      const payload = await result.json()

      if (!result.ok) {
        throw new Error(payload.error || 'API request failed.')
      }

      setResponse(payload)
    } catch (requestError) {
      setResponse(null)
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The API request failed. Check the server and try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="dashboard-layout">
      {/* Background Ambience */}
      <div className="cyber-grid" />
      <div className="ambient-glow cyan-glow" />
      <div className="ambient-glow purple-glow" />

      {/* Left Control Panel */}
      <aside className="control-panel">
        <header className="brand-header">
          <p className="eyebrow">// SRM_CHALLENGE</p>
          <h1 className="glitch-title" data-text="BFHL_CORE">BFHL_CORE</h1>
          <p className="subtitle">
            Hierarchy Analyzer Engine. Detects cycles, parses duplicates, and evaluates structured trees.
          </p>
        </header>

        <div className="tech-divider" />

        <form className="input-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>SYSTEM_INPUT</h2>
            <button className="cyber-button ghost" type="button" onClick={() => setInput(SAMPLE_INPUT)}>
              [ LOAD_SAMPLE ]
            </button>
          </div>

          <label className="field-group">
            <span className="field-label">API_ENDPOINT</span>
            <input
              className="cyber-input"
              type="text"
              value={apiBaseUrl}
              onChange={(event) => setApiBaseUrl(event.target.value)}
              placeholder="Blank for same-origin or http://localhost:3001"
            />
          </label>

          <label className="field-group">
            <span className="field-label">NODE_DATA</span>
            <textarea
              className="cyber-textarea"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder='Line-separated edges or JSON array'
              rows={12}
            />
          </label>

          <div className="action-row">
            <button className="cyber-button primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'PROCESSING...' : 'EXECUTE_POST'}
            </button>
            <span className="endpoint-tag">{endpoint || '/bfhl'}</span>
          </div>

          {error && <div className="error-box">ERROR: {error}</div>}
        </form>
      </aside>

      {/* Right Data Canvas */}
      <main className="data-canvas">
        {response ? (
          <div className="results-wrapper">
            <header className="results-header">
              <h2>OUTPUT_TELEMETRY</h2>
              <div className="identity-blocks">
                <span className="id-tag">{response.user_id}</span>
                <span className="id-tag">{response.email_id}</span>
                <span className="id-tag">{response.college_roll_number}</span>
              </div>
            </header>

            <div className="metrics-dashboard">
              <div className="metric-box">
                <span className="metric-label">VALID_TREES</span>
                <span className="metric-value">{response.summary.total_trees}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">DETECTED_CYCLES</span>
                <span className="metric-value">{response.summary.total_cycles}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">MAX_DEPTH_ROOT</span>
                <span className="metric-value">{response.summary.largest_tree_root || 'N/A'}</span>
              </div>
            </div>

            <div className="warning-dashboard">
              <div className="warning-box">
                <span className="warning-label">INVALID_NODES [{response.invalid_entries.length}]</span>
                <div className="warning-content">{response.invalid_entries.join(', ') || 'NONE_DETECTED'}</div>
              </div>
              <div className="warning-box">
                <span className="warning-label">DUPLICATE_EDGES [{response.duplicate_edges.length}]</span>
                <div className="warning-content">{response.duplicate_edges.join(', ') || 'NONE_DETECTED'}</div>
              </div>
            </div>

            <div className="hierarchy-grid">
              {response.hierarchies.map((hierarchy) => (
                <HierarchyCard
                  key={`${hierarchy.root}-${hierarchy.has_cycle ? 'cycle' : 'tree'}`}
                  hierarchy={hierarchy}
                />
              ))}
            </div>

            <div className="raw-data-panel">
              <button 
                type="button" 
                className="collapse-trigger" 
                onClick={() => setIsJsonOpen(!isJsonOpen)}
              >
                <h3>RAW_JSON_PAYLOAD</h3>
                <span className="collapse-icon">{isJsonOpen ? '[-]' : '[+]'}</span>
              </button>
              {isJsonOpen && (
                <div className="collapse-content">
                  <pre>{JSON.stringify(response, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-canvas">
            <div className="empty-icon">{'</>'}</div>
            <h2>AWAITING_INPUT</h2>
            <p>Enter node data in the control panel to generate visual hierarchies.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
