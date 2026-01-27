import { create } from 'zustand';
import type { Member, Role, Sprint } from '../types';
import { supabase } from '../lib/supabase';

interface SprintStore {
    members: Member[];
    roles: Role[];
    sprints: Sprint[];
    currentSprintId: string | null;
    isLoading: boolean;
    isOffline: boolean;
    isUsingSampleData: boolean;

    // Actions
    fetchInitialData: () => Promise<void>;
    addMember: (name: string, avatarUrl?: string) => Promise<void>;
    updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
    removeMember: (id: string) => Promise<void>;

    addRole: (role: Role) => Promise<void>;
    updateRole: (id: string, updates: Partial<Role>) => Promise<void>;
    removeRole: (id: string) => Promise<void>;

    addSprints: (sprints: Sprint[]) => Promise<void>;
    updateSprint: (id: string, updates: Partial<Sprint>) => Promise<void>;
    startSprint: (sprint: Sprint) => Promise<void>;
    setCurrentSprint: (id: string) => void;
    setSprints: (sprints: Sprint[]) => Promise<void>;
}

const SAMPLE_DATA = {
    roles: [
        { id: '1', name: 'Facilitator', color: 'bg-blue-500', description: 'Leads the meetings', icon: 'Shield' },
        { id: '2', name: 'Scribe', color: 'bg-green-500', description: 'Takes notes', icon: 'PenTool' },
        { id: '3', name: 'Timekeeper', color: 'bg-yellow-500', description: 'Tracks time', icon: 'Clock' },
        { id: '4', name: 'Mood Maker', color: 'bg-pink-500', description: 'Keeps energy high', icon: 'Smile' },
    ],
    members: [
        { id: 'm1', name: 'Test User 1', active: true, created_at: new Date().toISOString() },
        { id: 'm2', name: 'Test User 2', active: true, created_at: new Date().toISOString() },
    ]
};

const STORAGE_KEY = 'lrn_sprint_offline_data';

export const useSprintStore = create<SprintStore>((set, get) => ({
    members: [],
    roles: [],
    sprints: [],
    currentSprintId: null,
    isLoading: false,
    isOffline: !navigator.onLine,
    isUsingSampleData: false,

    fetchInitialData: async () => {
        set({ isLoading: true, isOffline: !navigator.onLine });

        // Try Supabase first if online
        if (navigator.onLine) {
            try {
                // Forced 2 second delay as requested by user
                const delayPromise = new Promise(resolve => setTimeout(resolve, 2000));

                const [fetchResults] = await Promise.all([
                    Promise.all([
                        supabase.from('lrn_members').select('*').order('created_at', { ascending: true }),
                        supabase.from('lrn_roles').select('*').order('created_at', { ascending: true }),
                        supabase.from('lrn_sprints').select('*').order('start_date', { ascending: true })
                    ]),
                    delayPromise
                ]);

                const [
                    { data: members, error: mErr },
                    { data: roles, error: rErr },
                    { data: sprints, error: sErr }
                ] = fetchResults;

                if (!mErr && !rErr && !sErr) {
                    const data = {
                        members: members || [],
                        roles: roles || [],
                        sprints: sprints || [],
                        currentSprintId: sprints?.find(s => s.status === 'active')?.id || null
                    };
                    set({ ...data, isLoading: false, isUsingSampleData: false });
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                    return;
                }
            } catch (error) {
                console.warn('Supabase fetch failed, falling back to local storage', error);
            }
        }

        // Offline or Supabase failed
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            set({ ...parsed, isLoading: false, isOffline: true, isUsingSampleData: false });
        } else {
            // No cache? Load Sample
            set({
                members: SAMPLE_DATA.members,
                roles: SAMPLE_DATA.roles,
                sprints: [],
                isLoading: false,
                isOffline: true,
                isUsingSampleData: true
            });
        }
    },

    addMember: async (name, avatarUrl) => {
        const { isOffline, members } = get();
        const newMember = {
            id: crypto.randomUUID(),
            name,
            avatar_url: avatarUrl,
            active: true,
            created_at: new Date().toISOString()
        };

        if (!isOffline) {
            const { error } = await supabase.from('lrn_members').insert([newMember]);
            if (error) console.error('Error adding member:', error);
        }

        const updatedMembers = [...members, newMember];
        set({ members: updatedMembers });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), members: updatedMembers }));
    },

    updateMember: async (id, updates) => {
        const { isOffline, members } = get();
        if (!isOffline) {
            const { error } = await supabase.from('lrn_members').update(updates).eq('id', id);
            if (error) console.error('Error updating member:', error);
        }

        const updatedMembers = members.map((m) => m.id === id ? { ...m, ...updates } : m);
        set({ members: updatedMembers });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), members: updatedMembers }));
    },

    removeMember: async (id) => {
        const { isOffline, members } = get();
        if (!isOffline) {
            const { error } = await supabase.from('lrn_members').delete().eq('id', id);
            if (error) console.error('Error removing member:', error);
        }

        const updatedMembers = members.filter((m) => m.id !== id);
        set({ members: updatedMembers });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), members: updatedMembers }));
    },

    addRole: async (role) => {
        const { isOffline, roles } = get();
        if (!isOffline) {
            const { error } = await supabase.from('lrn_roles').insert([role]);
            if (error) console.error('Error adding role:', error);
        }

        const updatedRoles = [...roles, role];
        set({ roles: updatedRoles });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), roles: updatedRoles }));
    },

    updateRole: async (id, updates) => {
        const { isOffline, roles } = get();
        if (!isOffline) {
            const { error } = await supabase.from('lrn_roles').update(updates).eq('id', id);
            if (error) console.error('Error updating role:', error);
        }

        const updatedRoles = roles.map((r) => r.id === id ? { ...r, ...updates } : r);
        set({ roles: updatedRoles });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), roles: updatedRoles }));
    },

    removeRole: async (id) => {
        const { isOffline, roles } = get();
        if (!isOffline) {
            const { error } = await supabase.from('lrn_roles').delete().eq('id', id);
            if (error) console.error('Error removing role:', error);
        }

        const updatedRoles = roles.filter((r) => r.id !== id);
        set({ roles: updatedRoles });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), roles: updatedRoles }));
    },

    addSprints: async (newSprints) => {
        const { isOffline, sprints } = get();
        if (!isOffline) {
            const { error } = await supabase.from('lrn_sprints').insert(newSprints);
            if (error) console.error('Error adding sprints:', error);
        }

        const updatedSprints = [...sprints, ...newSprints];
        set({ sprints: updatedSprints });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), sprints: updatedSprints }));
    },

    updateSprint: async (id, updates) => {
        const { isOffline, sprints } = get();
        if (!isOffline) {
            const { error } = await supabase.from('lrn_sprints').update(updates).eq('id', id);
            if (error) console.error('Error updating sprint:', error);
        }

        const updatedSprints = sprints.map((s) => s.id === id ? { ...s, ...updates } : s);
        set({ sprints: updatedSprints });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), sprints: updatedSprints }));
    },

    startSprint: async (sprint) => {
        const { isOffline, sprints } = get();
        if (!isOffline) {
            const { error } = await supabase.from('lrn_sprints').insert([sprint]);
            if (error) console.error('Error starting sprint:', error);
        }

        const updatedSprints = [...sprints, sprint];
        set({ sprints: updatedSprints, currentSprintId: sprint.id });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), sprints: updatedSprints, currentSprintId: sprint.id }));
    },

    setCurrentSprint: (id) => {
        set({ currentSprintId: id });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), currentSprintId: id }));
    },

    setSprints: async (sprints) => {
        const { isOffline } = get();
        if (!isOffline) {
            const { error } = await supabase.from('lrn_sprints').upsert(sprints);
            if (error) console.error('Error setting sprints:', error);
        }

        set({ sprints });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), sprints }));
    },
}));

// Listen for network changes
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => useSprintStore.setState({ isOffline: false }));
    window.addEventListener('offline', () => useSprintStore.setState({ isOffline: true }));
}

