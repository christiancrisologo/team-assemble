import {
    Shield,
    Star,
    Zap,
    Clock,
    Book,
    Heart,
    Trophy,
    Target,
    Flag,
    Smile,
    Bell,
    Lightbulb,
    Search,
    PenTool,
    Camera,
    Music,
    Coffee,
    Anchor,
    Feather,
    Key
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export const ALL_ICONS = {
    Shield,
    Star,
    Zap,
    Clock,
    Book,
    Heart,
    Trophy,
    Target,
    Flag,
    Smile,
    Bell,
    Lightbulb,
    Search,
    PenTool,
    Camera,
    Music,
    Coffee,
    Anchor,
    Feather,
    Key
};

export type IconName = keyof typeof ALL_ICONS;

interface IconPickerProps {
    selectedIcon?: string;
    onSelect: (iconName: string) => void;
}

export function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
    return (
        <div className="grid grid-cols-5 gap-2 p-2 border rounded-md">
            {Object.entries(ALL_ICONS).map(([name, Icon]) => (
                <Button
                    key={name}
                    variant="ghost"
                    size="icon"
                    type="button"
                    className={cn(
                        "h-8 w-8 hover:bg-muted",
                        selectedIcon === name && "bg-primary/20 text-primary border-primary"
                    )}
                    onClick={() => onSelect(name)}
                    title={name}
                >
                    <Icon className="h-4 w-4" />
                </Button>
            ))}
        </div>
    );
}

export function DynamicIcon({ name, className }: { name?: string, className?: string }) {
    if (!name || !(name in ALL_ICONS)) return <Shield className={className} />;
    const Icon = ALL_ICONS[name as IconName];
    return <Icon className={className} />;
}
