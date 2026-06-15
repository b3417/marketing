import * as React from "react";
import { useSetAtom } from "jotai";
import { Plus, Users2 } from "lucide-react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  openCreateWorkspaceOpenAtom,
  openInviteWorkspaceOpenAtom,
} from "@/utils/store";
import { workspaceRoleLabel, type WorkspaceSummary } from "@/utils/workspaces";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const userNavigation = [
  { name: "Usage", href: "/usage" },
  {
    name: "Sign out",
    href: "#",
    onClick: () => signOut({ callbackUrl: window.location.origin }),
  },
];

type WorkspaceSidebarProps = {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  isLoading?: boolean;
  onWorkspaceSelect: (workspaceId: string) => Promise<void> | void;
};

function getWorkspaceInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function WorkspaceSidebar({
  workspaces,
  activeWorkspaceId,
  isLoading,
  onWorkspaceSelect,
}: WorkspaceSidebarProps) {
  const { data: session } = useSession();
  const setCreateWorkspaceOpen = useSetAtom(openCreateWorkspaceOpenAtom);
  const setInviteWorkspaceOpen = useSetAtom(openInviteWorkspaceOpenAtom);

  const activeWorkspace = React.useMemo(
    () =>
      workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
      workspaces[0] ??
      null,
    [activeWorkspaceId, workspaces],
  );

  return (
    <div className="left-0 top-0 flex h-screen w-16 flex-col items-center justify-between space-y-2 border-r">
      <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col items-center space-y-3 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-foreground/80 font-cal text-xl font-semibold text-white"
                variant="ghost"
                disabled={isLoading || !workspaces.length}
              >
                {activeWorkspace?.image ? (
                  <Image
                    src={activeWorkspace.image}
                    fill={true}
                    alt={activeWorkspace.name}
                    className="rounded-xl object-cover"
                  />
                ) : activeWorkspace ? (
                  <span className="text-sm font-semibold uppercase tracking-wide text-white">
                    {getWorkspaceInitials(activeWorkspace.name) || "WS"}
                  </span>
                ) : (
                  <span className="text-xs text-white/70">WS</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuRadioGroup
                value={activeWorkspace?.id ?? ""}
                onValueChange={(workspaceId) => {
                  void onWorkspaceSelect(workspaceId);
                }}
              >
                {workspaces.map((workspace) => (
                  <DropdownMenuRadioItem
                    key={workspace.id}
                    value={workspace.id}
                    className="flex items-start gap-3 py-2"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">
                        {workspace.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {workspaceRoleLabel(workspace.role)}
                        {workspace.isPending ? " · Pending invite" : ""}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {workspace.memberCount} members
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setInviteWorkspaceOpen(true)}
                disabled={!activeWorkspace}
              >
                <Users2 className="mr-2 h-4 w-4" />
                Invite member
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreateWorkspaceOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  setInviteWorkspaceOpen(true);
                }}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground/80 font-cal text-xl font-semibold text-white"
                variant="ghost"
                disabled={!activeWorkspace}
              >
                <Users2 className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Invite member</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  setCreateWorkspaceOpen(true);
                }}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground font-cal text-xl font-semibold"
              >
                <Plus className="h-8 w-8 text-background" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Create workspace</TooltipContent>
          </Tooltip>
        </div>

        {session?.user && (
          <div className="flex w-full flex-col items-center pb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src={session.user.image || undefined} />
                  <AvatarFallback>
                    {session.user.name ? session.user.name[0] : ""}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
                {userNavigation.map((item) => (
                  <DropdownMenuItem key={item.name}>
                    <a href={item.href} onClick={item.onClick}>
                      {item.name}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
