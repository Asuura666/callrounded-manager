import { useState, useEffect } from "react";
import { Plus, MoreVertical, UserPlus, Shield, User as UserIcon, Trash2, Link2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  is_active: boolean;
  created_at: string;
  assigned_agents: { external_id: string; name: string }[];
}

interface Agent {
  external_id: string;
  name: string;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "USER" as const });
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchAgents();
  }, []);

  async function fetchUsers() {
    try {
      const data = await api.get<User[]>("/admin/users");
      setUsers(data);
    } catch (error) {
      console.error("[AdminUsersPage] Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAgents() {
    try {
      const data = await api.get<Agent[]>("/agents");
      setAgents(data);
    } catch (error) {
      console.error("[AdminUsersPage] Failed to fetch agents:", error);
    }
  }

  async function handleCreateUser() {
    try {
      console.log("[AdminUsersPage] Creating user:", newUser.email);
      await api.post("/admin/users", newUser);
      setCreateDialogOpen(false);
      setNewUser({ email: "", password: "", role: "USER" });
      fetchUsers();
    } catch (error) {
      console.error("[AdminUsersPage] Failed to create user:", error);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
    try {
      console.log("[AdminUsersPage] Deleting user:", userId);
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error("[AdminUsersPage] Failed to delete user:", error);
    }
  }

  async function handleToggleRole(user: User) {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      console.log("[AdminUsersPage] Changing role for", user.email, "to", newRole);
      await api.patch(`/admin/users/${user.id}`, { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error("[AdminUsersPage] Failed to update role:", error);
    }
  }

  function openAssignDialog(user: User) {
    setSelectedUser(user);
    setSelectedAgents(user.assigned_agents.map(a => a.external_id));
    setAssignDialogOpen(true);
  }

  async function handleAssignAgents() {
    if (!selectedUser) return;
    try {
      console.log("[AdminUsersPage] Assigning agents to", selectedUser.email, ":", selectedAgents);
      await api.post(`/admin/users/${selectedUser.id}/agents`, { agent_ids: selectedAgents });
      setAssignDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("[AdminUsersPage] Failed to assign agents:", error);
    }
  }

  function toggleAgentSelection(agentId: string) {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">Gestion des utilisateurs</h1>
          <p className="text-text-muted mt-1">Créez et gérez les accès à votre espace W&I</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-gold hover:bg-gold/90 text-navy">
          <Plus className="w-4 h-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Shield className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Administrateurs</p>
                <p className="text-2xl font-bold text-navy">{users.filter(u => u.role === "ADMIN").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-navy/10 rounded-lg">
                <UserIcon className="w-5 h-5 text-navy" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Utilisateurs</p>
                <p className="text-2xl font-bold text-navy">{users.filter(u => u.role === "USER").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Total actifs</p>
                <p className="text-2xl font-bold text-navy">{users.filter(u => u.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-navy font-heading">Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Agents assignés</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className={user.role === "ADMIN" ? "bg-gold text-navy" : ""}>
                      {user.role === "ADMIN" ? "Admin" : "Utilisateur"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.role === "ADMIN" ? (
                      <span className="text-text-muted text-sm">Tous les agents</span>
                    ) : user.assigned_agents.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.assigned_agents.slice(0, 2).map(agent => (
                          <Badge key={agent.external_id} variant="outline" className="text-xs">
                            {agent.name || agent.external_id.slice(0, 8)}
                          </Badge>
                        ))}
                        {user.assigned_agents.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.assigned_agents.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-text-muted text-sm">Aucun</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "destructive"} className={user.is_active ? "bg-green-100 text-green-700" : ""}>
                      {user.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-muted text-sm">
                    {new Date(user.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAssignDialog(user)}>
                          <Link2 className="w-4 h-4 mr-2" />
                          Assigner des agents
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleRole(user)}>
                          <Shield className="w-4 h-4 mr-2" />
                          {user.role === "ADMIN" ? "Retirer admin" : "Promouvoir admin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-navy">Créer un utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="utilisateur@exemple.com"
                value={newUser.email}
                onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={newUser.password}
                onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newUser.role === "USER" ? "default" : "outline"}
                  onClick={() => setNewUser(prev => ({ ...prev, role: "USER" }))}
                  className={newUser.role === "USER" ? "bg-navy" : ""}
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Utilisateur
                </Button>
                <Button
                  type="button"
                  variant={newUser.role === "ADMIN" ? "default" : "outline"}
                  onClick={() => setNewUser(prev => ({ ...prev, role: "ADMIN" }))}
                  className={newUser.role === "ADMIN" ? "bg-gold text-navy" : ""}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateUser} className="bg-gold hover:bg-gold/90 text-navy">
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Agents Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-navy">
              Assigner des agents à {selectedUser?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-text-muted">
              Sélectionnez les agents auxquels cet utilisateur aura accès.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {agents.map(agent => (
                <div
                  key={agent.external_id}
                  onClick={() => toggleAgentSelection(agent.external_id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedAgents.includes(agent.external_id)
                      ? "border-gold bg-gold/10"
                      : "border-border hover:border-gold/50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedAgents.includes(agent.external_id)
                      ? "border-gold bg-gold"
                      : "border-gray-300"
                  }`}>
                    {selectedAgents.includes(agent.external_id) && (
                      <svg className="w-3 h-3 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium">{agent.name || `Agent ${agent.external_id.slice(0, 8)}`}</span>
                </div>
              ))}
              {agents.length === 0 && (
                <p className="text-center text-text-muted py-4">Aucun agent disponible</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAssignAgents} className="bg-gold hover:bg-gold/90 text-navy">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
