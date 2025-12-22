import React, { useEffect, useMemo, useCallback } from 'react';
import Header from '../components/Header';
import DataTable from '../components/DataTable';
import { useShips, useRows, useSaveMemo, useSaveChecked, useSaveCheckedAll, useChangeSetBlockAll } from '../hooks/useShipData';
import useAppStore from '../store/useAppStore';

function MainPage() {
  // Zustand 스토어에서 상태 가져오기
  const {
    currentShip,
    setCurrentShip,
    filters,
    setFilters,
    resetFilters,
    hiddenBlocks,
    toggleHiddenBlock,
    selectedCircuits,
    toggleCircuitSelection,
    setSelectedCircuits,
    clearSelectedCircuits,
    extraFeaturesVisible,
    toggleExtraFeatures,
    tbnState,
    toggleTbn,
    darkMode,
    toggleDarkMode,
  } = useAppStore();

  // React Query 훅 사용
  const { data: ships = [], isLoading: shipsLoading } = useShips();
  const { data: rows = [], isLoading: rowsLoading, isFetching } = useRows(currentShip, filters);

  // Mutation 훅들
  const saveMemoMutation = useSaveMemo();
  const saveCheckedMutation = useSaveChecked();
  const saveCheckedAllMutation = useSaveCheckedAll();
  const changeSetBlockAllMutation = useChangeSetBlockAll();

  const loading = shipsLoading || rowsLoading;

  // 초기 선박 설정
  useEffect(() => {
    if (ships.length > 0 && !currentShip) {
      const savedShip = localStorage.getItem('lastShip');
      const initialShip = savedShip && ships.includes(savedShip) ? savedShip : ships[0];
      setCurrentShip(initialShip);
    }
  }, [ships, currentShip, setCurrentShip]);

  // 선박 변경
  const handleShipChange = useCallback((ship) => {
    setCurrentShip(ship);
    localStorage.setItem('lastShip', ship);
  }, [setCurrentShip]);

  // 필터 적용
  const handleFilter = useCallback((newFilters) => {
    setFilters(newFilters);
  }, [setFilters]);

  // 필터 초기화
  const handleReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  // SetBlock 토글
  const handleToggleBlock = useCallback((block) => {
    toggleHiddenBlock(block);
  }, [toggleHiddenBlock]);

  // SetBlock 목록 추출
  const setBlocks = useMemo(() => {
    const blocks = {};
    rows.forEach(row => {
      const block = row['SET Block'] || '';
      if (block) {
        blocks[block] = (blocks[block] || 0) + 1;
      }
    });
    return blocks;
  }, [rows]);

  // 체크된 행 수
  const checkedCount = useMemo(() => {
    return rows.filter(r => r.checked).length;
  }, [rows]);

  // 체크 상태 변경 (낙관적 업데이트 적용)
  const handleCheckChange = useCallback(async (circuit, checked) => {
    saveCheckedMutation.mutate({
      shipNum: currentShip,
      circuit,
      checked
    });
  }, [currentShip, saveCheckedMutation]);

  // 전체 체크/해제
  const handleCheckAll = useCallback(async (checked) => {
    const visibleCircuits = rows
      .filter(row => {
        const setBlock = row['SET Block'] || '';
        return !hiddenBlocks.includes(setBlock);
      })
      .map(r => r.Circuit);
    if (visibleCircuits.length === 0) return;

    saveCheckedAllMutation.mutate({
      shipNum: currentShip,
      circuits: visibleCircuits,
      checked
    });
  }, [currentShip, rows, hiddenBlocks, saveCheckedAllMutation]);

  // 서킷 선택 토글
  const handleCircuitSelect = useCallback((circuit, selected) => {
    toggleCircuitSelection(circuit);
  }, [toggleCircuitSelection]);

  // 전체 선택/해제
  const handleSelectAll = useCallback((selectAll) => {
    if (selectAll) {
      const visibleCircuits = rows
        .filter(row => {
          const setBlock = row['SET Block'] || '';
          return !hiddenBlocks.includes(setBlock);
        })
        .map(r => r.Circuit);
      setSelectedCircuits(visibleCircuits);
    } else {
      clearSelectedCircuits();
    }
  }, [rows, hiddenBlocks, setSelectedCircuits, clearSelectedCircuits]);

  // 선택된 서킷들의 SetBlock 일괄 변경
  const handleChangeSetBlockAll = useCallback(async (blockNbr) => {
    if (selectedCircuits.size === 0) {
      alert('선택된 서킷이 없습니다.');
      return;
    }

    const circuits = [...selectedCircuits].filter(circuit => {
      const row = rows.find(r => r.Circuit === circuit);
      if (!row) return false;
      const setBlock = row['SET Block'] || '';
      return !hiddenBlocks.includes(setBlock);
    });

    if (circuits.length === 0) {
      alert('변경 가능한 서킷이 없습니다. (숨김 처리된 항목 제외)');
      return;
    }

    changeSetBlockAllMutation.mutate(
      { shipNum: currentShip, circuits, blockNbr },
      {
        onSuccess: () => {
          clearSelectedCircuits();
          alert('SetBlock이 변경되었습니다.');
        },
        onError: () => {
          alert('SetBlock 변경에 실패했습니다.');
        }
      }
    );
  }, [currentShip, selectedCircuits, rows, hiddenBlocks, changeSetBlockAllMutation, clearSelectedCircuits]);

  // 개별 SetBlock 변경
  const handleSetBlockChange = useCallback(async (circuit, blockNbr) => {
    changeSetBlockAllMutation.mutate({
      shipNum: currentShip,
      circuits: [circuit],
      blockNbr
    });
  }, [currentShip, changeSetBlockAllMutation]);

  // 메모 저장 후 처리 (낙관적 업데이트 적용)
  const handleMemoSave = useCallback((circuit, newMemo) => {
    saveMemoMutation.mutate({
      shipNum: currentShip,
      circuit,
      memo: newMemo,
      imageFiles: []
    });
  }, [currentShip, saveMemoMutation]);

  // 노드 클릭 처리
  const handleNodeClick = useCallback((node) => {
    setFilters({ ...filters, node });
  }, [filters, setFilters]);

  // TBN 토글 핸들러
  const handleTbnToggle = useCallback((key) => {
    toggleTbn(key);
  }, [toggleTbn]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: darkMode ? '#1a1a2e' : '#f9fafb',
      color: darkMode ? '#e0e0e0' : '#333',
      transition: 'background-color 0.3s, color 0.3s'
    }}>
      <Header
        ships={ships}
        currentShip={currentShip}
        onShipChange={handleShipChange}
        filters={filters}
        onFilter={handleFilter}
        onReset={handleReset}
        extraFeaturesVisible={extraFeaturesVisible}
        onToggleExtraFeatures={toggleExtraFeatures}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          color: darkMode ? '#9ca3af' : '#6b7280'
        }}>
          <div>로딩 중...</div>
        </div>
      ) : (
        <DataTable
          data={rows}
          shipNum={currentShip}
          hiddenBlocks={hiddenBlocks}
          onMemoSave={handleMemoSave}
          onCheckChange={handleCheckChange}
          onCheckAll={handleCheckAll}
          onNodeClick={handleNodeClick}
          tbnState={tbnState}
          onTbnToggle={handleTbnToggle}
          checkedCount={checkedCount}
          totalCount={rows.length}
          setBlocks={setBlocks}
          onToggleBlock={handleToggleBlock}
          extraFeaturesVisible={extraFeaturesVisible}
          selectedCircuits={selectedCircuits}
          onCircuitSelect={handleCircuitSelect}
          onSelectAll={handleSelectAll}
          onChangeSetBlockAll={handleChangeSetBlockAll}
          onSetBlockChange={handleSetBlockChange}
          darkMode={darkMode}
          isFetching={isFetching}
        />
      )}
    </div>
  );
}

export default MainPage;
