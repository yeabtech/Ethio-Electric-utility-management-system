"use client";
import { useEffect, useState } from "react";

const EVENT_TYPES = [
  { value: "all", label: "All Events" },
  { value: "user.signed_in", label: "Logins" },
  { value: "user.password_updated", label: "Password Changes" },
  { value: "user.deleted", label: "User Deletions" },
];

export default function SystemSecurityPage() {
  // Security Logs State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [filter, setFilter] = useState("all");

  // User Management State
  const [userId, setUserId] = useState("");
  const [newRole, setNewRole] = useState("");
  const [roleUpdateMsg, setRoleUpdateMsg] = useState("");

  // Session Management State
  const [sessionId, setSessionId] = useState("");
  const [sessionMsg, setSessionMsg] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const res = await fetch("/api/clerk/logs");
        const data = await res.json();
        setLogs(data);
      } catch {
        setLogs([]);
      }
      setLoadingLogs(false);
    };
    fetchLogs();
  }, []);

  const filteredLogs = filter === "all" ? logs : logs.filter((log: any) => log.action === filter);

  // User Role Update
  const handleRoleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleUpdateMsg("");
    try {
      const res = await fetch("/api/clerk/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });
      const data = await res.json();
      if (res.ok) setRoleUpdateMsg("Role updated successfully.");
      else setRoleUpdateMsg(data.error || "Failed to update role.");
    } catch {
      setRoleUpdateMsg("Failed to update role.");
    }
  };

  // Session Revoke
  const handleRevokeSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionMsg("");
    try {
      const res = await fetch("/api/clerk/revoke-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (res.ok) setSessionMsg("Session revoked successfully.");
      else setSessionMsg(data.error || "Failed to revoke session.");
    } catch {
      setSessionMsg("Failed to revoke session.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-6 text-[#174B5A]">System Security Logs & Management</h1>
      {/* Security Logs Section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-2">Security Logs</h2>
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="eventType" className="font-medium">Event Type:</label>
          <select
            id="eventType"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {EVENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        {loadingLogs ? (
          <div>Loading logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 border">Timestamp</th>
                  <th className="px-2 py-1 border">Event</th>
                  <th className="px-2 py-1 border">User</th>
                  <th className="px-2 py-1 border">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-2">No logs found.</td></tr>
                ) : filteredLogs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-2 py-1 border">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-2 py-1 border">{log.action}</td>
                    <td className="px-2 py-1 border">{log.user?.email || "System"}</td>
                    <td className="px-2 py-1 border">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* Key Security Management Features */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-2">Key Security Management Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Management */}
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">User Management</h3>
            <form onSubmit={handleRoleUpdate} className="space-y-2">
              <input
                type="text"
                placeholder="User ID"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                className="border rounded px-2 py-1 w-full"
                required
              />
              <input
                type="text"
                placeholder="New Role (e.g., admin, user)"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="border rounded px-2 py-1 w-full"
                required
              />
              <button type="submit" className="bg-[#174B5A] text-white px-4 py-1 rounded">Update Role</button>
              {roleUpdateMsg && <div className="text-sm mt-1">{roleUpdateMsg}</div>}
            </form>
          </div>
          {/* Session Management */}
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Session Management</h3>
            <form onSubmit={handleRevokeSession} className="space-y-2">
              <input
                type="text"
                placeholder="Session ID"
                value={sessionId}
                onChange={e => setSessionId(e.target.value)}
                className="border rounded px-2 py-1 w-full"
                required
              />
              <button type="submit" className="bg-[#174B5A] text-white px-4 py-1 rounded">Revoke Session</button>
              {sessionMsg && <div className="text-sm mt-1">{sessionMsg}</div>}
            </form>
          </div>
        </div>
      </section>
      <div className="text-sm text-gray-500">
        For more information or to manage security settings, please contact your system administrator or visit the Clerk dashboard.
      </div>
    </div>
  );
}
