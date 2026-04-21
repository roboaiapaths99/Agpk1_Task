import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import Topbar from '../components/Topbar';
import TimerWidget from '../components/TimerWidget';
import ErrorBoundary from '../components/ErrorBoundary';
import OnboardingTour from '../components/onboarding/OnboardingTour';
import useUIStore from '../store/useUI';
import { cn } from '../lib/utils';

const MainLayout = () => {
    const { isSidebarOpen } = useUIStore();

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-300",
                isSidebarOpen ? "pl-64" : "pl-20"
            )}>
                <Topbar />

                <main className="flex-1 p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </main>

                <TimerWidget />
            </div>

            {/* Onboarding Tour - renders as portal */}
            <OnboardingTour />
        </div>
    );
};

export default MainLayout;
