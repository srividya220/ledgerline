import { useEffect, useState } from 'react'
import api from './api'

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(value || 0))

function App() {
  const [token, setToken] = useState(localStorage.getItem('ledgerline_token'))
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ledgerline_user') || 'null')
    } catch {
      return null
    }
  })
  const [accounts, setAccounts] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [page, setPage] = useState('overview')
  const [authMode, setAuthMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [auth, setAuth] = useState({ fullName: '', email: '', password: '' })
  const [form, setForm] = useState({
    amount: '',
    targetAccountNumber: ''
  })

  const selectedAccount = accounts.find(
    (account) => account.id === selectedId
  ) || accounts[0]

  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0
  )

  const showError = (err) => {
    setError(
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Something went wrong. Please try again.'
    )
    setNotice('')
  }

  const loadAccounts = async () => {
    try {
      const response = await api.get('/accounts')
      const data = Array.isArray(response.data) ? response.data : []
      setAccounts(data)
      setSelectedId((current) =>
        data.some((account) => account.id === current)
          ? current
          : data[0]?.id ?? null
      )
    } catch (err) {
      showError(err)
    }
  }

  const loadTransactions = async (id) => {
    if (!id) return
    try {
      const response = await api.get(`/accounts/${id}/transactions`)
      setTransactions(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      showError(err)
    }
  }

  useEffect(() => {
    if (token) loadAccounts()
  }, [token])

  useEffect(() => {
    if (selectedId && page === 'transactions') {
      loadTransactions(selectedId)
    }
  }, [selectedId, page])

  const handleAuth = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register'
      const payload = authMode === 'login'
        ? { email: auth.email, password: auth.password }
        : auth

      const response = await api.post(endpoint, payload)
      const data = response.data

      if (!data.token) {
        throw new Error('Authentication succeeded, but no token was returned.')
      }

      localStorage.setItem('ledgerline_token', data.token)
      localStorage.setItem('ledgerline_user', JSON.stringify(data))
      setToken(data.token)
      setUser(data)
      setNotice('Welcome to LedgerLine!')
      setPage('overview')
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('ledgerline_token')
    localStorage.removeItem('ledgerline_user')
    setToken(null)
    setUser(null)
    setAccounts([])
    setTransactions([])
    setAuth({ fullName: '', email: '', password: '' })
    setPage('overview')
    setNotice('')
    setError('')
  }

  const performAction = async (event) => {
    event.preventDefault()
    if (!selectedAccount) return

    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than zero.')
      return
    }

    setLoading(true)
    setError('')
    setNotice('')

    try {
      if (page === 'deposit') {
        await api.post(`/accounts/${selectedAccount.id}/deposit`, { amount })
        setNotice('Deposit completed successfully.')
      } else if (page === 'withdraw') {
        await api.post(`/accounts/${selectedAccount.id}/withdraw`, { amount })
        setNotice('Withdrawal completed successfully.')
      } else if (page === 'transfer') {
        if (!form.targetAccountNumber.trim()) {
          throw new Error('Please enter the recipient account number.')
        }
        await api.post(`/accounts/${selectedAccount.id}/transfer`, {
          amount,
          targetAccountNumber: form.targetAccountNumber.trim()
        })
        setNotice('Transfer completed successfully.')
      }

      setForm({ amount: '', targetAccountNumber: '' })
      await loadAccounts()
      if (page === 'transactions') await loadTransactions(selectedAccount.id)
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { id: 'overview', icon: '⌂', label: 'Overview' },
    { id: 'deposit', icon: '＋', label: 'Deposit' },
    { id: 'withdraw', icon: '↗', label: 'Withdraw' },
    { id: 'transfer', icon: '⇄', label: 'Transfer money' },
    { id: 'transactions', icon: '▤', label: 'Transactions' }
  ]

  if (!token) {
    return (
      <main className="auth-screen">
        <section className="auth-art">
          <div className="brand brand-light"><span className="brand-mark">L</span> LedgerLine</div>
          <div className="auth-message">
            <span className="eyebrow">YOUR MONEY. YOUR CONTROL.</span>
            <h1>Banking made<br />beautifully simple.</h1>
            <p>Manage your money, move it securely, and keep track of every transaction — all in one place.</p>
            <div className="art-card">
              <span>YOUR FINANCES, AT A GLANCE</span>
              <div className="art-balance">₹ 1,25,000.00</div>
              <div className="art-bottom"><span>Available balance</span><span>•••• 2048</span></div>
            </div>
          </div>
          <div className="auth-foot">Secure digital banking · LedgerLine</div>
        </section>

        <section className="auth-panel">
          <div className="auth-form-wrap">
            <div className="brand brand-dark"><span className="brand-mark">L</span> LedgerLine</div>
            <span className="eyebrow auth-eyebrow">WELCOME {authMode === 'login' ? 'BACK' : 'ABOARD'}</span>
            <h2>{authMode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2>
            <p className="muted">Enter your details to access your banking dashboard.</p>

            {error && <div className="alert error">{error}</div>}
            {notice && <div className="alert success">{notice}</div>}

            <form onSubmit={handleAuth} className="form-stack">
              {authMode === 'register' && (
                <label>Full name
                  <input
                    required
                    value={auth.fullName}
                    onChange={(e) => setAuth({ ...auth, fullName: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </label>
              )}
              <label>Email address
                <input
                  required
                  type="email"
                  value={auth.email}
                  onChange={(e) => setAuth({ ...auth, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </label>
              <label>Password
                <input
                  required
                  type="password"
                  minLength="6"
                  value={auth.password}
                  onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                  placeholder="Enter your password"
                />
              </label>
              <button className="primary-btn full-btn" disabled={loading}>
                {loading ? 'Please wait...' : authMode === 'login' ? 'Sign in →' : 'Create account →'}
              </button>
            </form>

            <p className="switch-auth">
              {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login')
                setError('')
                setNotice('')
              }}>
                {authMode === 'login' ? 'Create account' : 'Sign in'}
              </button>
            </p>
            <p className="secure-note">⌑ Your account is protected with secure authentication.</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand brand-light"><span className="brand-mark">L</span> LedgerLine</div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => {
                setPage(item.id)
                setError('')
                setNotice('')
              }}
            >
              <span className="nav-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">✦</span>
            <strong>Banking, simplified.</strong>
            <p>Your finances, organized in one place.</p>
          </div>
          <button className="nav-item logout-btn" onClick={logout}>
            <span className="nav-icon">↪</span> Sign out
          </button>
          <div className="sidebar-version">LEDGERLINE · DIGITAL BANKING</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="topbar-label">PERSONAL BANKING</span>
            <div className="topbar-title">My workspace</div>
          </div>
          <div className="profile">
            <div className="avatar">{(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}</div>
            <div className="profile-info">
              <strong>{user?.fullName || 'Welcome'}</strong>
              <span>{user?.email || ''}</span>
            </div>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">SUNDAY, NOVEMBER 8, 2026</span>
              <h1>{page === 'overview' ? 'Good to see you' : navItems.find((item) => item.id === page)?.label}</h1>
              <p className="muted">
                {page === 'overview' ? 'Here is what is happening with your money today.' : 'Manage your banking activity securely.'}
              </p>
            </div>
            <div className="status-pill"><span className="status-dot"></span> Account active</div>
          </div>

          {error && <div className="alert error">{error}</div>}
          {notice && <div className="alert success">{notice}</div>}

          {page === 'overview' && (
            <>
              <section className="balance-grid">
                <div className="balance-card">
                  <div className="balance-card-top"><span>Total balance</span><span className="balance-symbol">₹</span></div>
                  <div className="total-amount">{money(totalBalance)}</div>
                  <div className="balance-card-bottom"><span>Across {accounts.length} account{accounts.length === 1 ? '' : 's'}</span><span>INR · Indian Rupee</span></div>
                </div>
                <div className="small-stat">
                  <span className="stat-icon green">▣</span>
                  <span className="stat-label">Total accounts</span>
                  <strong>{accounts.length}</strong>
                  <span className="stat-foot">Your linked accounts</span>
                </div>
                <div className="small-stat">
                  <span className="stat-icon purple">↔</span>
                  <span className="stat-label">Quick access</span>
                  <strong>Secure</strong>
                  <span className="stat-foot">Protected banking</span>
                </div>
              </section>

              <section className="section-block">
                <div className="section-heading">
                  <div><h2>Your accounts</h2><p className="muted">Select an account to manage your money.</p></div>
                </div>
                {accounts.length === 0 ? (
                  <div className="empty-state">No accounts found for this user.</div>
                ) : (
                  <div className="account-grid">
                    {accounts.map((account) => (
                      <button
                        key={account.id}
                        className={`account-card ${selectedId === account.id ? 'selected' : ''}`}
                        onClick={() => setSelectedId(account.id)}
                      >
                        <div className="account-card-top"><span className="account-symbol">L</span><span className="account-chip">ACTIVE</span></div>
                        <span className="account-holder">{account.accountHolderName}</span>
                        <span className="account-number">A/C · {account.accountNumber}</span>
                        <strong className="account-balance">{money(account.balance)}</strong>
                        <span className="account-card-foot">{selectedId === account.id ? 'Selected account ✓' : 'Click to select account →'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="section-block">
                <div className="section-heading"><div><h2>Quick actions</h2><p className="muted">What would you like to do today?</p></div></div>
                <div className="quick-grid">
                  {[
                    ['deposit', '＋', 'Add money', 'Deposit funds'],
                    ['withdraw', '↗', 'Withdraw', 'Take out funds'],
                    ['transfer', '⇄', 'Transfer', 'Send money'],
                    ['transactions', '▤', 'History', 'View activity']
                  ].map(([id, icon, title, description]) => (
                    <button key={id} className="quick-card" onClick={() => { setPage(id); setError(''); setNotice('') }}>
                      <span className="quick-icon">{icon}</span><strong>{title}</strong><span>{description}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {['deposit', 'withdraw', 'transfer'].includes(page) && (
            <section className="action-layout">
              <div className="action-card">
                <span className="eyebrow">ACCOUNT OPERATIONS</span>
                <h2>{page === 'deposit' ? 'Deposit money' : page === 'withdraw' ? 'Withdraw money' : 'Transfer money'}</h2>
                <p className="muted">
                  {page === 'deposit' ? 'Add funds to your selected account.' : page === 'withdraw' ? 'Withdraw funds from your selected account.' : 'Send funds to another LedgerLine account.'}
                </p>

                {accounts.length === 0 ? (
                  <div className="empty-state">No accounts are available for this user.</div>
                ) : (
                  <form onSubmit={performAction} className="form-stack action-form">
                    <label>Select account
                      <select value={selectedId || ''} onChange={(e) => setSelectedId(Number(e.target.value))}>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>{account.accountHolderName} · {account.accountNumber}</option>
                        ))}
                      </select>
                    </label>
                    <div className="available-box">
                      <span>Available balance</span>
                      <strong>{money(selectedAccount?.balance)}</strong>
                    </div>
                    {page === 'transfer' && (
                      <label>Recipient account number
                        <input
                          required
                          value={form.targetAccountNumber}
                          onChange={(e) => setForm({ ...form, targetAccountNumber: e.target.value })}
                          placeholder="Enter recipient account number"
                        />
                      </label>
                    )}
                    <label>Amount (INR)
                      <div className="amount-input"><span>₹</span><input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></div>
                    </label>
                    <button className="primary-btn full-btn" disabled={loading || !selectedAccount}>
                      {loading ? 'Processing...' : page === 'deposit' ? 'Confirm deposit →' : page === 'withdraw' ? 'Confirm withdrawal →' : 'Send transfer →'}
                    </button>
                  </form>
                )}
              </div>
              <div className="action-aside">
                <div className="aside-icon">⌑</div>
                <h3>Keep your money moving safely.</h3>
                <p>Always double-check account details before confirming a transaction. Never share your password or authentication token.</p>
                <div className="aside-divider"></div>
                <span className="aside-label">SELECTED ACCOUNT</span>
                <strong>{selectedAccount?.accountNumber || 'No account selected'}</strong>
                <span className="muted">{selectedAccount?.accountHolderName || ''}</span>
              </div>
            </section>
          )}

          {page === 'transactions' && (
            <section className="section-block transaction-section">
              <div className="section-heading">
                <div><h2>Transaction history</h2><p className="muted">Review activity for your selected account.</p></div>
                {accounts.length > 0 && (
                  <select className="account-select" value={selectedId || ''} onChange={(e) => setSelectedId(Number(e.target.value))}>
                    {accounts.map((account) => <option key={account.id} value={account.id}>{account.accountNumber}</option>)}
                  </select>
                )}
              </div>
              {accounts.length === 0 ? <div className="empty-state">No accounts available.</div> : transactions.length === 0 ? (
                <div className="empty-state"><span className="empty-icon">▤</span><strong>No transactions yet</strong><p>Your account activity will appear here.</p></div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>TRANSACTION</th><th>TYPE</th><th>DATE</th><th>AMOUNT</th></tr></thead>
                    <tbody>
                      {transactions.map((transaction, index) => (
                        <tr key={transaction.id || index}>
                          <td><strong>{transaction.description || transaction.type || 'Account activity'}</strong></td>
                          <td><span className="type-pill">{transaction.type || 'TRANSACTION'}</span></td>
                          <td>{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString('en-IN') : '—'}</td>
                          <td className="amount-cell">{money(transaction.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          <footer className="page-footer">© 2026 LedgerLine · Secure digital banking experience</footer>
        </div>
      </main>
    </div>
  )
}

export default App
