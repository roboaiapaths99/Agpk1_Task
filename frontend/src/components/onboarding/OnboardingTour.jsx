import React from 'react';
import { AnimatePresence } from 'framer-motion';
import useOnboardingTour from '../../hooks/useOnboardingTour';
import WelcomeModal from './WelcomeModal';
import TourStep from './TourStep';

const TOUR_STEPS = [
    {
        target: '[data-tour="dashboard"]',
        title: 'Welcome to your Dashboard',
        description: 'This is your command center. View KPIs, recent activity, and quick actions all in one place.',
        position: 'right',
        route: '/dashboard',
        emoji: '📊'
    },
    {
        target: '[data-tour="tasks"]',
        title: 'Task Management',
        description: 'Create, assign, and track work items with Kanban boards, sprint views, and powerful filters.',
        position: 'right',
        route: '/tasks',
        emoji: '✅'
    },
    {
        target: '[data-tour="projects"]',
        title: 'Project Timeline',
        description: 'Plan projects with Gantt charts, milestones, and dependencies. Track progress in real time.',
        position: 'right',
        route: '/projects',
        emoji: '📅'
    },
    {
        target: '[data-tour="finance"]',
        title: 'Finance Module',
        description: 'Full double-entry accounting: Invoices, expenses, ledger, budgets, payroll, and financial reports.',
        position: 'right',
        route: '/finance',
        emoji: '💰'
    },
    {
        target: '[data-tour="reports"]',
        title: 'Reports & Analytics',
        description: 'Generate workload, SLA, burndown, and financial reports. Export to Excel with one click.',
        position: 'right',
        route: '/reports',
        emoji: '📈'
    },
    {
        target: '[data-tour="settings"]',
        title: 'Settings & Integrations',
        description: 'Configure your workspace, connect Slack/GitHub, manage roles, and customize your experience.',
        position: 'right',
        route: '/settings',
        emoji: '⚙️'
    }
];

const OnboardingTour = () => {
    const {
        isActive,
        currentStep,
        targetRect,
        showWelcome,
        start,
        next,
        prev,
        skip,
        restart
    } = useOnboardingTour(TOUR_STEPS);

    return (
        <>
            <AnimatePresence>
                {showWelcome && (
                    <WelcomeModal 
                        onStart={start} 
                        onSkip={skip} 
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isActive && (
                    <TourStep
                        rect={targetRect}
                        step={TOUR_STEPS[currentStep]}
                        currentStep={currentStep}
                        totalSteps={TOUR_STEPS.length}
                        onNext={next}
                        onPrev={prev}
                        onSkip={skip}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default OnboardingTour;
