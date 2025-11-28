import React from 'react';
import { List, Calendar, CheckSquare, FileText, ClipboardList, Bot } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'timeline', label: 'Timeline', icon: List },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'plans', label: 'Plans', icon: FileText },
    { id: 'photos', label: 'Reports', icon: ClipboardList },
    { id: 'ai', label: 'AI', icon: Bot },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-accent-purple' : 'text-gray-500'
              }`}
            >
              <Icon size={24} className={isActive ? 'text-accent-purple' : 'text-gray-500'} />
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

