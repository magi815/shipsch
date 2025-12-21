import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import MemoPopover from './MemoPopover';
import CircuitRow from './CircuitRow';

// API 응답은 DB 원본 필드명 사용 (공백 포함)
// Circuit, Cable Type, Node PATH, Block PATH, SET Block
// From Length, To Length, From Equipment, To Equipment
// checked, memo, memodate, list_node, list_BlockPATH, reverse, 가닥수, 길이

// Django CSS 기준 컬럼 너비
// 1: Circuit = 110px, 2: Type/Set = 100px, 3: 길이 = 40px
// 4: FromLength = 30px, 5: FromEquip = auto, 6: ToEquip = auto, 7: ToLength = 30px

function DataTable({
  data,
  shipNum,
  hiddenBlocks,
  onMemoSave,
  onCheckChange,
  onCheckAll,
  onNodeClick,
  tbnState,
  onTbnToggle,
  checkedCount,
  totalCount,
  setBlocks,
  onToggleBlock,
  extraFeaturesVisible,
  selectedCircuits,
  onCircuitSelect,
  onSelectAll,
  onChangeSetBlockAll,
  onSetBlockChange
}) {
  const parentRef = useRef(null);
  const [memoPopover, setMemoPopover] = useState({ isOpen: false, circuit: '', memo: '', memodate: '' });
  const [activeSetBlockCircuit, setActiveSetBlockCircuit] = useState(null);
  const [setBlockInput, setSetBlockInput] = useState('');
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  const [highlightedCircuit, setHighlightedCircuit] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // 거리계산 상태 (circuit별로 선택된 노드들)
  const [selectedNodes, setSelectedNodes] = useState({}); // { circuit: [node1, node2] }
  const [calcResults, setCalcResults] = useState({}); // { circuit: { fr, ct, to, total, node1, node2 } }

  // 숨김 블록 필터링
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(row => {
      const setBlock = row['SET Block'] || '';
      return !hiddenBlocks.includes(setBlock);
    });
  }, [data, hiddenBlocks]);

  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 5,
    measureElement: (element) => element?.getBoundingClientRect().height ?? 140
  });

  // 페이지 내 검색
  const handlePageSearch = useCallback(() => {
    if (!pageSearchQuery.trim()) {
      setSearchResults([]);
      setHighlightedCircuit(null);
      return;
    }
    const query = pageSearchQuery.toLowerCase();
    const results = [];
    filteredData.forEach((row, idx) => {
      const circuit = (row.Circuit || '').toLowerCase();
      const nodePath = (row['Node PATH'] || row.list_node || '').toLowerCase();
      const blockPath = (row.list_BlockPATH || row['Block PATH'] || '').toLowerCase();
      const cableType = (row['Cable Type'] || '').toLowerCase();
      const setBlock = (row['SET Block'] || '').toLowerCase();
      const fromEquip = (row['From Equipment'] || '').toLowerCase();
      const toEquip = (row['To Equipment'] || '').toLowerCase();
      if (circuit.includes(query) || nodePath.includes(query) || blockPath.includes(query) ||
          cableType.includes(query) || setBlock.includes(query) || fromEquip.includes(query) || toEquip.includes(query)) {
        results.push({ circuit: row.Circuit, index: idx });
      }
    });
    setSearchResults(results);
    setCurrentSearchIndex(0);
    if (results.length > 0) {
      setHighlightedCircuit(results[0].circuit);
      rowVirtualizer.scrollToIndex(results[0].index, { align: 'center' });
    }
  }, [pageSearchQuery, filteredData, rowVirtualizer]);

  const handleNextSearch = useCallback(() => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    setHighlightedCircuit(searchResults[nextIndex].circuit);
    rowVirtualizer.scrollToIndex(searchResults[nextIndex].index, { align: 'center' });
  }, [searchResults, currentSearchIndex, rowVirtualizer]);

  const handlePrevSearch = useCallback(() => {
    if (searchResults.length === 0) return;
    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    setHighlightedCircuit(searchResults[prevIndex].circuit);
    rowVirtualizer.scrollToIndex(searchResults[prevIndex].index, { align: 'center' });
  }, [searchResults, currentSearchIndex, rowVirtualizer]);

  const clearSearch = () => {
    setPageSearchQuery('');
    setSearchResults([]);
    setHighlightedCircuit(null);
    setCurrentSearchIndex(0);
  };

  // 거리계산 함수 (Django callen 함수와 동일한 로직)
  const calculateDistance = useCallback((lengthNode, node1, node2) => {
    if (!lengthNode || !node1 || !node2) return null;
    const a = String(lengthNode);
    const b = node1;
    const c = node2;

    if (a.indexOf(b) === -1 || a.indexOf(c) === -1 || a.indexOf(')-T       ') === -1) {
      return { fr: 'N', ct: 'N', to: 'N', total: 0 };
    }

    try {
      const firstVal = parseFloat(a.substring(a.indexOf(')-T       ') - 7, a.indexOf(')-T       ')));
      const secondVal = parseFloat(a.substring(a.indexOf(c) - 9, a.indexOf(c) - 2));
      const thirdVal = parseFloat(a.substring(a.indexOf(b) - 9, a.indexOf(b) - 2));

      let fr, ct, to, total;
      if (a.indexOf(b) <= a.indexOf(c)) {
        fr = Math.round(thirdVal * 100) / 100;
        to = Math.round((firstVal - secondVal) * 100) / 100;
        ct = Math.round((secondVal - thirdVal) * 100) / 100;
        total = Math.round((fr + to + ct) * 100) / 100;
      } else {
        fr = Math.round((firstVal - thirdVal) * 100) / 100;
        to = Math.round(secondVal * 100) / 100;
        ct = Math.round((thirdVal - secondVal) * 100) / 100;
        total = Math.round((fr + to + ct) * 100) / 100;
      }
      return { fr, ct, to, total, node1: b, node2: c, reversed: a.indexOf(b) > a.indexOf(c) };
    } catch (e) {
      return { fr: 'N', ct: 'N', to: 'N', total: 0 };
    }
  }, []);

  // 노드 클릭 핸들러 (거리계산용)
  const handleNodeCalcClick = useCallback((circuit, node, lengthNode) => {
    const current = selectedNodes[circuit] || [];

    // 이미 선택된 노드인 경우 제거
    if (current.includes(node)) {
      const newNodes = current.filter(n => n !== node);
      setSelectedNodes(prev => ({ ...prev, [circuit]: newNodes }));
      // 결과도 초기화
      if (newNodes.length < 2) {
        setCalcResults(prev => {
          const { [circuit]: removed, ...rest } = prev;
          return rest;
        });
      }
      return;
    }

    // 노드 추가
    let newNodes;
    if (current.length >= 2) {
      // 이미 2개 선택된 경우 초기화하고 새 노드로 시작
      newNodes = [node];
      setCalcResults(prev => {
        const { [circuit]: removed, ...rest } = prev;
        return rest;
      });
    } else {
      newNodes = [...current, node];
    }

    setSelectedNodes(prev => ({ ...prev, [circuit]: newNodes }));

    // 2개 선택되면 거리 계산
    if (newNodes.length === 2) {
      const result = calculateDistance(lengthNode, newNodes[0], newNodes[1]);
      if (result) {
        setCalcResults(prev => ({ ...prev, [circuit]: result }));
      }
    }
  }, [selectedNodes, calculateDistance]);

  // 모든 서킷에 대해 동일 노드 거리계산 (all 버튼)
  const handleCalcAll = useCallback((node1, node2) => {
    if (!data || !node1 || !node2) return;

    const newSelectedNodes = {};
    const newCalcResults = {};

    data.forEach(row => {
      const circuit = row.Circuit;
      const nodePath = row.list_node || row['Node PATH'] || '';
      const lengthNode = row['길이Node'] || '';

      // 두 노드를 모두 포함하는 서킷인지 확인
      if (nodePath.includes(node1) && nodePath.includes(node2)) {
        newSelectedNodes[circuit] = [node1, node2];
        const result = calculateDistance(lengthNode, node1, node2);
        if (result) {
          newCalcResults[circuit] = result;
        }
      }
    });

    setSelectedNodes(prev => ({ ...prev, ...newSelectedNodes }));
    setCalcResults(prev => ({ ...prev, ...newCalcResults }));
  }, [data, calculateDistance]);

  // 메모 팝오버 열기 핸들러
  const handleMemoPopoverOpen = useCallback((circuit, memo, memodate) => {
    setMemoPopover({ isOpen: true, circuit, memo, memodate });
  }, []);

  // 개별 서킷 계산 결과 초기화
  const handleResetCalc = useCallback((circuit) => {
    setSelectedNodes(prev => {
      const { [circuit]: removed, ...rest } = prev;
      return rest;
    });
    setCalcResults(prev => {
      const { [circuit]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // 전체 계산 결과 초기화
  const handleResetAllCalc = useCallback(() => {
    setSelectedNodes({});
    setCalcResults({});
  }, []);

  // SetBlock 바 렌더링
  const renderSetBlockBar = () => {
    if (!setBlocks || Object.keys(setBlocks).length === 0) return null;
    const allBlockKeys = Object.keys(setBlocks);
    const totalBlocks = allBlockKeys.length;
    const visibleBlocks = totalBlocks - hiddenBlocks.length;
    const isAllBlocksVisible = visibleBlocks === totalBlocks;

    return (
      <div
        className="no-scroll"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 14px',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #e5e7eb',
          overflowX: 'auto'
        }}
      >
        <span
          onClick={() => {
            if (isAllBlocksVisible) {
              allBlockKeys.forEach(key => { if (!hiddenBlocks.includes(key)) onToggleBlock(key); });
            } else {
              hiddenBlocks.forEach(key => onToggleBlock(key));
            }
          }}
          style={{
            fontSize: '12px',
            color: '#333',
            fontWeight: 'normal',
            whiteSpace: 'nowrap',
            padding: '6px 12px',
            backgroundColor: '#bde2f7',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
          title={isAllBlocksVisible ? '전체 숨기기' : '전체 보이기'}
        >
          {visibleBlocks}/{totalBlocks}
        </span>
        <div style={{ width: '1px', height: '20px', backgroundColor: '#d1d5db' }} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
          {Object.entries(setBlocks).sort((a, b) => String(a[0]).localeCompare(String(b[0]))).map(([key, count]) => {
            const isHidden = hiddenBlocks.includes(key);
            return (
              <button
                key={key}
                onClick={() => onToggleBlock(key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: isHidden ? '1px dashed #a0a0a0' : '1px solid #7cb9e8',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  backgroundColor: isHidden ? '#f5f5f5' : '#e8f4fc',
                  color: isHidden ? '#888' : '#1a5276',
                  fontStyle: 'normal',
                  opacity: 1,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  textDecoration: isHidden ? 'line-through' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{key || 'N/A'}</span>
                <span style={{
                  backgroundColor: isHidden ? '#d0d0d0' : '#5dade2',
                  color: isHidden ? '#666' : '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: '8px',
                  minWidth: '18px',
                  textAlign: 'center',
                  textDecoration: 'none'
                }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // 추가 기능 바 렌더링
  const renderExtraFeaturesBar = () => {
    if (!extraFeaturesVisible) return null;
    const visibleCircuits = new Set(filteredData.map(row => row.Circuit || ''));
    const visibleSelectedCount = selectedCircuits ? [...selectedCircuits].filter(c => visibleCircuits.has(c)).length : 0;
    const totalVisible = filteredData.length;
    const isAllSelected = totalVisible > 0 && visibleSelectedCount === totalVisible;

    const tbnButtonStyle = (active) => ({
      padding: '6px 12px',
      fontSize: '14px',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      backgroundColor: active ? '#bde2f7' : '#eaf7bd',
      color: '#333',
      fontStyle: active ? 'normal' : 'italic',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 14px',
        backgroundColor: '#fafafa',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}>
        {/* T B N 버튼 */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onTbnToggle && onTbnToggle('showType')}
            style={tbnButtonStyle(tbnState?.showType)}
            title="Type 표시 토글"
          >T</button>
          <button
            onClick={() => onTbnToggle && onTbnToggle('showBlock')}
            style={tbnButtonStyle(tbnState?.showBlock)}
            title="Block 표시 토글"
          >B</button>
          <button
            onClick={() => onTbnToggle && onTbnToggle('showNode')}
            style={tbnButtonStyle(tbnState?.showNode)}
            title="Node 표시 토글"
          >N</button>
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#d1d5db' }} />

        {/* 페이지 내 검색 */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: '140px' }}>
          <input
            type="text"
            placeholder="페이지 내 검색"
            value={pageSearchQuery}
            onChange={(e) => setPageSearchQuery(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') handlePageSearch(); }}
            style={{
              padding: '9px 28px 9px 20px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '30px',
              width: '170px',
              backgroundColor: '#fff',
              outline: 'none',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          />
          {pageSearchQuery && (
            <button onClick={clearSearch} style={{
              position: 'absolute',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              transition: 'color 0.2s'
            }}>×</button>
          )}
        </div>
        <button onClick={handlePageSearch} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px'
        }}>🔍</button>
        {searchResults.length > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            backgroundColor: '#bde2f7',
            borderRadius: '10px',
            border: 'none'
          }}>
            <button
              onClick={handlePrevSearch}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '50%',
                backgroundColor: '#fff',
                color: '#333',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)'
              }}
            >◀</button>
            <span style={{
              fontSize: '14px',
              color: '#333',
              fontWeight: 'bold',
              padding: '0 4px',
              minWidth: '40px',
              textAlign: 'center',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>{currentSearchIndex + 1}/{searchResults.length}</span>
            <button
              onClick={handleNextSearch}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '50%',
                backgroundColor: '#fff',
                color: '#333',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)'
              }}
            >▶</button>
          </div>
        )}

        <div style={{ width: '1px', height: '20px', backgroundColor: '#d1d5db' }} />

        {/* 셋블록 일괄변경 */}
        <span
          onClick={() => onSelectAll && onSelectAll(!isAllSelected)}
          style={{
            fontSize: '14px',
            color: '#333',
            fontWeight: 'bold',
            padding: '6px 12px',
            backgroundColor: visibleSelectedCount > 0 ? '#bde2f7' : '#eaf7bd',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
          title={isAllSelected ? '전체 선택 해제' : '전체 선택'}
        >
          {visibleSelectedCount}/{totalVisible}
        </span>
        <input
          type="text"
          placeholder="SetBlock"
          value={setBlockInput}
          onChange={(e) => setSetBlockInput(e.target.value)}
          style={{
            padding: '9px 20px',
            fontSize: '14px',
            border: 'none',
            borderRadius: '30px',
            width: '90px',
            backgroundColor: '#fff',
            outline: 'none',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        />
        <button
          onClick={() => onChangeSetBlockAll && onChangeSetBlockAll(setBlockInput)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#d2fdd8',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >✓</button>
      </div>
    );
  };

  // 테이블 헤더 렌더링 (Django 템플릿과 동일)
  const renderHeader = () => {
    const allChecked = filteredData.length > 0 && filteredData.every(r => r.checked);
    const headerStyle = {
      padding: '5px',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#333',
      border: '1px solid #ddd',
      backgroundColor: '#bde2f7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ backgroundColor: '#bde2f7', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)' }}>
            <th style={{
              ...headerStyle,
              width: '110px',
              textAlign: 'left',
              whiteSpace: 'nowrap',
              borderRightStyle: 'double',
              borderRightWidth: 'medium'
            }}>
              <span style={{ fontWeight: 'bold' }}>{checkedCount}</span> / <span>{filteredData.length}</span>
            </th>
            <th style={{ ...headerStyle, width: '100px', textAlign: 'left', whiteSpace: 'nowrap' }}>Type / Set</th>
            <th style={{ ...headerStyle, width: '40px', textAlign: 'center' }}>길이</th>
            <th style={{ ...headerStyle, width: '30px', textAlign: 'center' }}></th>
            <th style={{ ...headerStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>From</th>
            <th style={{ ...headerStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>To</th>
            <th style={{ ...headerStyle, width: '30px', textAlign: 'center' }}></th>
          </tr>
        </thead>
      </table>
    );
  };

  return (
    <div
      onClick={() => { if (activeSetBlockCircuit) setActiveSetBlockCircuit(null); }}
      style={{ width: '100%', minWidth: '790px' }}
    >
      {renderSetBlockBar()}
      {renderExtraFeaturesBar()}
      {renderHeader()}

      <div
        ref={parentRef}
        style={{
          height: 'calc(100vh - 140px)',
          overflow: 'auto',
          width: '100%'
        }}
      >
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = filteredData[virtualRow.index];
            const circuit = row.Circuit || '';
            return (
              <CircuitRow
                key={virtualRow.key}
                row={row}
                virtualRow={virtualRow}
                tbnState={tbnState}
                extraFeaturesVisible={extraFeaturesVisible}
                isHighlighted={highlightedCircuit === circuit}
                isSelected={selectedCircuits?.has(circuit)}
                circuitSelectedNodes={selectedNodes[circuit] || []}
                circuitCalcResult={calcResults[circuit]}
                activeSetBlockCircuit={activeSetBlockCircuit}
                onCheckChange={onCheckChange}
                onCircuitSelect={onCircuitSelect}
                onSetBlockChange={onSetBlockChange}
                onNodeClick={onNodeClick}
                onNodeCalcClick={handleNodeCalcClick}
                onCalcAll={handleCalcAll}
                onMemoPopoverOpen={handleMemoPopoverOpen}
                onSetActiveSetBlockCircuit={setActiveSetBlockCircuit}
                onResetCalc={handleResetCalc}
                onResetAllCalc={handleResetAllCalc}
                measureElement={rowVirtualizer.measureElement}
              />
            );
          })}
        </div>
      </div>

      <MemoPopover
        isOpen={memoPopover.isOpen}
        onClose={() => setMemoPopover({ isOpen: false, circuit: '', memo: '', memodate: '' })}
        circuit={memoPopover.circuit}
        memo={memoPopover.memo}
        memodate={memoPopover.memodate}
        shipNum={shipNum}
        onSave={onMemoSave}
      />
    </div>
  );
}

export default DataTable;
