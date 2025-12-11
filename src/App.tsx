import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import BottomNav from './components/BottomNav';
import TimelineView from './views/TimelineView';
import DailyTasksView from './views/DailyTasksView';
import PlansContractsView from './views/PlansContractsView';
import DailyReportsView from './views/DailyReportsView';
import AIAssistantView from './views/AIAssistantView';

function App() {
  const [currentView, setCurrentView] = useState('timeline');

  const renderView = () => {
    switch (currentView) {
      case 'timeline':
        return <TimelineView />;
      case 'tasks':
        return <DailyTasksView />;
      case 'plans':
        return <PlansContractsView />;
      case 'photos':
        return <DailyReportsView />;
      case 'ai':
        return <AIAssistantView />;
      default:
        return <TimelineView />;
    }
  };

  return (
    <ThemeProvider>
      <AppProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          {renderView()}
          <BottomNav currentView={currentView} onViewChange={setCurrentView} />
        </div>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;

