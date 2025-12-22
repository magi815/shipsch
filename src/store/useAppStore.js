import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 앱 전역 상태 관리 스토어
const useAppStore = create(
  persist(
    (set, get) => ({
      // 현재 선택된 선박
      currentShip: null,
      setCurrentShip: (ship) => set({ currentShip: ship, filters: {}, hiddenBlocks: [], selectedCircuits: new Set() }),

      // 필터 상태
      filters: {},
      setFilters: (filters) => set({ filters }),
      resetFilters: () => set({ filters: {} }),

      // 숨겨진 블록 목록
      hiddenBlocks: [],
      toggleHiddenBlock: (block) => set((state) => ({
        hiddenBlocks: state.hiddenBlocks.includes(block)
          ? state.hiddenBlocks.filter(b => b !== block)
          : [...state.hiddenBlocks, block]
      })),
      resetHiddenBlocks: () => set({ hiddenBlocks: [] }),

      // 선택된 서킷 목록
      selectedCircuits: new Set(),
      toggleCircuitSelection: (circuit) => set((state) => {
        const newSet = new Set(state.selectedCircuits);
        if (newSet.has(circuit)) {
          newSet.delete(circuit);
        } else {
          newSet.add(circuit);
        }
        return { selectedCircuits: newSet };
      }),
      setSelectedCircuits: (circuits) => set({ selectedCircuits: new Set(circuits) }),
      clearSelectedCircuits: () => set({ selectedCircuits: new Set() }),

      // 추가 기능 표시 여부
      extraFeaturesVisible: false,
      toggleExtraFeatures: () => set((state) => ({ extraFeaturesVisible: !state.extraFeaturesVisible })),

      // TBN 토글 상태
      tbnState: { showType: true, showBlock: true, showNode: true },
      toggleTbn: (key) => set((state) => ({
        tbnState: { ...state.tbnState, [key]: !state.tbnState[key] }
      })),

      // 다크 모드
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'shipsch-storage', // localStorage 키 이름
      partialize: (state) => ({
        currentShip: state.currentShip,
        darkMode: state.darkMode,
        tbnState: state.tbnState,
        extraFeaturesVisible: state.extraFeaturesVisible,
      }),
      // Set을 배열로 직렬화
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => JSON.parse(str),
    }
  )
);

export default useAppStore;
