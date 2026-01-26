import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Member, Role, Sprint } from '../types';

interface SprintStore {
    members: Member[];
    roles: Role[];
    sprints: Sprint[];
    currentSprintId: string | null;

    // Actions
    addMember: (name: string, avatarUrl?: string) => void;
    updateMember: (id: string, updates: Partial<Member>) => void;
    removeMember: (id: string) => void;

    addRole: (role: Role) => void;
    updateRole: (id: string, updates: Partial<Role>) => void;
    removeRole: (id: string) => void;

    addSprints: (sprints: Sprint[]) => void;
    updateSprint: (id: string, updates: Partial<Sprint>) => void;
    startSprint: (sprint: Sprint) => void;
    setCurrentSprint: (id: string) => void;
    setSprints: (sprints: Sprint[]) => void;
}

// Initial default roles
const DEFAULT_ROLES: Role[] = [
    { id: '1', name: 'Facilitator', color: 'bg-blue-500', description: 'Leads the meetings' },
    { id: '2', name: 'Scribe', color: 'bg-green-500', description: 'Takes notes' },
    { id: '3', name: 'Timekeeper', color: 'bg-yellow-500', description: 'Tracks time' },
    { id: '4', name: 'Mood Maker', color: 'bg-pink-500', description: 'Keeps energy high' },
];

export const useSprintStore = create<SprintStore>()(
    persist(
        (set) => ({
            members: [],
            roles: DEFAULT_ROLES,
            sprints: [],
            currentSprintId: null,

            addMember: (name, avatarUrl) => set((state) => ({
                members: [
                    ...state.members,
                    {
                        id: crypto.randomUUID(),
                        name,
                        avatar_url: avatarUrl,
                        active: true,
                        created_at: new Date().toISOString()
                    }
                ]
            })),

            updateMember: (id, updates) => set((state) => ({
                members: state.members.map((m) => m.id === id ? { ...m, ...updates } : m)
            })),

            removeMember: (id) => set((state) => ({
                members: state.members.filter((m) => m.id !== id)
            })),

            addRole: (role) => set((state) => ({
                roles: [...state.roles, role]
            })),

            updateRole: (id, updates) => set((state) => ({
                roles: state.roles.map((r) => r.id === id ? { ...r, ...updates } : r)
            })),

            removeRole: (id) => set((state) => ({
                roles: state.roles.filter((r) => r.id !== id)
            })),

            addSprints: (newSprints) => set((state) => ({
                sprints: [...state.sprints, ...newSprints]
            })),

            updateSprint: (id, updates) => set((state) => ({
                sprints: state.sprints.map((s) => s.id === id ? { ...s, ...updates } : s),
                // Update currentSprintId if status changes to active? logic can be handled in component or specialized action
            })),

            startSprint: (sprint) => set((state) => ({
                sprints: [...state.sprints, sprint],
                currentSprintId: sprint.id
            })),

            setCurrentSprint: (id) => set({ currentSprintId: id }),

            setSprints: (sprints) => set({ sprints }),
        }),
        {
            name: 'sprint-storage',
        }
    )
);
