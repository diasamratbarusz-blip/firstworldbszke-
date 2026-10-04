import { useEffect, useState } from "react";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function App() {
  const [network, setNetwork] = useState({
    nodes: [],
    links: []
  });

  const [stats, setStats] = useState({});
  const [route, setRoute] = useState(null);
  const [from, setFrom] = useState("A001");
  const [to, setTo] = useState("G001");

  async function loadNetwork() {
    const response = await fetch(
      `${API}/api/network`
    );

    const data = await response.json();

    setNetwork({
      nodes: data.nodes,
      links: data.links
    });
  }

  async function loadStats() {
    const response = await fetch(
      `${API}/api/stats`
    );

    const data = await response.json();

    setStats(data);
  }

  async function calculateRoute() {
    const response = await fetch(
      `${API}/api/routes?from=${from}&to=${to}`
    );

    const data = await response.json();

    setRoute(data);
  }

  async function toggleNode(node) {
    await fetch(
      `${API}/api/nodes/${node.id}/status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          online: !node.online
        })
      }
    );

    loadNetwork();
    loadStats();

    if (from && to) {
      calculateRoute();
    }
  }

  useEffect(() => {
    loadNetwork();
    loadStats();

    const wsUrl =
      API.replace("http://", "ws://")
        .replace("https://", "wss://") +
      "/ws";

    const socket = new WebSocket(wsUrl);

    socket.onmessage = event => {
      const data = JSON.parse(event.data);

      if (
        data.type === "NETWORK_STATE"
      ) {
        setNetwork({
          nodes: data.nodes,
          links: data.links
        });
      }

      if (
        data.type === "NODE_STATUS_CHANGED"
      ) {
        loadNetwork();
        loadStats();
      }
    };

    return () => socket.close();
  }, []);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          MESH<span>NET</span>
        </div>

        <nav>
          <a className="active">
            Dashboard
          </a>

          <a>Nodes</a>
          <a>Routes</a>
          <a>Gateways</a>
          <a>Traffic</a>
          <a>Security</a>
          <a>Settings</a>
        </nav>
      </aside>

      <main className="main">
        <header>
          <div>
            <h1>Network Control Center</h1>

            <p>
              Monitor and control your mesh network
            </p>
          </div>

          <div className="status">
            <span></span>
            NETWORK ONLINE
          </div>
        </header>

        <section className="stats">
          <StatCard
            title="Total Nodes"
            value={stats.totalNodes || 0}
          />

          <StatCard
            title="Online"
            value={stats.onlineNodes || 0}
          />

          <StatCard
            title="Offline"
            value={stats.offlineNodes || 0}
          />

          <StatCard
            title="Gateways"
            value={stats.gateways || 0}
          />
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>Network Topology</h2>

            <span>
              {network.links.length} links
            </span>
          </div>

          <div className="network-map">
            {network.links.map(
              ([a, b], index) => {
                return (
                  <div
                    className="link"
                    key={index}
                  >
                    {a} ───────── {b}
                  </div>
                );
              }
            )}

            <div className="node-list">
              {network.nodes.map(node => (
                <div
                  className={`node ${
                    node.online
                      ? "online"
                      : "offline"
                  }`}
                  key={node.id}
                >
                  <div>
                    <strong>
                      {node.name}
                    </strong>

                    <small>
                      {node.id}
                    </small>
                  </div>

                  <button
                    onClick={() =>
                      toggleNode(node)
                    }
                  >
                    {node.online
                      ? "Disable"
                      : "Enable"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>Route Tester</h2>
          </div>

          <div className="route-controls">
            <select
              value={from}
              onChange={e =>
                setFrom(e.target.value)
              }
            >
              {network.nodes.map(node => (
                <option
                  key={node.id}
                  value={node.id}
                >
                  {node.name}
                </option>
              ))}
            </select>

            <span>→</span>

            <select
              value={to}
              onChange={e =>
                setTo(e.target.value)
              }
            >
              {network.nodes.map(node => (
                <option
                  key={node.id}
                  value={node.id}
                >
                  {node.name}
                </option>
              ))}
            </select>

            <button
              className="primary"
              onClick={calculateRoute}
            >
              Find Route
            </button>
          </div>

          {route && (
            <div className="route-result">
              {route.reachable ? (
                <>
                  <strong>
                    Route found
                  </strong>

                  <div>
                    {route.route.join(
                      " → "
                    )}
                  </div>

                  <small>
                    {route.route.length -
                      1} hops
                  </small>
                </>
              ) : (
                <strong className="danger">
                  No route available
                </strong>
              )}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>Nodes</h2>
          </div>

          <div className="table">
            <div className="table-row table-head">
              <span>ID</span>
              <span>Name</span>
              <span>Type</span>
              <span>Status</span>
            </div>

            {network.nodes.map(node => (
              <div
                className="table-row"
                key={node.id}
              >
                <span>{node.id}</span>

                <span>{node.name}</span>

                <span>
                  {node.gateway
                    ? "Gateway"
                    : "Mesh Node"}
                </span>

                <span
                  className={
                    node.online
                      ? "good"
                      : "danger"
                  }
                >
                  {node.online
                    ? "ONLINE"
                    : "OFFLINE"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
