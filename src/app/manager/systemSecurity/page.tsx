"use client";
import { useEffect, useState } from "react";

export default function SystemSecurityPage() {
  // User Management State
  const [userId, setUserId] = useState("");
  const [newRole, setNewRole] = useState("");
  const [roleUpdateMsg, setRoleUpdateMsg] = useState("");
  const [disableUserMsg, setDisableUserMsg] = useState("");

  // Session Management State
  const [sessionId, setSessionId] = useState("");
  const [sessionMsg, setSessionMsg] = useState("");

  // List Users State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await fetch("/api/clerk/list-users");
        const data = await res.json();
        setUsers(data.users || []);
      } catch {
        setUsers([]);
      }
      setLoadingUsers(false);
    };
    fetchUsers();
  }, []);

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

  // Disable/Enable User
  const handleDisableUser = async (userId: string, disable: boolean) => {
    setDisableUserMsg("");
    try {
      const res = await fetch("/api/clerk/disable-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, disable }),
      });
      const data = await res.json();
      if (res.ok) setDisableUserMsg(disable ? "User disabled." : "User enabled.");
      else setDisableUserMsg(data.error || "Failed to update user status.");
    } catch {
      setDisableUserMsg("Failed to update user status.");
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
      <h1 className="text-2xl font-bold mb-6 text-[#174B5A]">System Security Management</h1>
      {/* List Users Section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-2">User List</h2>
        {loadingUsers ? (
          <div>Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 border">User ID</th>
                  <th className="px-2 py-1 border">Email</th>
                  <th className="px-2 py-1 border">Role</th>
                  <th className="px-2 py-1 border">Status</th>
                  <th className="px-2 py-1 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-2">No users found.</td></tr>
                ) : users.map((user: any) => (
                  <tr key={user.id}>
                    <td className="px-2 py-1 border">{user.id}</td>
                    <td className="px-2 py-1 border">{user.emailAddresses?.[0]?.emailAddress || "N/A"}</td>
                    <td className="px-2 py-1 border">{user.publicMetadata?.role || "N/A"}</td>
                    <td className="px-2 py-1 border">{user.disabled ? "Disabled" : "Active"}</td>
                    <td className="px-2 py-1 border space-x-2">
                      <button onClick={() => handleDisableUser(user.id, !user.disabled)} className="bg-gray-200 px-2 py-1 rounded">
                        {user.disabled ? "Enable" : "Disable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {disableUserMsg && <div className="text-sm mt-2">{disableUserMsg}</div>}
          </div>
        )}
      </section>
      {/* Key Security Management Features */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-2">Key Security Management Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Management */}
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">User Role Management</h3>
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
