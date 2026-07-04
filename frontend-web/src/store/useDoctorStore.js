import { create } from 'zustand';

export const useDoctorStore = create((set) => ({
    // Navigation & View States
    activeTab: 'command',
    selectedPatient: null,
    activeCall: null,
    notifications: [],

    // Actions
    setActiveTab: (tab) => set({ activeTab: tab, selectedPatient: null }),
    
    setSelectedPatient: (patient) => set({ selectedPatient: patient }),
    
    clearSelectedPatient: () => set({ selectedPatient: null }),

    setActiveCall: (appointment) => set({ activeCall: appointment }),
    
    clearActiveCall: () => set({ activeCall: null }),

    // Notifications Management
    addNotification: (notification) => set((state) => ({
        notifications: [
            { id: Date.now(), timestamp: new Date().toISOString(), read: false, ...notification },
            ...state.notifications
        ]
    })),

    markNotificationAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    })),

    clearNotifications: () => set({ notifications: [] })
}));
