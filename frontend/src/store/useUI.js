import { create } from 'zustand';

const useUIStore = create((set) => ({
    isSidebarOpen: true,
    theme: localStorage.getItem('theme') || 'light',
    activeTimer: null,

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setTimer: (timer) => set({ activeTimer: timer }),
    toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        return { theme: newTheme };
    }),
    initTheme: () => {
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }
}));

export default useUIStore;
