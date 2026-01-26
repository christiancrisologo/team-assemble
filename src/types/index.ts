export interface Member {
    id: string;
    name: string;
    avatar_url?: string;
    active: boolean;
    created_at: string;
}

export interface Role {
    id: string;
    name: string;
    color: string; // Tailwind color class or hex
    description?: string;
    icon?: string; // Lucide icon name
}

export type SprintStatus = 'planning' | 'active' | 'completed';

export interface Sprint {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: SprintStatus;
    assignments: Record<string, string>; // RoleID -> MemberID
    created_at: string;
}

export interface AppState {
    members: Member[];
    roles: Role[];
    sprints: Sprint[];
    currentSprintId: string | null;
}
