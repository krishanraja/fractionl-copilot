import { motion } from 'framer-motion';
import { Home, Plus, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabId = 'pulse' | 'log' | 'history' | 'network' | 'settings';

interface BottomNavProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const navItems: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'pulse', label: 'Pulse', icon: Home },
  { id: 'log', label: 'Log', icon: Plus },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'network', label: 'Network', icon: Users },
];

export const BottomNav = ({ currentTab, onTabChange }: BottomNavProps) => {
  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-xl",
        "border-t border-border",
        "safe-bottom"
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isLogButton = item.id === 'log';

          if (isLogButton) {
            // Special styling for the Log (center) button
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="relative -mt-4"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center",
                    "bg-primary shadow-lg",
                    isActive && "animate-pulse-glow"
                  )}
                >
                  <Plus className="w-7 h-7 text-primary-foreground" />
                </motion.div>
                <span className="sr-only">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 touch-target",
                "transition-colors duration-150"
              )}
            >
              <div className="relative">
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-colors",
                    isActive 
                      ? "text-primary" 
                      : "text-foreground-muted"
                  )} 
                />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span 
                className={cn(
                  "text-micro",
                  isActive 
                    ? "text-primary" 
                    : "text-foreground-muted"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
