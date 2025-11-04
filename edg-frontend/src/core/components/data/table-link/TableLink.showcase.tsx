// src/core/components/ui/table-link/TableLink.showcase.tsx
import React, { useState } from "react";
import TableLink from "./TableLink";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import { Badge } from "../../ui";
import { Download, Edit, Trash2, FileText, ExternalLink } from "lucide-react";

export const TableLinkShowcase: React.FC = () => {
  const handleClick = (action: string) => {
    alert(`Azione eseguita: ${action}`);
  };

  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const mockProjects = [
    { id: "PRJ-001", name: "Frontend Template", type: "React", priority: "high", status: "completato" },
    { id: "PRJ-002", name: "API Gateway", type: "Node.js", priority: "medium", status: "in_elaborazione" },
    { id: "PRJ-003", name: "Mobile App", type: "React Native", priority: "low", status: "nuovo" },
  ];

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
                    <ThemedText variant="primary" className="font-medium">
                      {project.name}
                    </ThemedText>
                    <ThemedText variant="secondary" className="text-sm">
                      ({project.id})
                    </ThemedText>
                  </div>
                  <ThemedText variant="secondary" className="text-sm">
                    {project.type}
                  </ThemedText>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Badge
                  variant={project.priority === "high" ? "danger" : project.priority === "medium" ? "warning" : "default"}
                  size="xs"
                >
                  {project.priority}
                </Badge>
                <Badge status={project.status}>{project.status}</Badge>
                <TableLink
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
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
          <ThemedText variant="info" className="text-sm">
            Progetto selezionato: <strong>{mockProjects.find((p) => p.id === selectedRow)?.name}</strong>
          </ThemedText>
        </div>
      )}
    </TitledSurface>
  );
};

export default TableLinkShowcase;
