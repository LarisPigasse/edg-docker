// src/core/components/ui/table-link/TableLink.showcase.tsx
import React, { useState } from "react";
import TableLink from "./TableLink";
import { TitledSurface } from "../../layout";

import { Badge } from "../../ui";
import { FileText, ExternalLink } from "lucide-react";

export const TableLinkShowcase: React.FC = () => {
  const handleRowClick = (action: string) => {
    alert(`Azione eseguita: ${action}`);
    setSelectedRow(action);
  };

  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const mockProjects = [
    { id: "PRJ-001", name: "Frontend Template", type: "React", priority: "high", status: "completato" },
    { id: "PRJ-002", name: "API Gateway", type: "Node.js", priority: "medium", status: "in_elaborazione" },
    { id: "PRJ-003", name: "Mobile App", type: "React Native", priority: "low", status: "nuovo" },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completato": return "success";
      case "in_elaborazione": return "warning";
      case "nuovo": return "info";
      default: return "default";
    }
  };

  return (
    <TitledSurface title="TableLink - Righe Cliccabili" padding="md">
      <div className="space-y-2">
        {mockProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => handleRowClick(project.id)}
            className={`
                p-4 border border-border-default rounded-lg cursor-pointer transition-all
                hover:bg-bg-hover hover:border-border-strong
                ${selectedRow === project.id ? "bg-bg-selected border-border-contrast" : "bg-bg-primary"}
              `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-text-secondary" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-text-primary">
                      {project.name}
                    </span>
                    <span className="text-sm text-text-secondary">
                      ({project.id})
                    </span>
                  </div>
                  <span className="text-sm text-text-secondary">
                    {project.type}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Badge
                  variant={project.priority === "high" ? "danger" : project.priority === "medium" ? "warning" : "default"}
                  size="xs"
                >
                  {project.priority}
                </Badge>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Badge variant={getStatusVariant(project.status) as any}>{project.status}</Badge>
                <TableLink
                  variant="primary"
                  onClick={() => {
                    alert(`Navigating to ${project.name}`);
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                </TableLink>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedRow && (
        <div className="mt-4 p-3 bg-bg-info border border-border-default rounded-lg">
          <span className="text-sm text-text-primary">
            Progetto selezionato: <strong>{mockProjects.find((p) => p.id === selectedRow)?.name}</strong>
          </span>
        </div>
      )}
    </TitledSurface>
  );
};

export default TableLinkShowcase;
