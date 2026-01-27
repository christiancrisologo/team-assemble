import type { ReactNode } from 'react';
import { LayoutDashboard, Users, Settings, Shield, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { OfflineBanner } from './OfflineBanner';
import { Preloader } from '../ui/Preloader';

interface LayoutProps {
    children: ReactNode;
}

import { useUIStore } from '../../store/useUIStore';

export function Layout({ children }: LayoutProps) {
    const { isSidebarCollapsed, toggleSidebar } = useUIStore();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 border-b">
                <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                    Role Roulette
                </h1>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                </Button>
            </header>

            {/* Sidebar (Desktop) */}
            <aside className={cn(
                "hidden md:flex flex-col border-r bg-card/50 transition-all duration-300",
                isSidebarCollapsed ? "w-16" : "w-64"
            )}>
                <div className={cn("h-14 flex items-center border-b px-4", isSidebarCollapsed ? "justify-center" : "justify-between")}>
                    {!isSidebarCollapsed && (
                        <div className="flex items-center space-x-2 overflow-hidden">
                            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center flex-shrink-0">
                                <span className="font-bold text-white text-lg">R</span>
                            </div>
                            <span className="font-bold text-xl truncate">Sprint Roles</span>
                        </div>
                    )}
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className={isSidebarCollapsed ? "mx-auto" : ""}>
                        {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>

                <nav className="flex-1 space-y-2 p-2">
                    <NavItem icon={<LayoutDashboard />} label="Dashboard" to="/" collapsed={isSidebarCollapsed} />
                    <NavItem icon={<Users />} label="Squad" to="/squad" collapsed={isSidebarCollapsed} />
                    <NavItem icon={<Shield className="h-4 w-4" />} label="Roles" to="/roles" collapsed={isSidebarCollapsed} />
                    <NavItem icon={<Calendar className="h-4 w-4" />} label="Planner" to="/planning" collapsed={isSidebarCollapsed} />
                </nav>

                <div className="p-4 border-t">
                    <div className={cn("flex items-center gap-3 text-muted-foreground hover:text-foreground cursor-pointer", isSidebarCollapsed ? "justify-center" : "px-4 py-2")}>
                        <Settings className="h-5 w-5" />
                        {!isSidebarCollapsed && <span>Settings</span>}
                    </div>
                    {!isSidebarCollapsed && (
                        <div className="text-xs text-muted-foreground text-center mt-4">
                            Sprint Role Roulette v1.0
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <Preloader />
            <OfflineBanner />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur border-t flex justify-around p-3 z-50 safe-area-bottom">
                <MobileNavItem icon={<LayoutDashboard />} label="Dash" to="/" />
                <MobileNavItem icon={<Users />} label="Squad" to="/squad" />
                <MobileNavItem icon={<Shield className="h-4 w-4" />} label="Roles" to="/roles" />
                <MobileNavItem icon={<Calendar className="h-4 w-4" />} label="Planner" to="/planning" />
            </nav>
        </div>
    );
}

import { Link, useLocation } from 'react-router-dom';

function NavItem({ icon, label, to, collapsed }: { icon: ReactNode, label: string, to: string, collapsed?: boolean }) {
    const location = useLocation();
    const active = location.pathname === to;
    return (
        <Link to={to} className="w-full" title={collapsed ? label : undefined}>
            <Button
                variant={active ? "secondary" : "ghost"}
                className={cn(
                    "w-full space-x-3",
                    active && "bg-primary/10 text-primary hover:bg-primary/20",
                    collapsed ? "justify-center px-0" : "justify-start px-4"
                )}
            >
                {icon}
                {!collapsed && <span>{label}</span>}
            </Button>
        </Link>
    );
}

function MobileNavItem({ icon, label, to }: { icon: ReactNode, label: string, to: string }) {
    const location = useLocation();
    const active = location.pathname === to;
    return (
        <Link to={to} className={cn("flex flex-col items-center space-y-1 w-full", active ? "text-primary" : "text-muted-foreground")}>
            <div className="h-5 w-5">{icon}</div>
            <span className="text-[10px] font-medium">{label}</span>
        </Link>
    );
}

