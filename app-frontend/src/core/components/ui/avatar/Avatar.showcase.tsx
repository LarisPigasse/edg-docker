// src/core/components/ui/avatar/Avatar.showcase.tsx
import React, { useState } from "react";
import Avatar from "./Avatar";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import { Badge } from "../";
import { User, Settings, Shield, Star, Camera, Edit3, Users, Crown, Heart, Zap, Coffee, Gamepad2, Music } from "lucide-react";

/**
 * AvatarShowcase - Showcase completo per il Avatar component.
 *
 * Dimostra tutte le features dell'Avatar:
 * - Tutte le dimensioni (xs, sm, md, lg, xl)
 * - Tutte le forme (circle, square, rounded)
 * - Tutte le varianti colore (primary, secondary, success, warning, danger, info)
 * - Status indicators con tutte le posizioni
 * - Avatar interattivi e cliccabili
 * - Fallback intelligenti (immagine → iniziali → icona)
 * - Avatar groups e overlapping
 * - Use cases reali (user lists, teams, profiles)
 */
export const AvatarShowcase: React.FC = () => {
  // State per dimostrazioni interattive
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [favoriteAvatars, setFavoriteAvatars] = useState<Set<string>>(new Set());

  // Mock users per esempi realistici
  const mockUsers = [
    { id: "1", name: "Alice Johnson", initials: "AJ", status: "online", role: "Designer", avatar: null },
    { id: "2", name: "Bob Smith", initials: "BS", status: "busy", role: "Developer", avatar: "/avatar2.jpg" },
    { id: "3", name: "Carol Davis", initials: "CD", status: "away", role: "Manager", avatar: null },
    { id: "4", name: "David Wilson", initials: "DW", status: "offline", role: "Tester", avatar: "/avatar4.jpg" },
    { id: "5", name: "Eva Martinez", initials: "EM", status: "online", role: "Designer", avatar: null },
  ];

  const teamMembers = [
    { id: "t1", name: "Marco Rossi", initials: "MR", avatar: "/team1.jpg" },
    { id: "t2", name: "Laura Bianchi", initials: "LB", avatar: null },
    { id: "t3", name: "Giuseppe Verdi", initials: "GV", avatar: "/team3.jpg" },
    { id: "t4", name: "Anna Neri", initials: "AN", avatar: null },
    { id: "t5", name: "Francesco Blu", initials: "FB", avatar: "/team5.jpg" },
  ];

  // Handlers per interazioni
  const handleAvatarClick = (userId: string, userName: string) => {
    setSelectedUser(`${userName} (${userId})`);
    setClickCount((prev) => prev + 1);

    // Simula azione (es. apri profilo)
    console.log(`Opening profile for ${userName}`);
  };

  const toggleFavorite = (userId: string) => {
    setFavoriteAvatars((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(userId)) {
        newFavorites.delete(userId);
      } else {
        newFavorites.add(userId);
      }
      return newFavorites;
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "online":
        return "success";
      case "busy":
        return "danger";
      case "away":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-8">
      {/* Avatar Dimensions */}
      <TitledSurface title="Dimensioni Avatar" variant="primary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Tutte le Dimensioni Disponibili
            </ThemedText>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <Avatar initials="XS" size="xs" variant="primary" />
                <ThemedText variant="secondary" className="text-xs mt-2" block>
                  XS (24px)
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="SM" size="sm" variant="secondary" />
                <ThemedText variant="secondary" className="text-xs mt-2" block>
                  SM (32px)
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="MD" size="md" variant="success" />
                <ThemedText variant="secondary" className="text-xs mt-2" block>
                  MD (40px)
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="LG" size="lg" variant="warning" />
                <ThemedText variant="secondary" className="text-xs mt-2" block>
                  LG (48px)
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="XL" size="xl" variant="danger" />
                <ThemedText variant="secondary" className="text-xs mt-2" block>
                  XL (64px)
                </ThemedText>
              </div>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Con Status Indicators
            </ThemedText>
            <div className="flex items-center gap-6">
              <Avatar initials="ON" size="lg" variant="success" status="online" />
              <Avatar initials="BU" size="lg" variant="danger" status="busy" />
              <Avatar initials="AW" size="lg" variant="warning" status="away" />
              <Avatar initials="OF" size="lg" variant="secondary" status="offline" />
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Avatar Shapes */}
      <TitledSurface title="Forme Avatar" variant="secondary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Forme Disponibili
            </ThemedText>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <Avatar initials="CI" shape="circle" variant="primary" size="lg" />
                <ThemedText variant="secondary" className="text-sm mt-2" block>
                  Circle
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="SQ" shape="square" variant="secondary" size="lg" />
                <ThemedText variant="secondary" className="text-sm mt-2" block>
                  Square
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="RO" shape="rounded" variant="info" size="lg" />
                <ThemedText variant="secondary" className="text-sm mt-2" block>
                  Rounded
                </ThemedText>
              </div>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Con Bordi e Status
            </ThemedText>
            <div className="flex items-center gap-6">
              <Avatar
                initials="B1"
                shape="circle"
                variant="primary"
                size="lg"
                bordered
                status="online"
                statusPosition="bottom-right"
              />
              <Avatar
                initials="B2"
                shape="square"
                variant="warning"
                size="lg"
                bordered
                status="busy"
                statusPosition="top-right"
              />
              <Avatar
                initials="B3"
                shape="rounded"
                variant="success"
                size="lg"
                bordered
                status="away"
                statusPosition="bottom-left"
              />
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Avatar Variants */}
      <TitledSurface title="Varianti Colore" variant="modal" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Varianti Semantiche
            </ThemedText>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div className="text-center">
                <Avatar initials="PR" variant="primary" size="md" />
                <ThemedText variant="secondary" className="text-xs mt-2" block>
                  Primary
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="SC" variant="secondary" size="md" />
                <ThemedText variant="secondary" className="text-xs mt-2" block>
                  Secondary
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="SU" variant="success" size="md" />
                <ThemedText variant="secondary" className="text-xs mt-2" block>
                  Success
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="WA" variant="warning" size="md" />
                <ThemedText variant="secondary" className="text-xs mt-2" block>
                  Warning
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="DA" variant="danger" size="md" />
                <ThemedText variant="secondary" className="text-xs mt-2" block>
                  Danger
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="IN" variant="info" size="md" />
                <ThemedText variant="secondary" className="text-xs mt-2" block>
                  Info
                </ThemedText>
              </div>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Con Fallback Personalizzati
            </ThemedText>
            <div className="flex items-center gap-4">
              <Avatar
                fallback={<Settings className="w-5 h-5" />}
                variant="secondary"
                size="md"
                shape="rounded"
                title="Settings"
              />
              <Avatar fallback={<Shield className="w-5 h-5" />} variant="success" size="md" title="Security" />
              <Avatar fallback={<Star className="w-5 h-5" />} variant="warning" size="md" title="Favorite" />
              <Avatar fallback={<Crown className="w-5 h-5" />} variant="primary" size="md" title="Admin" />
              <Avatar fallback={<Music className="w-5 h-5" />} variant="info" size="md" title="Music" />
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Status Indicators */}
      <TitledSurface title="Status Indicators" variant="info" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Posizioni Status
            </ThemedText>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <Avatar initials="TR" variant="primary" size="lg" status="online" statusPosition="top-right" />
                <ThemedText variant="secondary" className="text-sm mt-2" block>
                  Top Right
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="BR" variant="secondary" size="lg" status="busy" statusPosition="bottom-right" />
                <ThemedText variant="secondary" className="text-sm mt-2" block>
                  Bottom Right
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="TL" variant="success" size="lg" status="away" statusPosition="top-left" />
                <ThemedText variant="secondary" className="text-sm mt-2" block>
                  Top Left
                </ThemedText>
              </div>
              <div className="text-center">
                <Avatar initials="BL" variant="warning" size="lg" status="offline" statusPosition="bottom-left" />
                <ThemedText variant="secondary" className="text-sm mt-2" block>
                  Bottom Left
                </ThemedText>
              </div>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Status Semantici
            </ThemedText>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <Avatar initials="ON" variant="success" size="lg" status="online" />
                <Badge variant="success" size="xs" className="mt-2">
                  Online
                </Badge>
              </div>
              <div className="text-center">
                <Avatar initials="BU" variant="danger" size="lg" status="busy" />
                <Badge variant="danger" size="xs" className="mt-2">
                  Busy
                </Badge>
              </div>
              <div className="text-center">
                <Avatar initials="AW" variant="warning" size="lg" status="away" />
                <Badge variant="warning" size="xs" className="mt-2">
                  Away
                </Badge>
              </div>
              <div className="text-center">
                <Avatar initials="OF" variant="secondary" size="lg" status="offline" />
                <Badge variant="default" size="xs" className="mt-2">
                  Offline
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Interactive Avatars */}
      <TitledSurface title="Avatar Interattivi" variant="secondary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Avatar Cliccabili
            </ThemedText>
            <div className="flex items-center gap-4 mb-4">
              <Avatar
                initials="CL"
                variant="primary"
                size="lg"
                clickable
                onClick={() => handleAvatarClick("click1", "Clickable Avatar")}
                title="Click me!"
              />
              <Avatar
                fallback={<User className="w-5 h-5" />}
                variant="secondary"
                size="lg"
                clickable
                onClick={() => handleAvatarClick("click2", "User Profile")}
                title="Open profile"
              />
              <Avatar
                initials="SE"
                variant="success"
                size="lg"
                clickable
                bordered
                status="online"
                onClick={() => handleAvatarClick("click3", "Settings Menu")}
                title="Settings"
              />
            </div>

            {/* Interactive Feedback */}
            <div className="p-4 bg-bg-info rounded-lg">
              <ThemedText variant="primary" className="font-medium mb-1" block>
                Interazioni: {clickCount} click totali
              </ThemedText>
              {selectedUser && (
                <ThemedText variant="secondary" className="text-sm">
                  Ultimo click: {selectedUser}
                </ThemedText>
              )}
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Avatar con Azioni Preferiti
            </ThemedText>
            <div className="flex items-center gap-4">
              {["F1", "F2", "F3", "F4"].map((id, index) => (
                <div key={id} className="relative">
                  <Avatar
                    initials={id}
                    variant={["primary", "secondary", "success", "info"][index] as any}
                    size="lg"
                    clickable
                    onClick={() => toggleFavorite(id)}
                    className={favoriteAvatars.has(id) ? "ring-2 ring-violet-500 ring-offset-2" : ""}
                  />
                  {favoriteAvatars.has(id) && (
                    <div className="absolute -top-1 -right-1">
                      <Heart className="w-4 h-4 text-red-500 fill-current" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <ThemedText variant="secondary" className="text-sm mt-2">
              Click per aggiungere/rimuovere dai preferiti
            </ThemedText>
          </div>
        </div>
      </TitledSurface>

      {/* Avatar Groups */}
      <TitledSurface title="Avatar Groups" variant="modal" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Team Avatar Sovrapposti
            </ThemedText>
            <div className="flex -space-x-2 mb-3">
              {teamMembers.slice(0, 4).map((member, index) => (
                <Avatar
                  key={member.id}
                  src={member.avatar}
                  alt={member.name}
                  initials={member.initials}
                  size="md"
                  bordered
                  className={`z-${40 - index * 10}`}
                  title={member.name}
                />
              ))}
              <Avatar
                initials="+8"
                variant="secondary"
                size="md"
                bordered
                clickable
                onClick={() => alert("Mostra tutti i membri del team")}
                title="Mostra tutti"
                className="z-10"
              />
            </div>
            <ThemedText variant="secondary" className="text-sm">
              Team di 12 persone - Click su +8 per vedere tutti
            </ThemedText>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Avatar Group con Varianti
            </ThemedText>
            <div className="flex -space-x-3">
              <Avatar initials="AD" variant="primary" size="lg" bordered className="z-40" />
              <Avatar initials="DV" variant="success" size="lg" bordered className="z-30" />
              <Avatar initials="MG" variant="warning" size="lg" bordered className="z-20" />
              <Avatar initials="TE" variant="danger" size="lg" bordered className="z-10" />
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Avatar Stack Verticale
            </ThemedText>
            <div className="flex flex-col -space-y-2 w-fit">
              <Avatar initials="V1" variant="primary" size="sm" bordered />
              <Avatar initials="V2" variant="secondary" size="sm" bordered />
              <Avatar initials="V3" variant="success" size="sm" bordered />
              <Avatar initials="V4" variant="info" size="sm" bordered />
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* User List Example */}
      <TitledSurface title="Lista Utenti Realistica" variant="info" padding="lg">
        <div className="space-y-4">
          <ThemedText variant="label" className="font-medium mb-3" block>
            Team Members Dashboard
          </ThemedText>

          <div className="space-y-3">
            {mockUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
                onClick={() => handleAvatarClick(user.id, user.name)}
              >
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  initials={user.initials}
                  status={user.status as any}
                  size="md"
                  variant={getStatusVariant(user.status) as any}
                  clickable
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ThemedText variant="primary" className="font-medium">
                      {user.name}
                    </ThemedText>
                    <Badge variant={getStatusVariant(user.status) as any} size="xs">
                      {user.status}
                    </Badge>
                  </div>
                  <ThemedText variant="secondary" className="text-sm">
                    {user.role}
                  </ThemedText>
                </div>
                <div className="flex items-center gap-2">
                  {favoriteAvatars.has(user.id) && <Heart className="w-4 h-4 text-red-500 fill-current" />}
                  <Edit3 className="w-4 h-4 text-text-secondary hover:text-text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-bg-secondary rounded-lg">
            <ThemedText variant="primary" className="font-medium mb-2" block>
              Stats Dashboard
            </ThemedText>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <ThemedText variant="primary" className="text-2xl font-bold" block>
                  {mockUsers.filter((u) => u.status === "online").length}
                </ThemedText>
                <ThemedText variant="secondary" className="text-sm">
                  Online
                </ThemedText>
              </div>
              <div>
                <ThemedText variant="primary" className="text-2xl font-bold" block>
                  {mockUsers.filter((u) => u.status === "busy").length}
                </ThemedText>
                <ThemedText variant="secondary" className="text-sm">
                  Busy
                </ThemedText>
              </div>
              <div>
                <ThemedText variant="primary" className="text-2xl font-bold" block>
                  {mockUsers.filter((u) => u.status === "away").length}
                </ThemedText>
                <ThemedText variant="secondary" className="text-sm">
                  Away
                </ThemedText>
              </div>
              <div>
                <ThemedText variant="primary" className="text-2xl font-bold" block>
                  {mockUsers.filter((u) => u.status === "offline").length}
                </ThemedText>
                <ThemedText variant="secondary" className="text-sm">
                  Offline
                </ThemedText>
              </div>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Advanced Use Cases */}
      <TitledSurface title="Casi d'Uso Avanzati" variant="secondary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Avatar con Loading State
            </ThemedText>
            <div className="flex items-center gap-4">
              <Avatar src="/very-slow-loading-image.jpg" alt="Loading Avatar" initials="LD" size="lg" variant="primary" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
                <ThemedText variant="secondary" className="text-sm">
                  Loading simulation
                </ThemedText>
              </div>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Avatar Tematici
            </ThemedText>
            <div className="flex items-center gap-4">
              <Avatar fallback={<Coffee className="w-5 h-5" />} variant="warning" size="md" title="Coffee Break" clickable />
              <Avatar fallback={<Gamepad2 className="w-5 h-5" />} variant="info" size="md" title="Gaming Mode" clickable />
              <Avatar fallback={<Zap className="w-5 h-5" />} variant="primary" size="md" title="High Energy" clickable />
              <Avatar fallback={<Camera className="w-5 h-5" />} variant="secondary" size="md" title="Photography" clickable />
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Avatar Responsive (Mobile vs Desktop)
            </ThemedText>
            <div className="space-y-4">
              {/* Mobile Layout */}
              <div className="block md:hidden">
                <ThemedText variant="secondary" className="text-sm mb-2" block>
                  Layout Mobile (dimensioni più piccole)
                </ThemedText>
                <div className="flex items-center gap-2">
                  <Avatar initials="MB" size="sm" variant="primary" status="online" />
                  <Avatar initials="MB" size="sm" variant="secondary" status="busy" />
                  <Avatar initials="MB" size="sm" variant="success" status="away" />
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block">
                <ThemedText variant="secondary" className="text-sm mb-2" block>
                  Layout Desktop (dimensioni più grandi)
                </ThemedText>
                <div className="flex items-center gap-4">
                  <Avatar initials="DT" size="lg" variant="primary" status="online" bordered />
                  <Avatar initials="DT" size="lg" variant="secondary" status="busy" bordered />
                  <Avatar initials="DT" size="lg" variant="success" status="away" bordered />
                </div>
              </div>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Avatar con Accessibility Features
            </ThemedText>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Avatar
                  initials="AC"
                  variant="primary"
                  size="md"
                  clickable
                  onClick={() => alert("Avatar accessibile cliccato!")}
                  aria-label="Avatar accessibile con supporto screen reader"
                  title="Premi Invio o Spazio per interagire"
                />
                <ThemedText variant="secondary" className="text-sm">
                  Avatar con ARIA labels e keyboard navigation
                </ThemedText>
              </div>

              <div className="flex items-center gap-4">
                <Avatar
                  initials="HC"
                  variant="success"
                  size="md"
                  status="online"
                  aria-label="Utente ad alto contrasto online"
                  className="ring-2 ring-black dark:ring-white"
                />
                <ThemedText variant="secondary" className="text-sm">
                  Avatar ad alto contrasto per accessibility
                </ThemedText>
              </div>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Summary Stats */}
      <TitledSurface title="Statistiche Showcase" variant="primary" padding="lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <ThemedText variant="primary" className="text-3xl font-bold" block>
              5
            </ThemedText>
            <ThemedText variant="secondary" className="text-sm">
              Dimensioni
            </ThemedText>
          </div>
          <div>
            <ThemedText variant="primary" className="text-3xl font-bold" block>
              3
            </ThemedText>
            <ThemedText variant="secondary" className="text-sm">
              Forme
            </ThemedText>
          </div>
          <div>
            <ThemedText variant="primary" className="text-3xl font-bold" block>
              6
            </ThemedText>
            <ThemedText variant="secondary" className="text-sm">
              Varianti
            </ThemedText>
          </div>
          <div>
            <ThemedText variant="primary" className="text-3xl font-bold" block>
              4
            </ThemedText>
            <ThemedText variant="secondary" className="text-sm">
              Status
            </ThemedText>
          </div>
        </div>

        <div className="mt-6 p-4 bg-bg-info rounded-lg">
          <ThemedText variant="primary" className="font-medium mb-2" block>
            💡 Avatar Component Features
          </ThemedText>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Fallback intelligente: Immagine → Iniziali → Icona</li>
            <li>• Status indicators con 4 posizioni configurabili</li>
            <li>• Accessibility completa con ARIA labels e keyboard nav</li>
            <li>• Loading states automatici per immagini</li>
            <li>• Theme integration con varianti semantiche</li>
            <li>• Support per avatar groups e overlapping</li>
          </ul>
        </div>
      </TitledSurface>
    </div>
  );
};

export default AvatarShowcase;
