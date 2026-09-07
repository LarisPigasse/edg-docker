// src/core/components/ui/table/Table.showcase.tsx
import React from "react";
import Table from "./Table";
import type { TableColumn } from "./Table";
import { TitledSurface } from "../../layout";

import { Badge } from "../../ui";
import { Users, FileText, Eye, Copy, Download } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "Member" | "Guest";
  status: "Active" | "Pending" | "Banned";
}

// Mock data for table examples
const mockUsers = [
  { id: "1", name: "Mario Rossi", email: "mario.rossi@example.com", role: "Admin", status: "attivo" },
  { id: "2", name: "Laura Bianchi", email: "laura.bianchi@example.com", role: "Editor", status: "inattivo" },
  { id: "3", name: "Paolo Verdi", email: "paolo.verdi@example.com", role: "Viewer", status: "pendente" },
];

const mockProjects = [
  { id: "PRJ-001", name: "Frontend Template", type: "React", priority: "high", status: "completato" },
  { id: "PRJ-002", name: "API Gateway", type: "Node.js", priority: "medium", status: "in_elaborazione" },
  { id: "PRJ-003", name: "Mobile App", type: "React Native", priority: "low", status: "nuovo" },
];



export const TableShowcase: React.FC = () => {
  const handleEmailClick = (user: (typeof mockUsers)[0]) => {
    window.open(`mailto:${user.email}`, "_blank");
  };

  const handleEditUser = (user: (typeof mockUsers)[0]) => {
    alert(`Modifica utente: ${user.name}`);
  };

  const handleDeleteUser = (user: (typeof mockUsers)[0]) => {
    alert(`Elimina utente: ${user.name}`);
  };

  const handleDuplicateUser = (user: (typeof mockUsers)[0]) => {
    alert(`Duplica utente: ${user.name}`);
  };

  const handleExportUser = (user: (typeof mockUsers)[0]) => {
    alert(`Esporta utente: ${user.name}`);
  };

  const handleEditProject = (project: (typeof mockProjects)[0]) => {
    alert(`Modifica progetto: ${project.name}`);
  };

  const handleDeleteProject = (project: (typeof mockProjects)[0]) => {
    alert(`Elimina progetto: ${project.name}`);
  };

  const columns: TableColumn<User>[] = [
    {
      header: "Utente",
      accessor: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-bg-secondary rounded-full flex items-center justify-center font-bold">
            {item.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-text-primary">{item.name}</div>
            <div className="text-text-secondary">{item.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Ruolo",
      accessor: "role",
    },
    {
      header: "Stato",
      accessor: (item) => (
        <Badge variant={item.status === "Active" ? "success" : item.status === "Pending" ? "warning" : "danger"}>
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Table with Actions - Menu Mode */}
      <TitledSurface title="Table con Actions - Modalità Menu" padding="md">
        <Table
          data={mockUsers}
          columns={[
            {
              header: "Utente",
              accessor: (user) => (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-text-secondary" />
                  <span className="font-medium text-text-primary">
                    {user.name}
                  </span>
                </div>
              ),
            },
            {
              header: "Email",
              accessor: "email",
              clickable: true,
              clickVariant: "primary",
              onCellClick: handleEmailClick,
            },
            { header: "Ruolo", accessor: "role" },
            {
              header: "Status",
              accessor: (user) => <Badge status={user.status}>{user.status}</Badge>,
            },
          ]}
          keyExtractor={(user) => user.id}
          rowActions={{
            enabled: true,
            mode: "menu",
            quickActions: {
              edit: {
                enabled: true,
                onEdit: handleEditUser,
              },
              delete: {
                enabled: true,
                onDelete: handleDeleteUser,
                requireConfirmation: true,
                getItemName: (user) => user.name,
              },
            },
            actions: (user) => [
              {
                id: "duplicate",
                label: "Duplica",
                onClick: () => handleDuplicateUser(user),
                icon: <Copy className="w-4 h-4" />,
                divider: true,
              },
              {
                id: "export",
                label: "Esporta",
                onClick: () => handleExportUser(user),
                icon: <Download className="w-4 h-4" />,
              },
            ],
          }}
          hoverable
          striped
          size="md"
        />
      </TitledSurface>

      {/* Table with Actions - Buttons Mode */}
      <TitledSurface title="Table con Actions - Modalità Bottoni" padding="md">
        <Table
          data={mockProjects}
          columns={[
            {
              header: "Progetto",
              accessor: (project) => (
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-text-secondary" />
                  <div>
                    <span className="font-medium text-text-primary">
                      {project.name}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {project.id}
                    </span>
                  </div>
                </div>
              ),
            },
            { header: "Tecnologia", accessor: "type" },
            {
              header: "Priorità",
              accessor: (project) => (
                <Badge
                  variant={project.priority === "high" ? "danger" : project.priority === "medium" ? "warning" : "default"}
                  size="xs"
                >
                  {project.priority}
                </Badge>
              ),
            },
            {
              header: "Status",
              accessor: (project) => <Badge status={project.status}>{project.status}</Badge>,
            },
          ]}
          keyExtractor={(project) => project.id}
          rowActions={{
            enabled: true,
            mode: "buttons",
            quickActions: {
              edit: {
                enabled: true,
                onEdit: handleEditProject,
                showLabel: false,
              },
              delete: {
                enabled: true,
                onDelete: handleDeleteProject,
                requireConfirmation: true,
                getItemName: (project) => project.name,
                showLabel: false,
              },
            },
          }}
          hoverable
          size="md"
        />
      </TitledSurface>

      {/* Table with Actions - Mixed Mode */}
      <TitledSurface title="Table con Actions - Modalità Mista" padding="md">
        <Table
          data={mockUsers}
          columns={[
            {
              header: "Utente",
              accessor: (user) => (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-text-secondary" />
                  <span className="font-medium text-text-primary">
                    {user.name}
                  </span>
                </div>
              ),
            },
            { header: "Email", accessor: "email" },
            { header: "Ruolo", accessor: "role" },
            {
              header: "Status",
              accessor: (user) => <Badge status={user.status}>{user.status}</Badge>,
            },
          ]}
          keyExtractor={(user) => user.id}
          rowActions={{
            enabled: true,
            mode: "mixed",
            header: "Operazioni",
            quickActions: {
              edit: {
                enabled: true,
                onEdit: handleEditUser,
              },
              delete: {
                enabled: true,
                onDelete: handleDeleteUser,
                requireConfirmation: true,
                getItemName: (user) => user.name,
              },
            },
            actions: (user) => [
              {
                id: "duplicate",
                label: "Duplica Utente",
                onClick: () => handleDuplicateUser(user),
                icon: <Copy className="w-4 h-4" />,
              },
              {
                id: "export",
                label: "Esporta Dati",
                onClick: () => handleExportUser(user),
                icon: <Download className="w-4 h-4" />,
              },
              {
                id: "view",
                label: "Visualizza Dettagli",
                onClick: () => alert(`Visualizza dettagli: ${user.name}`),
                icon: <Eye className="w-4 h-4" />,
              },
            ],
          }}
          hoverable
          striped
          size="md"
        />
      </TitledSurface>

      <TitledSurface title="Stati della Tabella" variant="secondary" padding="lg">
        <div className="space-y-8">
          <div>
            <span className="mb-4 font-semibold block text-text-secondary">
              Stato Vuoto
            </span>
            <Table<User> data={[]} columns={columns} keyExtractor={(u) => u.id} emptyMessage="Nessun elemento trovato." />
          </div>
          <div>
            <span className="mb-4 font-semibold block text-text-secondary">
              Stato di Caricamento
            </span>
            <Table<User> data={[]} columns={columns} keyExtractor={(u) => u.id} isLoading />
          </div>
        </div>
      </TitledSurface>
    </div>
  );
};

export default TableShowcase;
