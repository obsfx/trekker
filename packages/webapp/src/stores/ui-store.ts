import { create } from "zustand";
import type { CreateModalDefaults, ConnectionStatus } from "@/types";

interface UIState {
  // Modal state
  selectedTaskId: string | null;
  selectedEpicId: string | null;
  showCreateModal: boolean;
  createModalDefaults: CreateModalDefaults;
  // Connection
  connectionStatus: ConnectionStatus;
}

interface UIActions {
  openTaskDetail: (id: string) => void;
  openEpicDetail: (id: string) => void;
  openCreateModal: (defaults?: CreateModalDefaults) => void;
  closeTaskDetail: () => void;
  closeEpicDetail: () => void;
  closeCreateModal: () => void;
  closeAllModals: () => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  selectedTaskId: null,
  selectedEpicId: null,
  showCreateModal: false,
  createModalDefaults: {},
  connectionStatus: "disconnected",

  // Actions
  openTaskDetail: (id) =>
    set({
      selectedTaskId: id,
      selectedEpicId: null,
    }),

  openEpicDetail: (id) =>
    set({
      selectedEpicId: id,
      selectedTaskId: null,
    }),

  openCreateModal: (defaults = {}) =>
    set({
      showCreateModal: true,
      createModalDefaults: defaults,
    }),

  closeTaskDetail: () => set({ selectedTaskId: null }),

  closeEpicDetail: () => set({ selectedEpicId: null }),

  closeCreateModal: () =>
    set({
      showCreateModal: false,
      createModalDefaults: {},
    }),

  closeAllModals: () =>
    set({
      selectedTaskId: null,
      selectedEpicId: null,
      showCreateModal: false,
      createModalDefaults: {},
    }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));
