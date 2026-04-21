import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuth';
import { profileService } from '../services/api/apiServices';

const useOnboardingTour = (steps) => {
    const { user, fetchMe } = useAuthStore();
    const navigate = useNavigate();
    
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const lastScrolledStep = useRef(-1);
    const animFrameRef = useRef(null);

    // Initial check
    useEffect(() => {
        if (user && user.hasCompletedOnboarding === false) {
            const timer = setTimeout(() => setShowWelcome(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const updateTargetPosition = useCallback(() => {
        if (!isActive) return;
        const step = steps[currentStep];
        if (!step) return;

        const el = document.querySelector(step.target);
        if (el) {
            const rect = el.getBoundingClientRect();
            setTargetRect({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                bottom: rect.bottom,
                right: rect.right
            });

            // Scroll into view if this is the first time we see this element for this step
            if (lastScrolledStep.current !== currentStep) {
                el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                });
                lastScrolledStep.current = currentStep;
            }
        } else {
            setTargetRect(null);
        }

        animFrameRef.current = requestAnimationFrame(updateTargetPosition);
    }, [isActive, currentStep, steps]);

    useEffect(() => {
        if (isActive) {
            animFrameRef.current = requestAnimationFrame(updateTargetPosition);
        } else {
            lastScrolledStep.current = -1;
        }
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [isActive, updateTargetPosition]);

    const start = () => {
        setShowWelcome(false);
        setIsActive(true);
        setCurrentStep(0);
        lastScrolledStep.current = -1;
        if (steps[0]?.route) navigate(steps[0].route);
    };

    const next = () => {
        if (currentStep < steps.length - 1) {
            const nextIdx = currentStep + 1;
            setCurrentStep(nextIdx);
            if (steps[nextIdx].route) navigate(steps[nextIdx].route);
        } else {
            complete();
        }
    };

    const prev = () => {
        if (currentStep > 0) {
            const prevIdx = currentStep - 1;
            setCurrentStep(prevIdx);
            if (steps[prevIdx].route) navigate(steps[prevIdx].route);
        }
    };

    const complete = async () => {
        setIsActive(false);
        setCurrentStep(0);
        try {
            await profileService.updateMe({ hasCompletedOnboarding: true });
            fetchMe();
        } catch (err) {
            console.error('Failed to save onboarding status:', err);
        }
    };

    const skip = async () => {
        setShowWelcome(false);
        setIsActive(false);
        try {
            await profileService.updateMe({ hasCompletedOnboarding: true });
            fetchMe();
        } catch (err) {
            console.error('Failed to save onboarding status:', err);
        }
    };

    const restart = () => {
        setIsActive(true);
        setCurrentStep(0);
        if (steps[0]?.route) navigate(steps[0].route);
    };

    return {
        isActive,
        currentStep,
        targetRect,
        showWelcome,
        start,
        next,
        prev,
        complete,
        skip,
        restart,
        setShowWelcome
    };
};

export default useOnboardingTour;
