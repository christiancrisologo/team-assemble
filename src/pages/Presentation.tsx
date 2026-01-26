import { useState, useEffect, useCallback, useRef } from 'react';
import { useSprintStore } from '../store/useSprintStore';
import { useUIStore } from '../store/useUIStore'; // Added
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { rotateSequential, rotateRandom } from '../utils/rotation';
import { DynamicIcon } from '../components/ui/IconPicker';

export default function Presentation() {
    const { members, roles, sprints, startSprint } = useSprintStore();
    const { setSidebarCollapsed } = useUIStore(); // Added
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const replayId = searchParams.get('replay');

    // Sidebar collapse effect
    useEffect(() => {
        setSidebarCollapsed(true);
        return () => setSidebarCollapsed(false);
    }, [setSidebarCollapsed]);

    // Initial state based on replay
    // If replayId exists, we want to start immediately. However, we need to find the sprint first.
    // We can do this with a useEffect or lazy initialization.
    // Let's use a ref to prevent double-init.
    const hasInitialized = useRef(false);

    const [step, setStep] = useState<'intro' | 'manual_setup' | 'revealing' | 'finished'>('intro');
    const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
    const [newAssignments, setNewAssignments] = useState<Record<string, string>>({});

    // Confetti logic ...
    const fireConfetti = useCallback(() => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#a855f7', '#ec4899']
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#a855f7', '#ec4899']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    }, []);

    const nextReveal = useCallback(() => {
        if (currentRoleIndex < roles.length - 1) {
            setCurrentRoleIndex(prev => prev + 1);
        } else {
            setStep('finished');
            fireConfetti();

            // Only save if NOT replaying
            if (!replayId) {
                const startDate = new Date();
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 17); // Approx 2.5 weeks

                startSprint({
                    id: crypto.randomUUID(),
                    name: `Sprint ${sprints.length + 1}`,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    status: 'active',
                    assignments: newAssignments,
                    created_at: new Date().toISOString()
                });
            }
        }
    }, [currentRoleIndex, roles, fireConfetti, replayId, sprints, startSprint, newAssignments]);

    // Auto-play effect
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (step === 'revealing') {
            timer = setTimeout(() => {
                nextReveal();
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [step, nextReveal]);

    // Calculation/Start logic
    const handleStart = useCallback((strategy: 'random' | 'sequential' | 'manual' | 'replay') => {
        if (strategy === 'manual') {
            setStep('manual_setup');
            return;
        }

        if (strategy === 'replay' && replayId) {
            const sprint = sprints.find(s => s.id === replayId);
            if (sprint) {
                setNewAssignments(sprint.assignments);
                setStep('revealing');
                setCurrentRoleIndex(0);
                return;
            }
        }

        // Standard generation logic
        const lastSprint = sprints[sprints.length - 1];
        const previousAssignments = lastSprint ? lastSprint.assignments : {};

        let assignments: Record<string, string> = {};
        if (strategy === 'sequential') {
            assignments = rotateSequential(members, roles, previousAssignments);
        } else {
            assignments = rotateRandom(members, roles, previousAssignments);
        }

        setNewAssignments(assignments);
        setStep('revealing');
        setCurrentRoleIndex(0);
    }, [members, roles, sprints, replayId]);


    // Auto-start for Replay
    useEffect(() => {
        if (replayId && !hasInitialized.current && sprints.length > 0) {
            hasInitialized.current = true;
            handleStart('replay');
        }
    }, [replayId, sprints, handleStart]);

    const confirmManual = () => {
        setStep('revealing');
        setCurrentRoleIndex(0);
    };

    if (step === 'intro') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-500">
                    {replayId ? 'Replay Sprint Presentation' : 'Ready to Rotate?'}
                </h2>

                {replayId ? (
                    <div className="w-full max-w-md px-4">
                        <Button
                            size="lg"
                            onClick={() => handleStart('replay')}
                            className="h-24 text-lg w-full flex flex-col gap-2"
                        >
                            <span className="text-2xl">▶️</span>
                            Start Presentation
                        </Button>
                        <Button variant="link" onClick={() => navigate('/')} className="mt-4">
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl px-4">
                            <Button
                                size="lg"
                                onClick={() => handleStart('sequential')}
                                className="h-24 text-lg flex flex-col gap-2"
                            >
                                <span className="text-2xl">🔄</span>
                                Sequential
                            </Button>
                            <Button
                                size="lg"
                                variant="secondary"
                                onClick={() => handleStart('random')}
                                className="h-24 text-lg flex flex-col gap-2"
                            >
                                <span className="text-2xl">🎲</span>
                                Random
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => handleStart('manual')}
                                className="h-24 text-lg flex flex-col gap-2"
                            >
                                <span className="text-2xl">✍️</span>
                                Manual
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Make sure your squad is set up before starting!
                        </p>
                    </>
                )}
            </div>
        );
    }

    if (step === 'manual_setup') {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-3xl font-bold text-center">Manual Assignments</h2>
                <div className="space-y-4">
                    {roles.map(role => (
                        <Card key={role.id}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <span className="font-semibold">{role.name}</span>
                                <select
                                    className="p-2 rounded border bg-background"
                                    value={newAssignments[role.id] || ''}
                                    onChange={(e) => setNewAssignments(prev => ({ ...prev, [role.id]: e.target.value }))}
                                >
                                    <option value="">Select Member...</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Button onClick={confirmManual} className="w-full" size="lg">
                    Start Reveal Presentation 🚀
                </Button>
            </div>
        )
    }

    const currentRole = roles[currentRoleIndex];
    const assignedMemberId = newAssignments[currentRole.id];
    const assignedMember = members.find(m => m.id === assignedMemberId);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            {step === 'finished' ? (
                <div className="text-center space-y-6 animate-in zoom-in duration-1000">
                    <h2 className="text-5xl font-bold mb-8">Squad Assembled! 🚀</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {roles.map(role => {
                            const mId = newAssignments[role.id];
                            const m = members.find(mem => mem.id === mId);
                            return (
                                <Card key={role.id} className="border-primary/20 bg-primary/5 overflow-visible relative mt-4">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-background p-2 rounded-full border shadow-sm">
                                        <DynamicIcon name={role.icon} className={`h-8 w-8 ${role.color.replace('bg-', 'text-')}`} />
                                    </div>
                                    <CardContent className="pt-8 pb-4 px-4 flex flex-col items-center">
                                        <div className="text-sm font-bold uppercase tracking-widest text-primary mb-3 mt-2">{role.name}</div>
                                        {m ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-16 w-16 rounded-full overflow-hidden bg-secondary border-2 border-primary/20">
                                                    {m.avatar_url ? (
                                                        <img src={m.avatar_url} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center font-bold text-xl text-muted-foreground">
                                                            {m.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="font-semibold text-lg">{m.name}</div>
                                            </div>
                                        ) : <span className="text-muted-foreground">-</span>}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                    <Button onClick={() => navigate('/')} size="lg" className="mt-8">
                        Go to Dashboard
                    </Button>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentRole.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="w-full max-w-md text-center"
                    >
                        <h3 className="text-4xl font-extrabold mb-8 text-primary">
                            {currentRole.name}
                        </h3>

                        <div className="bg-card p-8 rounded-2xl border shadow-2xl mb-8 min-h-[250px] flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Role Icon Background Watermark */}
                            <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
                                <DynamicIcon name={currentRole.icon} className="h-48 w-48" />
                            </div>

                            {assignedMember ? (
                                <div className="z-10 flex flex-col items-center">
                                    <div className="relative h-32 w-32 rounded-full overflow-hidden bg-secondary mb-6 border-4 border-primary shadow-lg">
                                        {assignedMember.avatar_url ? (
                                            <img src={assignedMember.avatar_url} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center font-bold text-4xl text-muted-foreground">
                                                {assignedMember.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-4xl font-bold tracking-tight">{assignedMember.name}</div>
                                </div>
                            ) : (
                                <div className="text-xl text-muted-foreground italic z-10">No assignment</div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}
