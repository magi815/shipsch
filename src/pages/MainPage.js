import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '../components/Header';
import DataTable from '../components/DataTable';
import { getShips, getRows, saveChecked, saveCheckedAll, changeSetBlockAll } from '../api/shipApi';

function MainPage() {
  const [ships, setShips] = useState([]);
  const [currentShip, setCurrentShip] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [hiddenBlocks, setHiddenBlocks] = useState([]);
  const [selectedCircuits, setSelectedCircuits] = useState(new Set());
  const [extraFeaturesVisible, setExtraFeaturesVisible] = useState(false);
  const [tbnState, setTbnState] = useState({ showType: true, showBlock: true, showNode: true });

  // T B N 토글 핸들러
  const handleTbnToggle = (key) => {
    setTbnState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 선박 목록 로드
  useEffect(() => {
    const loadShips = async () => {
      try {
        const shipList = await getShips();
        setShips(shipList);
        if (shipList.length > 0) {
          const savedShip = localStorage.getItem('lastShip');
          const initialShip = savedShip && shipList.includes(savedShip) ? savedShip : shipList[0];
          setCurrentShip(initialShip);
        }
      } catch (err) {
        console.error('선박 목록 로드 실패:', err);
      }
    };
    loadShips();
  }, []);

  // 데이터 로드
  const loadData = useCallback(async () => {
    if (!currentShip) return;
    setLoading(true);
    try {
      const data = await getRows(currentShip, filters);
      setRows(data.rows || []);
      setHiddenBlocks([]);
      setSelectedCircuits(new Set());
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [currentShip, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 선박 변경
  const handleShipChange = (ship) => {
    setCurrentShip(ship);
    localStorage.setItem('lastShip', ship);
    setFilters({});
  };

  // 필터 적용
  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  // 필터 초기화
  const handleReset = () => {
    setFilters({});
  };

  // SetBlock 토글
  const handleToggleBlock = (block) => {
    setHiddenBlocks(prev =>
      prev.includes(block) ? prev.filter(b => b !== block) : [...prev, block]
    );
  };

  // SetBlock 목록 추출 (Object로 변환) - API는 DB 원본 필드명 사용
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

  // 체크 상태 변경
  const handleCheckChange = async (circuit, checked) => {
    try {
      await saveChecked(currentShip, circuit, checked);
      setRows(prev => prev.map(r =>
        r.Circuit === circuit ? { ...r, checked: checked ? 1 : 0 } : r
      ));
    } catch (err) {
      console.error('체크 저장 실패:', err);
    }
  };

  // 전체 체크/해제 (숨겨진 서킷 제외) - API는 DB 원본 필드명 사용
  const handleCheckAll = async (checked) => {
    const visibleCircuits = rows
      .filter(row => {
        const setBlock = row['SET Block'] || '';
        return !hiddenBlocks.includes(setBlock);
      })
      .map(r => r.Circuit);
    if (visibleCircuits.length === 0) return;
    try {
      await saveCheckedAll(currentShip, visibleCircuits, checked);
      setRows(prev => prev.map(r =>
        visibleCircuits.includes(r.Circuit) ? { ...r, checked: checked ? 1 : 0 } : r
      ));
    } catch (err) {
      console.error('전체 체크 저장 실패:', err);
    }
  };

  // 서킷 선택 토글
  const handleCircuitSelect = (circuit, selected) => {
    setSelectedCircuits(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(circuit);
      } else {
        newSet.delete(circuit);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      const visibleCircuits = rows
        .filter(row => {
          const setBlock = row['SET Block'] || '';
          return !hiddenBlocks.includes(setBlock);
        })
        .map(r => r.Circuit);
      setSelectedCircuits(new Set(visibleCircuits));
    } else {
      setSelectedCircuits(new Set());
    }
  };

  // 선택된 서킷들의 SetBlock 일괄 변경 - API는 DB 원본 필드명 사용
  const handleChangeSetBlockAll = async (blockNbr) => {
    if (selectedCircuits.size === 0) {
      alert('선택된 서킷이 없습니다.');
      return;
    }
    try {
      const circuits = [...selectedCircuits];
      await changeSetBlockAll(currentShip, circuits, blockNbr);
      setRows(prev => prev.map(r => {
        if (selectedCircuits.has(r.Circuit)) {
          return { ...r, 'SET Block': blockNbr };
        }
        return r;
      }));
      setSelectedCircuits(new Set());
      alert('SetBlock이 변경되었습니다.');
    } catch (err) {
      console.error('SetBlock 변경 실패:', err);
      alert('SetBlock 변경에 실패했습니다.');
    }
  };

  // 개별 SetBlock 변경
  const handleSetBlockChange = async (circuit, blockNbr) => {
    try {
      await changeSetBlockAll(currentShip, [circuit], blockNbr);
      setRows(prev => prev.map(r =>
        r.Circuit === circuit ? { ...r, 'SET Block': blockNbr } : r
      ));
    } catch (err) {
      console.error('SetBlock 변경 실패:', err);
    }
  };

  // 메모 저장 후 처리
  const handleMemoSave = (circuit, newMemo) => {
    const now = new Date();
    const memodate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setRows(prev => prev.map(r =>
      r.Circuit === circuit ? { ...r, memo: newMemo, memodate } : r
    ));
  };

  // 노드 클릭 처리 (길게 클릭 - 검색)
  const handleNodeClick = (node) => {
    setFilters(prev => ({ ...prev, node }));
  };

  // 추가 기능 토글
  const handleToggleExtraFeatures = () => {
    setExtraFeaturesVisible(prev => !prev);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Header
        ships={ships}
        currentShip={currentShip}
        onShipChange={handleShipChange}
        filters={filters}
        onFilter={handleFilter}
        onReset={handleReset}
        extraFeaturesVisible={extraFeaturesVisible}
        onToggleExtraFeatures={handleToggleExtraFeatures}
      />

      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          color: '#6b7280'
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
        />
      )}
    </div>
  );
}

export default MainPage;
