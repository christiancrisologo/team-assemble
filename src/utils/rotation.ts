import type { Member, Role } from '../types';

export type RotationStrategy = 'manual' | 'sequential' | 'random';

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Rotate roles sequentially.
 * Moves the assignments: Role A used to be Member 1 -> now Member 2 (if Member 2 was Role B or next in line).
 * Actually, usually "Sequential" means rotating the members list against the fixed roles list.
 * 
 * Logic:
 * 1. Get list of active members.
 * 2. Get list of roles.
 * 3. Shift member list by 1 (or by Sprint Index).
 * 4. Assign members to roles.
 */
export function rotateSequential(
    members: Member[],
    roles: Role[],
    previousAssignments: Record<string, string> // RoleID -> MemberID
): Record<string, string> {
    const activeMembers = members.filter(m => m.active);
    if (activeMembers.length === 0 || roles.length === 0) return {};

    // Find the index shift based on previous assignments effectively?
    // Or just simply shift the array of active members.
    // To keep it consistent, we sort members by ID or Name to have a stable order, 
    // then rotate that list based on the "previous head".

    // Strategy: 
    // 1. Sort active members to ensure stable order.
    // 2. Identify who had the first role last time.
    // 3. Find that member's index in the sorted list.
    // 4. Shift logic: new head = (old_index + 1) % distinct_count

    const sortedMembers = [...activeMembers].sort((a, b) => a.name.localeCompare(b.name));

    // Find who had the first role (role[0])
    const firstRoleId = roles[0].id;
    const lastMemberIdForFirstRole = previousAssignments[firstRoleId];

    let shiftIndex = 0;
    if (lastMemberIdForFirstRole) {
        const lastIndex = sortedMembers.findIndex(m => m.id === lastMemberIdForFirstRole);
        if (lastIndex !== -1) {
            shiftIndex = (lastIndex + 1) % sortedMembers.length;
        }
    }

    // Rotate the members array
    const rotatedMembers = [
        ...sortedMembers.slice(shiftIndex),
        ...sortedMembers.slice(0, shiftIndex)
    ];

    // Assign to roles
    const assignments: Record<string, string> = {};
    roles.forEach((role, index) => {
        // If we have fewer members than roles, loop back? Or leave empty?
        // Usually valid to loop back if small team, or leave empty if "optional".
        // Assuming necessary roles -> loop back modulo.
        if (rotatedMembers.length > 0) {
            const member = rotatedMembers[index % rotatedMembers.length];
            assignments[role.id] = member.id;
        }
    });

    return assignments;
}

/**
 * Random rotation with constraints.
 * Tries to avoid assigning the same role to the same member as last time.
 */
export function rotateRandom(
    members: Member[],
    roles: Role[],
    previousAssignments: Record<string, string>
): Record<string, string> {
    const activeMembers = members.filter(m => m.active);
    if (activeMembers.length === 0) return {};

    let attempts = 0;
    const maxAttempts = 10;
    let bestAssignments: Record<string, string> = {};
    let minConflicts = Infinity;

    while (attempts < maxAttempts) {
        const shuffledMembers = shuffle(activeMembers);
        const currentAssignments: Record<string, string> = {};
        let conflicts = 0;

        roles.forEach((role, index) => {
            const member = shuffledMembers[index % shuffledMembers.length];
            currentAssignments[role.id] = member.id;

            // Check conflict
            if (previousAssignments[role.id] === member.id) {
                conflicts++;
            }
        });

        if (conflicts === 0) {
            return currentAssignments; // Perfect solution
        }

        if (conflicts < minConflicts) {
            minConflicts = conflicts;
            bestAssignments = currentAssignments;
        }

        attempts++;
    }

    return bestAssignments;
}
