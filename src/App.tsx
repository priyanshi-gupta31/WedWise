import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WeddingProvider, useWedding } from './context/WeddingContext';
import { AppLayout } from './layouts/AppLayout';
import { NavTab } from './components/layout/MobileNav';
import { AuthPage } from './pages/AuthPage';
import { SetupPage } from './pages/SetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { BudgetPage } from './pages/BudgetPage';
import { WeddingEventsPage } from './pages/WeddingEventsPage';
import { WeddingGuestsPage } from './pages/WeddingGuestsPage';
import { WeddingVendorsPage } from './pages/WeddingVendorsPage';
import { WeddingMembersPage } from './pages/WeddingMembersPage';
import { WeddingMemoriesPage } from './pages/WeddingMemoriesPage';
import { MorePage } from './pages/MorePage';
import { WeddingTimelineSection } from './components/dashboard/WeddingTimelineSection';
import { WeddingGuestsSection } from './components/dashboard/WeddingGuestsSection';
import { ExpenseFormModal } from './components/expenses/ExpenseFormModal';
import { ExpenseDetailsModal } from './components/expenses/ExpenseDetailsModal';
import { CinematicInvitationReveal } from './components/cinematic/CinematicInvitationReveal';
import { AskWedWise } from './components/ai/AskWedWise';
import { Expense } from './types/database.types';
import { DashboardSkeleton } from './components/common/LoadingSkeleton';
import { formatReadableDate } from './utils/date';
import { InvitationAcceptancePage } from './pages/InvitationAcceptancePage';

const MainNavigator: React.FC = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { wedding, isLoading: weddingLoading } = useWedding();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [memoryFilterEventId, setMemoryFilterEventId] = useState<string | null>(null);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [eventFocusId, setEventFocusId] = useState<string | null>(null);

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAskWedWiseOpen, setIsAskWedWiseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Helper to extract invite token from /invite/:token URL
  const getInviteTokenFromUrl = () => {
    if (typeof window === 'undefined') return null;
    const match = window.location.pathname.match(/^\/invite\/([a-zA-Z0-9_-]+)/i);
    return match ? match[1] : null;
  };

  const [inviteToken, setInviteToken] = useState<string | null>(getInviteTokenFromUrl);

  // Handle URL deep links & browser popstate navigation
  useEffect(() => {
    const handleUrlRoute = () => {
      const urlToken = getInviteTokenFromUrl();
      if (urlToken) {
        setInviteToken(urlToken);
        return;
      }
      setInviteToken(null);

      const pathname = window.location.pathname.replace(/^\/+/, '').toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);
      const eventParam = searchParams.get('event');
      const memoryParam = searchParams.get('memory');

      if (pathname === 'memories') {
        setActiveTab('memories');
        if (eventParam) setMemoryFilterEventId(eventParam);
        if (memoryParam) setSelectedMemoryId(memoryParam);
      } else if (pathname === 'wedding' || pathname === 'ceremonies') {
        setActiveTab('wedding');
        if (eventParam) setEventFocusId(eventParam);
      } else if (pathname === 'expenses' || pathname === 'money') {
        setActiveTab('expenses');
      } else if (pathname === 'budget') {
        setActiveTab('budget');
      } else if (pathname === 'people' || pathname === 'guests') {
        setActiveTab('people');
      } else if (pathname === 'vendors') {
        setActiveTab('vendors');
      } else if (pathname === 'members' || pathname === 'family') {
        setActiveTab('members');
      } else if (pathname === 'more') {
        setActiveTab('more');
      } else if (pathname === 'dashboard' || pathname === '') {
        setActiveTab('dashboard');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  const handleTabChange = (tab: NavTab) => {
    if (tab === 'memories') {
      setMemoryFilterEventId(null);
      setSelectedMemoryId(null);
    }
    if (tab === 'wedding') {
      setEventFocusId(null);
    }
    setActiveTab(tab);
    const targetUrl = tab === 'dashboard' ? '/' : `/${tab}`;
    if (window.location.pathname !== targetUrl && typeof window !== 'undefined' && window.history) {
      window.history.pushState(null, '', targetUrl);
    }
  };

  const handleSelectMemoryFromHome = (memoryId: string) => {
    setMemoryFilterEventId(null);
    setSelectedMemoryId(memoryId);
    setActiveTab('memories');
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState(null, '', `/memories?memory=${memoryId}`);
    }
  };

  const handleNavigateToMemoriesFromEvent = (eventId?: string) => {
    setMemoryFilterEventId(eventId || null);
    setSelectedMemoryId(null);
    setActiveTab('memories');
    const url = eventId ? `/memories?event=${eventId}` : '/memories';
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState(null, '', url);
    }
  };

  const handleNavigateToEventFromMemory = (eventId: string) => {
    setEventFocusId(eventId);
    setSelectedMemoryId(null);
    setActiveTab('wedding');
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState(null, '', `/wedding?event=${eventId}`);
    }
  };


  // 1. Authentication Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF7ED] p-6 max-w-lg mx-auto flex flex-col justify-center">
        <DashboardSkeleton />
      </div>
    );
  }

  // 2. Invitation Acceptance Gate (/invite/:token deep link or stored pending invite)
  const pendingToken = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('wedwise_pending_invite_token') : null;
  const activeInviteToken = inviteToken || (!wedding ? pendingToken : null);

  if (activeInviteToken) {
    return (
      <InvitationAcceptancePage
        token={activeInviteToken}
        onAccepted={() => {
          setInviteToken(null);
          if (typeof window !== 'undefined' && window.history) {
            window.history.pushState(null, '', '/');
          }
          setActiveTab('dashboard');
        }}
      />
    );
  }

  // 3. Wedding Data Loading State (Authenticated, resolving active wedding)
  if (user && weddingLoading && !wedding) {
    return (
      <div className="min-h-screen bg-[#FFF7ED] p-6 max-w-lg mx-auto flex flex-col justify-center">
        <DashboardSkeleton />
      </div>
    );
  }

  // 4. Authentication Gate
  if (!user) {
    return <AuthPage />;
  }

  // 5. Wedding Setup Gate (if no wedding exists for this user)
  if (!wedding) {
    return <SetupPage onComplete={() => setActiveTab('dashboard')} />;
  }

  // 4. Authenticated & Configured App Shell
  return (
    <>
      {/* Cinematic 3D Digital Wedding Invitation Opening Experience */}
      <CinematicInvitationReveal
        brideName={wedding?.bride_name}
        groomName={wedding?.groom_name}
        weddingDate={wedding ? formatReadableDate(wedding.wedding_date) : undefined}
        userName={profile?.full_name?.split(' ')[0]}
      />

      <AppLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenAddExpense={() => {
          setExpenseToEdit(null);
          setIsAddExpenseOpen(true);
        }}
        onOpenAskWedWise={() => setIsAskWedWiseOpen(true)}
      >
        {activeTab === 'dashboard' && (
          <DashboardPage
            onNavigateToExpenses={() => handleTabChange('expenses')}
            onNavigateTab={handleTabChange}
            onOpenAddExpense={() => {
              setExpenseToEdit(null);
              setIsAddExpenseOpen(true);
            }}
            onSelectExpense={(expense) => setSelectedExpense(expense)}
            onOpenAskWedWise={() => setIsAskWedWiseOpen(true)}
            onSelectMemory={handleSelectMemoryFromHome}
          />
        )}


        {activeTab === 'expenses' && (
          <ExpensesPage
            onSelectExpense={(expense) => setSelectedExpense(expense)}
            onOpenAddExpense={() => {
              setExpenseToEdit(null);
              setIsAddExpenseOpen(true);
            }}
          />
        )}

        {activeTab === 'budget' && <BudgetPage />}

        {activeTab === 'wedding' && (
          <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <WeddingEventsPage
              initialEventId={eventFocusId}
              onNavigateToMemories={handleNavigateToMemoriesFromEvent}
            />
          </div>
        )}

        {activeTab === 'memories' && (
          <div className="animate-fade-in">
            <WeddingMemoriesPage
              initialEventId={memoryFilterEventId}
              initialMemoryId={selectedMemoryId}
              onNavigateToEvent={handleNavigateToEventFromMemory}
            />
          </div>
        )}

        {activeTab === 'people' && (
          <div className="animate-fade-in">
            <WeddingGuestsPage />
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="animate-fade-in">
            <WeddingVendorsPage />
          </div>
        )}

        {activeTab === 'members' && (
          <div className="animate-fade-in">
            <WeddingMembersPage />
          </div>
        )}

        {activeTab === 'more' && <MorePage onNavigateTab={handleTabChange} />}

        {/* Global Add / Edit Expense Modal */}
        <ExpenseFormModal
          isOpen={isAddExpenseOpen}
          onClose={() => {
            setIsAddExpenseOpen(false);
            setExpenseToEdit(null);
          }}
          expenseToEdit={expenseToEdit}
        />

        {/* Global Expense Details Modal */}
        <ExpenseDetailsModal
          isOpen={Boolean(selectedExpense)}
          onClose={() => setSelectedExpense(null)}
          expense={selectedExpense}
          onEdit={(expense) => {
            setSelectedExpense(null);
            setExpenseToEdit(expense);
            setIsAddExpenseOpen(true);
          }}
        />

        {/* Ask WedWise AI Assistant Slide-over / Bottom-sheet */}
        <AskWedWise
          isOpen={isAskWedWiseOpen}
          onClose={() => setIsAskWedWiseOpen(false)}
          weddingId={wedding?.id}
        />
      </AppLayout>

    </>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <WeddingProvider>
          <MainNavigator />
        </WeddingProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
