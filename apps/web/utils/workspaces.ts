export const ACTIVE_WORKSPACE_COOKIE = "caley-active-workspace";

export type WorkspaceRole = "OWNER" | "ADMIN" | "USER";

export type WorkspaceSummary = {
  id: string;
  name: string;
  image: string | null;
  role: WorkspaceRole;
  memberCount: number;
  invitedEmail: string | null;
  invitedName: string | null;
  isPending: boolean;
};

export type WorkspaceListResponse = {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
};

export function workspaceRoleLabel(role: WorkspaceRole) {
  switch (role) {
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    case "USER":
      return "Member";
  }
}
