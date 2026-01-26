import { useState } from 'react';
import { useSprintStore } from '../store/useSprintStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { addDays, format, parseISO } from 'date-fns';
import { Save, Calendar, Pencil, Trash2 } from 'lucide-react';
import { rotateSequential, rotateRandom } from '../utils/rotation';
import type { Sprint } from '../types';

export default function SprintPlanner() {
    const { members, roles, sprints, addSprints, updateSprint, setSprints } = useSprintStore();
    const [step, setStep] = useState(0); // 0 = List View, 1 = Config, 2 = Strategy, 3 = Review
    const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);

    const saveEdit = () => {
        if (editingSprint) {
            updateSprint(editingSprint.id, editingSprint);
            setEditingSprint(null);
        }
    };

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure you want to delete this sprint? Subsequent sprints will be adjusted.")) return;

        // 1. Sort current sprints to ensure order
        const sorted = [...sprints].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

        // 2. Find index of deleted sprint
        const index = sorted.findIndex(s => s.id === id);
        if (index === -1) return;

        const deletedSprint = sorted[index];
        const deletedStart = new Date(deletedSprint.start_date);

        // 3. Remove the target sprint
        sorted.splice(index, 1);

        // 4. Ripple update
        for (let i = index; i < sorted.length; i++) {
            const current = sorted[i];

            // Calculate duration of current sprint
            const dStart = new Date(current.start_date);
            const dEnd = new Date(current.end_date);
            const durationMs = dEnd.getTime() - dStart.getTime();

            let newStart: Date;
            if (i === 0) {
                // If it's now the first, move it to the deleted spot to fill gap
                newStart = deletedStart;
            } else {
                const prev = sorted[i - 1];
                newStart = addDays(new Date(prev.end_date), 1); // Start day after previous ends
            }

            const newEnd = new Date(newStart.getTime() + durationMs);
            current.start_date = newStart.toISOString();
            current.end_date = newEnd.toISOString();

            // Adjust Roles (Sequential Ripple)
            const prevSprint = i > 0 ? sorted[i - 1] : null;

            if (prevSprint) {
                current.assignments = rotateSequential(members, roles, prevSprint.assignments);
            }
            // If i=0, we leave assignments as is, as there's no previous sprint in the *current* sorted list to base rotation on.
            // A more advanced solution might look at the last *completed* sprint from history.
        }

        setSprints(sorted);
    };

    // Step 1: Config
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [sprintCount, setSprintCount] = useState(5);
    const [durationWeeks, setDurationWeeks] = useState(2.5); // 2.5 weeks typical

    // Step 2: Strategy
    const [strategy, setStrategy] = useState<'sequential' | 'random'>('sequential');

    // Step 3: Draft
    const [draftSprints, setDraftSprints] = useState<Sprint[]>([]);

    const generateDrafts = () => {
        let currentStart = new Date(startDate);
        const newSprints: Sprint[] = [];
        const durationDays = Math.round(durationWeeks * 7);

        // For simulation, we need a baseline of assignments.
        // Use the last real sprint, or empty if none.
        let lastAssignments = sprints.length > 0 ? sprints[sprints.length - 1].assignments : {};

        for (let i = 0; i < sprintCount; i++) {
            const startStr = currentStart.toISOString();
            const end = addDays(currentStart, durationDays);
            const endStr = end.toISOString();

            let assignments = {};
            if (strategy === 'sequential') {
                assignments = rotateSequential(members, roles, lastAssignments);
            } else {
                assignments = rotateRandom(members, roles, lastAssignments);
            }

            newSprints.push({
                id: crypto.randomUUID(),
                name: `Sprint ${sprints.length + newSprints.length + 1}`,
                start_date: startStr,
                end_date: endStr,
                status: 'planning',
                assignments: assignments,
                created_at: new Date().toISOString()
            });

            // Update "lastAssignments" for next iteration
            lastAssignments = assignments;

            // Advance date
            currentStart = addDays(end, 1);
            currentStart = end;
        }

        setDraftSprints(newSprints);
        setStep(3);
    };

    const saveDrafts = () => {
        addSprints(draftSprints);
        setStep(0); // Go back to list
        setDraftSprints([]);
    };

    // Sort sprints: By date only
    const sortedSprints = [...sprints].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Sprint Planner</h2>
                    <p className="text-muted-foreground">Bulk create and schedule your upcoming sprints.</p>
                </div>
                {step === 0 && (
                    <Button onClick={() => setStep(1)}>
                        <Calendar className="mr-2 h-4 w-4" /> Plan New Sprints
                    </Button>
                )}
            </div>

            {step === 0 && (
                <div className="space-y-4">
                    {/* Editor Modal / Overlay */}
                    {editingSprint && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl bg-white text-black border-2">
                                <CardHeader>
                                    <CardTitle>Edit Sprint</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Sprint Name</label>
                                        <Input
                                            value={editingSprint.name}
                                            onChange={(e) => setEditingSprint({ ...editingSprint, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Start Date</label>
                                            <Input
                                                type="date"
                                                value={editingSprint.start_date.split('T')[0]}
                                                onChange={(e) => setEditingSprint({ ...editingSprint, start_date: new Date(e.target.value).toISOString() })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">End Date</label>
                                            <Input
                                                type="date"
                                                value={editingSprint.end_date.split('T')[0]}
                                                onChange={(e) => setEditingSprint({ ...editingSprint, end_date: new Date(e.target.value).toISOString() })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="font-medium">Assignments</h4>
                                        {roles.map(role => (
                                            <div key={role.id} className="flex items-center justify-between p-2 border rounded bg-accent/5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${role.color.includes('bg-') ? role.color : 'bg-gray-500'}`} />
                                                    <span className="text-sm font-medium">{role.name}</span>
                                                </div>
                                                <select
                                                    className="p-1 rounded border bg-background text-sm w-40"
                                                    value={editingSprint.assignments[role.id] || ''}
                                                    onChange={(e) => {
                                                        const newAssignments = { ...editingSprint.assignments, [role.id]: e.target.value };
                                                        setEditingSprint({ ...editingSprint, assignments: newAssignments });
                                                    }}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {members.map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button variant="outline" onClick={() => setEditingSprint(null)}>Cancel</Button>
                                        <Button onClick={saveEdit}>Save Changes</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {sortedSprints.length === 0 ? (
                        <Card className="bg-muted/10 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
                                <div className="p-4 rounded-full bg-background border">
                                    <Calendar className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">No Sprints Planned</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                        Start by creating a plan for your upcoming sprints. You can generate multiple sprints at once.
                                    </p>
                                </div>
                                <Button onClick={() => setStep(1)}>Start Planning</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                            <tr>
                                                <th className="p-4 whitespace-nowrap">Sprint Details</th>
                                                <th className="p-4">Assignments (Role → Member)</th>
                                                <th className="p-4 whitespace-nowrap">Status</th>
                                                <th className="p-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {sortedSprints.map((sprint, idx) => (
                                                <tr key={sprint.id || idx} className={`transition-colors ${sprint.status === 'active' ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-muted/5'}`}>
                                                    <td className="p-4 align-top">
                                                        <div className="font-bold text-base flex items-center gap-2">
                                                            {sprint.name}
                                                            {sprint.status === 'active' && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">CURRENT</span>}
                                                        </div>
                                                        <div className="text-muted-foreground text-xs mt-1">
                                                            {format(parseISO(sprint.start_date), 'MMM d, yyyy')} - {format(parseISO(sprint.end_date), 'MMM d, yyyy')}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-top">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                                                            {roles.map(role => {
                                                                const memberId = sprint.assignments[role.id];
                                                                const member = members.find(m => m.id === memberId);
                                                                return (
                                                                    <div key={role.id} className="flex items-center gap-2 py-0.5">
                                                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${role.color.includes('bg-') ? role.color : 'bg-gray-500'}`} />
                                                                        <span className="text-muted-foreground text-xs font-medium w-20 truncate">{role.name}:</span>
                                                                        <span className="font-medium truncate">{member?.name || '-'}</span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-top">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold inline-block tracking-wide ${sprint.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
                                                            {(sprint.status || 'completed').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-top text-right space-x-1">
                                                        <Button size="sm" variant="ghost" onClick={() => setEditingSprint(sprint)} title="Edit Sprint">
                                                            <Pencil className="h-4 w-4" />
                                                            <span className="sr-only">Edit</span>
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(sprint.id)} title="Delete Sprint">
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Delete</span>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {step === 1 && (
                <Card>
                    <CardHeader><CardTitle>1. Timeline Configuration</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <label>Start Date of First Sprint</label>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <label>Number of Sprints to Plan</label>
                            <Input type="number" value={sprintCount} onChange={e => setSprintCount(parseInt(e.target.value))} min={1} max={50} />
                        </div>
                        <div className="grid gap-2">
                            <label>Duration (Weeks)</label>
                            <Input type="number" value={durationWeeks} onChange={e => setDurationWeeks(parseFloat(e.target.value))} step={0.5} />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setStep(0)}>Cancel</Button>
                            <Button onClick={() => setStep(2)} className="w-full">Next: Strategy</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <CardHeader><CardTitle>2. Rotation Strategy</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => setStrategy('sequential')}
                                className={`p-4 border rounded cursor-pointer hover:bg-accent ${strategy === 'sequential' ? 'border-primary bg-primary/10' : ''}`}
                            >
                                <h4 className="font-bold">Sequential 🔄</h4>
                                <p className="text-sm">Rotate roles in a fixed order (A&rarr;B&rarr;C).</p>
                            </div>
                            <div
                                onClick={() => setStrategy('random')}
                                className={`p-4 border rounded cursor-pointer hover:bg-accent ${strategy === 'random' ? 'border-primary bg-primary/10' : ''}`}
                            >
                                <h4 className="font-bold">Random 🎲</h4>
                                <p className="text-sm">Shuffle roles with conflict avoidance.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={generateDrafts} className="w-full">Generate Preview</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 3 && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">3. Review Plan</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                            <Button onClick={saveDrafts}><Save className="mr-2 h-4 w-4" /> Confirm & Save</Button>
                        </div>
                    </div>
                    <div className="grid gap-4">
                        {draftSprints.map((sprint, idx) => (
                            <Card key={idx}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-muted-foreground flex justify-between">
                                        <span>{format(parseISO(sprint.start_date), 'MMM d')} - {format(parseISO(sprint.end_date), 'MMM d')}</span>
                                        <span>{sprint.name}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                        {roles.map(role => {
                                            const memberId = sprint.assignments[role.id];
                                            const member = members.find(m => m.id === memberId);
                                            return (
                                                <div key={role.id} className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${role.color.includes('bg-') ? role.color : 'bg-gray-500'}`}></div>
                                                    <span className="font-medium">{role.name}:</span>
                                                    <span>{member?.name || '-'}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
