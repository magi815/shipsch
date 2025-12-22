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
  onSetBlockChange,
  darkMode
}) {
  const parentRef = useRef(null);
  const [memoPopover, setMemoPopover] = useState({ isOpen: false, circuit: '', memo: '', memodate: '' });
  const [setBlockPopup, setSetBlockPopup] = useState({ isOpen: false, circuit: '', currentValue: '' });
  const [setBlockInput, setSetBlockInput] = useState('');
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  const [highlightedCircuit, setHighlightedCircuit] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [checkAllPopup, setCheckAllPopup] = useState(false);

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

  // 페이지 내 검색 (서킷당 한 번만 하이라이트)
  const handlePageSearch = useCallback(() => {
    if (!pageSearchQuery.trim()) {
      setSearchResults([]);
      setHighlightedCircuit(null);
      return;
    }
    const query = pageSearchQuery.toLowerCase();
    const results = [];
    const addedCircuits = new Set(); // 중복 서킷 방지

    filteredData.forEach((row, idx) => {
      const circuitName = row.Circuit || '';
      // 이미 추가된 서킷은 건너뛰기
      if (addedCircuits.has(circuitName)) return;

      const circuit = circuitName.toLowerCase();
      const cableType = (row['Cable Type'] || '').toLowerCase();
      const fromEquip = (row['From Equipment'] || '').toLowerCase();
      const toEquip = (row['To Equipment'] || '').toLowerCase();
      const blockPath = (row.list_BlockPATH || row['Block PATH'] || '').toLowerCase();
      const nodePath = (row['Node PATH'] || row.list_node || '').toLowerCase();
      const setBlock = (row['SET Block'] || '').toLowerCase();
      const memo = (row.memo || '').toLowerCase();

      // 검색 대상: Circuit, Type, 장비이름, BlockPath, NodePath, SetBlock, 메모
      if (circuit.includes(query) || cableType.includes(query) ||
          fromEquip.includes(query) || toEquip.includes(query) ||
          blockPath.includes(query) || nodePath.includes(query) ||
          setBlock.includes(query) || memo.includes(query)) {
        results.push({ circuit: circuitName, index: idx });
        addedCircuits.add(circuitName);
      }
    });
    setSearchResults(results);
    setCurrentSearchIndex(0);
    if (results.length > 0) {
      setHighlightedCircuit(results[0].circuit);
      rowVirtualizer.scrollToIndex(results[0].index, { align: 'start' });
    } else {
      setHighlightedCircuit(null);
    }
  }, [pageSearchQuery, filteredData, rowVirtualizer]);

  const handleNextSearch = useCallback(() => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    setHighlightedCircuit(searchResults[nextIndex].circuit);
    rowVirtualizer.scrollToIndex(searchResults[nextIndex].index, { align: 'start' });
  }, [searchResults, currentSearchIndex, rowVirtualizer]);

  const handlePrevSearch = useCallback(() => {
    if (searchResults.length === 0) return;
    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    setHighlightedCircuit(searchResults[prevIndex].circuit);
    rowVirtualizer.scrollToIndex(searchResults[prevIndex].index, { align: 'start' });
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

  // SetBlock 팝업 열기 핸들러
  const handleSetBlockPopupOpen = useCallback((circuit, currentValue) => {
    setSetBlockPopup({ isOpen: true, circuit, currentValue });
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
          backgroundColor: darkMode ? '#292a2d' : '#fafafa',
          borderBottom: darkMode ? '1px solid #3c4043' : '1px solid #e5e7eb',
          overflowX: 'auto',
          transition: 'background-color 0.3s, border-color 0.3s'
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
            color: darkMode ? '#202124' : '#333',
            fontWeight: 'normal',
            whiteSpace: 'nowrap',
            padding: '6px 12px',
            backgroundColor: darkMode ? '#8ab4f8' : '#bde2f7',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
          title={isAllBlocksVisible ? '전체 숨기기' : '전체 보이기'}
        >
          {visibleBlocks}/{totalBlocks}
        </span>
        <div style={{ width: '1px', height: '20px', backgroundColor: darkMode ? '#5f6368' : '#d1d5db' }} />
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
                  border: isHidden
                    ? (darkMode ? '1px dashed #5f6368' : '1px dashed #a0a0a0')
                    : (darkMode ? '1px solid #8ab4f8' : '1px solid #7cb9e8'),
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  backgroundColor: isHidden
                    ? (darkMode ? '#35363a' : '#f5f5f5')
                    : (darkMode ? '#292a2d' : '#e8f4fc'),
                  color: isHidden
                    ? (darkMode ? '#80868b' : '#888')
                    : (darkMode ? '#8ab4f8' : '#1a5276'),
                  fontStyle: 'normal',
                  opacity: 1,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  textDecoration: isHidden ? 'line-through' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{key || 'N/A'}</span>
                <span style={{
                  backgroundColor: isHidden
                    ? (darkMode ? '#5f6368' : '#d0d0d0')
                    : (darkMode ? '#8ab4f8' : '#5dade2'),
                  color: isHidden ? (darkMode ? '#9aa0a6' : '#666') : (darkMode ? '#202124' : '#fff'),
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
      padding: '4px 10px',
      fontSize: '13px',
      fontWeight: 600,
      border: active
        ? (darkMode ? '1px solid #8ab4f8' : '1px solid #7cb9e8')
        : (darkMode ? '1px dashed #5f6368' : '1px dashed #bbb'),
      borderRadius: '4px',
      cursor: 'pointer',
      backgroundColor: active
        ? (darkMode ? '#292a2d' : '#e8f4fc')
        : (darkMode ? '#35363a' : '#f8f8f8'),
      color: active
        ? (darkMode ? '#8ab4f8' : '#1a5276')
        : (darkMode ? '#80868b' : '#888'),
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      transition: 'all 0.15s ease'
    });

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        backgroundColor: darkMode ? '#202124' : '#f0f4f8',
        borderBottom: darkMode ? '1px solid #3c4043' : '1px solid #d0d7de',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        transition: 'background-color 0.3s, border-color 0.3s'
      }}>
        {/* T B N 버튼 */}
        <div style={{
          display: 'flex',
          gap: '3px',
          padding: '3px',
          backgroundColor: darkMode ? '#292a2d' : '#fff',
          borderRadius: '6px',
          border: darkMode ? '1px solid #3c4043' : '1px solid #d0d7de'
        }}>
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

        <div style={{ width: '1px', height: '24px', backgroundColor: darkMode ? '#5f6368' : '#c0c8d0' }} />

        {/* 페이지 내 검색 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: darkMode ? '#292a2d' : '#fff',
          borderRadius: '6px',
          border: darkMode ? '1px solid #3c4043' : '1px solid #d0d7de',
          padding: '2px'
        }}>
          <input
            type="text"
            placeholder="페이지 내 검색"
            value={pageSearchQuery}
            onChange={(e) => setPageSearchQuery(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') handlePageSearch(); }}
            style={{
              padding: '5px 10px',
              fontSize: '13px',
              border: 'none',
              borderRadius: '4px',
              width: '130px',
              backgroundColor: 'transparent',
              outline: 'none',
              color: darkMode ? '#e8eaed' : '#333',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          />
          {pageSearchQuery && (
            <button onClick={clearSearch} style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: darkMode ? '#9aa0a6' : '#999',
              padding: '2px 6px'
            }}>×</button>
          )}
          <button onClick={handlePageSearch} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: darkMode ? '#8ab4f8' : '#bde2f7',
            padding: '5px 8px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px'
          }}>🔍</button>
        </div>

        {searchResults.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '3px 6px',
            backgroundColor: darkMode ? '#292a2d' : '#fff',
            borderRadius: '6px',
            border: darkMode ? '1px solid #8ab4f8' : '1px solid #7cb9e8'
          }}>
            <button
              onClick={handlePrevSearch}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                border: 'none',
                borderRadius: '3px',
                backgroundColor: darkMode ? '#8ab4f8' : '#e8f4fc',
                color: darkMode ? '#202124' : '#1a5276',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >◀</button>
            <span style={{
              fontSize: '12px',
              color: darkMode ? '#8ab4f8' : '#1a5276',
              fontWeight: 600,
              padding: '0 6px',
              minWidth: '36px',
              textAlign: 'center',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>{currentSearchIndex + 1}/{searchResults.length}</span>
            <button
              onClick={handleNextSearch}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                border: 'none',
                borderRadius: '3px',
                backgroundColor: darkMode ? '#8ab4f8' : '#e8f4fc',
                color: darkMode ? '#202124' : '#1a5276',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >▶</button>
          </div>
        )}

        <div style={{ width: '1px', height: '24px', backgroundColor: darkMode ? '#5f6368' : '#c0c8d0' }} />

        {/* 셋블록 일괄변경 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px',
          backgroundColor: darkMode ? '#292a2d' : '#fff',
          borderRadius: '6px',
          border: darkMode ? '1px solid #3c4043' : '1px solid #d0d7de'
        }}>
          <span
            onClick={() => onSelectAll && onSelectAll(!isAllSelected)}
            style={{
              fontSize: '12px',
              color: visibleSelectedCount > 0
                ? (darkMode ? '#8ab4f8' : '#1a5276')
                : (darkMode ? '#80868b' : '#666'),
              fontWeight: 600,
              padding: '4px 8px',
              backgroundColor: visibleSelectedCount > 0
                ? (darkMode ? '#292a2d' : '#e8f4fc')
                : (darkMode ? '#35363a' : '#f5f5f5'),
              borderRadius: '4px',
              border: visibleSelectedCount > 0
                ? (darkMode ? '1px solid #8ab4f8' : '1px solid #7cb9e8')
                : (darkMode ? '1px dashed #5f6368' : '1px dashed #bbb'),
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
              padding: '5px 8px',
              fontSize: '13px',
              border: 'none',
              borderRadius: '4px',
              width: '70px',
              backgroundColor: 'transparent',
              color: darkMode ? '#e8eaed' : '#333',
              outline: 'none',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          />
          <button
            onClick={() => onChangeSetBlockAll && onChangeSetBlockAll(setBlockInput)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: darkMode ? '#81c995' : '#c2ffd1',
              padding: '5px 10px',
              borderRadius: '4px',
              border: darkMode ? '1px solid #81c995' : '1px solid #6fbf7b',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              color: darkMode ? '#202124' : '#2d6a3a'
            }}
          >적용</button>
        </div>
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
      color: darkMode ? '#e8eaed' : '#333',
      border: darkMode ? '1px solid #3c4043' : '1px solid #ddd',
      backgroundColor: darkMode ? '#35363a' : '#bde2f7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      transition: 'background-color 0.3s, border-color 0.3s, color 0.3s'
    };
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{
            backgroundColor: darkMode ? '#35363a' : '#bde2f7',
            boxShadow: darkMode ? '0px 2px 4px rgba(0, 0, 0, 0.4)' : '0px 2px 4px rgba(0, 0, 0, 0.25)'
          }}>
            <th style={{
              ...headerStyle,
              width: '110px',
              textAlign: 'left',
              whiteSpace: 'nowrap',
              borderRightStyle: 'double',
              borderRightWidth: 'medium'
            }}>
              <span style={{ fontWeight: 'bold' }}>{checkedCount}</span> / <span>{filteredData.length}</span>
              <button
                onClick={() => setCheckAllPopup(true)}
                style={{
                  marginLeft: '6px',
                  width: '16px',
                  height: '16px',
                  border: darkMode ? '2px solid #9aa0a6' : '2px solid #555',
                  borderRadius: '3px',
                  backgroundColor: checkedCount > 0 ? '#4CAF50' : (darkMode ? '#35363a' : 'white'),
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: 0,
                  verticalAlign: 'middle'
                }}
                title="전체 체크/해제 (숨김 제외)"
              >{checkedCount > 0 ? '✓' : ''}</button>
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
      style={{
        width: '100%',
        minWidth: '790px',
        backgroundColor: darkMode ? '#202124' : '#fff',
        transition: 'background-color 0.3s'
      }}
    >
      {renderSetBlockBar()}
      {renderExtraFeaturesBar()}
      {renderHeader()}

      <div
        ref={parentRef}
        style={{
          height: 'calc(100vh - 140px)',
          overflow: 'auto',
          width: '100%',
          backgroundColor: darkMode ? '#202124' : '#fff'
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
                onCheckChange={onCheckChange}
                onCircuitSelect={onCircuitSelect}
                onNodeClick={onNodeClick}
                onNodeCalcClick={handleNodeCalcClick}
                onCalcAll={handleCalcAll}
                onMemoPopoverOpen={handleMemoPopoverOpen}
                onSetBlockPopupOpen={handleSetBlockPopupOpen}
                onResetCalc={handleResetCalc}
                onResetAllCalc={handleResetAllCalc}
                measureElement={rowVirtualizer.measureElement}
                darkMode={darkMode}
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
        darkMode={darkMode}
      />

      {/* SetBlock 수정 팝업 */}
      {setBlockPopup.isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
              zIndex: 1000
            }}
            onClick={() => setSetBlockPopup({ isOpen: false, circuit: '', currentValue: '' })}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: darkMode ? '#292a2d' : 'white',
              borderRadius: '12px',
              boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.3)',
              border: darkMode ? '1px solid #3c4043' : 'none',
              zIndex: 1001,
              padding: '20px',
              minWidth: '300px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '14px', color: darkMode ? '#9aa0a6' : '#666', marginBottom: '8px' }}>
              SET Block 수정
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: darkMode ? '#e8eaed' : '#333' }}>
              {setBlockPopup.circuit}
            </div>
            <input
              type="text"
              defaultValue={setBlockPopup.currentValue}
              placeholder="새 SetBlock 값"
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: darkMode ? '1px solid #5f6368' : '2px solid #0ea5e9',
                borderRadius: '8px',
                backgroundColor: darkMode ? '#35363a' : '#fff',
                color: darkMode ? '#e8eaed' : '#333',
                outline: 'none',
                textAlign: 'center',
                marginBottom: '16px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onSetBlockChange && onSetBlockChange(setBlockPopup.circuit, e.target.value);
                  setSetBlockPopup({ isOpen: false, circuit: '', currentValue: '' });
                }
              }}
              id="setblock-popup-input"
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setSetBlockPopup({ isOpen: false, circuit: '', currentValue: '' })}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: darkMode ? '1px solid #5f6368' : '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: darkMode ? '#35363a' : '#f5f5f5',
                  color: darkMode ? '#9aa0a6' : '#666',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('setblock-popup-input');
                  if (input) {
                    onSetBlockChange && onSetBlockChange(setBlockPopup.circuit, input.value);
                    setSetBlockPopup({ isOpen: false, circuit: '', currentValue: '' });
                  }
                }}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: darkMode ? '#81c995' : '#4CAF50',
                  color: darkMode ? '#202124' : 'white',
                  cursor: 'pointer'
                }}
              >
                수정
              </button>
            </div>
          </div>
        </>
      )}

      {/* 전체 체크/해제 팝업 */}
      {checkAllPopup && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
              zIndex: 1000
            }}
            onClick={() => setCheckAllPopup(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: darkMode ? '#292a2d' : 'white',
              borderRadius: '12px',
              boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.3)',
              border: darkMode ? '1px solid #3c4043' : 'none',
              zIndex: 1001,
              padding: '20px',
              minWidth: '280px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: darkMode ? '#e8eaed' : '#333' }}>
              전체 체크/해제
            </div>
            <div style={{ fontSize: '13px', color: darkMode ? '#9aa0a6' : '#666', marginBottom: '20px' }}>
              숨김 처리된 항목은 제외됩니다
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  onCheckAll && onCheckAll(true);
                  setCheckAllPopup(false);
                }}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: darkMode ? '#81c995' : '#4CAF50',
                  color: darkMode ? '#202124' : 'white',
                  cursor: 'pointer'
                }}
              >
                전체 체크
              </button>
              <button
                onClick={() => {
                  onCheckAll && onCheckAll(false);
                  setCheckAllPopup(false);
                }}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: darkMode ? '#f28b82' : '#f44336',
                  color: darkMode ? '#202124' : 'white',
                  cursor: 'pointer'
                }}
              >
                전체 해제
              </button>
            </div>
            <button
              onClick={() => setCheckAllPopup(false)}
              style={{
                marginTop: '15px',
                padding: '8px 20px',
                fontSize: '13px',
                border: darkMode ? '1px solid #5f6368' : '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: darkMode ? '#35363a' : '#f5f5f5',
                color: darkMode ? '#9aa0a6' : '#666',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default DataTable;
