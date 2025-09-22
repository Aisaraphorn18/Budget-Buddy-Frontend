export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/Logo.png" alt="logo" />
        <span>Budget Buddy</span>
      </div>

      <nav className="nav">
        <a className="nav-item"><span className="nav-ic">💼</span> My Wallet</a>
        <a className="nav-item"><span className="nav-ic">🧾</span> Transaction</a>
        <a className="nav-item active"><span className="nav-ic">📈</span> Graph</a>
      </nav>

      <div className="logout">
        <button className="logout-btn">
          Log Out <img className="icon" src="/logout.png" alt="logout"/>
        </button>
      </div>
    </aside>
  );
}
