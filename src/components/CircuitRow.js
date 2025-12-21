import React, { memo, useRef, useMemo } from 'react';

const CircuitRow = memo(function CircuitRow({
  row,
  virtualRow,
  tbnState,
  extraFeaturesVisible,
  isHighlighted,
  isSelected,
  circuitSelectedNodes,
  circuitCalcResult,
  activeSetBlockCircuit,
  onCheckChange,
  onCircuitSelect,
  onSetBlockChange,
  onNodeClick,
  onNodeCalcClick,
  onCalcAll,
  onMemoPopoverOpen,
  onSetActiveSetBlockCircuit,
  onResetCalc,
  onResetAllCalc,
  measureElement
}) {
  const longPressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);

  const circuit = row.Circuit || '';
  const hasMemo = row.memo && row.memo.trim().length > 0;
  const isChecked = row.checked === 1;

  const cableType = row['Cable Type'] || '';
  const setBlock = row['SET Block'] || '';
  const totalLength = row['길이'] || '';
  const fromLength = row.reverse === 1 ? (row['To Length'] || '') : (row['From Length'] || '');
  const toLength = row.reverse === 1 ? (row['From Length'] || '') : (row['To Length'] || '');
  const fromEquip = row.reverse === 1 ? (row['To Equipment'] || '') : (row['From Equipment'] || '');
  const toEquip = row.reverse === 1 ? (row['From Equipment'] || '') : (row['To Equipment'] || '');
  const blockPath = row.list_BlockPATH || row['Block PATH'] || '';
  const nodePath = row.list_node || row['Node PATH'] || '';
  const memoText = row.memo || '';
  const 가닥수 = row['가닥수'] || 1;
  const lengthNode = row['길이Node'] || '';

  const showType = tbnState?.showType !== false;
  const showBlock = tbnState?.showBlock !== false;
  const showNode = tbnState?.showNode !== false;

  // 실제로 표시되는 행 수 계산 (Circuit 셀의 rowSpan용)
  const rowSpanCount = useMemo(() => {
    let count = 0;
    if (showType) count++;
    if (hasMemo) count++;
    if (showBlock) count++;
    if (showNode) count++;
    return count > 0 ? count : 1;
  }, [showType, showBlock, showNode, hasMemo]);

  // 첫 번째로 표시되는 TR 결정 (Circuit 셀을 여기에 배치)
  const firstVisibleRow = useMemo(() => {
    if (showType) return 'type';
    if (hasMemo) return 'memo';
    if (showBlock) return 'block';
    if (showNode) return 'node';
    return 'none';
  }, [showType, showBlock, showNode, hasMemo]);

  // Django 스타일 컬러 팔레트
  const circuitBgColor = 'transparent';
  const rowBgColor = isHighlighted ? '#fffde7' : isSelected ? '#e3f2fd' : '#ffffff';
  const cellStyle = {
    padding: '5px 8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    color: '#333',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  // Circuit 버튼 렌더링 - Django 스타일 (#c2ffd1 민트)
  const renderCircuitCell = () => (
    <td rowSpan={rowSpanCount} style={{
      ...cellStyle,
      width: '110px',
      verticalAlign: 'middle',
      backgroundColor: circuitBgColor,
      fontWeight: 'bold',
      textAlign: 'center',
      borderRightStyle: 'double',
      borderRightWidth: 'medium'
    }}>
      <button
        onClick={() => onCheckChange && onCheckChange(circuit, !isChecked)}
        style={{
          whiteSpace: 'normal',
          border: 'none',
          display: 'inline-block',
          padding: '8px 8px',
          borderRadius: '8px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          textAlign: 'center',
          backgroundColor: isChecked ? 'yellow' : '#f0f0f0',
          color: '#333',
          width: '100%',
          wordBreak: 'break-all',
          transition: '0.25s',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        {circuit}
      </button>
    </td>
  );

  return (
    <div
      key={virtualRow.key}
      data-index={virtualRow.index}
      ref={measureElement}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${virtualRow.start}px)`,
        backgroundColor: rowBgColor
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          {/* TR1: Type 행 */}
          {showType && (
            <tr>
              {firstVisibleRow === 'type' && renderCircuitCell()}
              <td style={{ ...cellStyle, width: '100px', whiteSpace: 'nowrap', paddingLeft: '4px' }}>
                <button
                  onClick={() => onMemoPopoverOpen(circuit, memoText, row.memodate || '')}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '2px'
                  }}
                >
                  <span style={{ color: hasMemo ? '#ef4444' : '#9ca3af' }}>✏️</span>
                </button>
                <span style={{ fontWeight: 600, color: '#111827' }}>{cableType}</span>
                {가닥수 > 1 && <b style={{ color: '#ef4444', fontWeight: 700 }}> x{가닥수}</b>}
              </td>
              <td style={{ ...cellStyle, width: '40px', textAlign: 'center', fontWeight: 700, color: '#111827', fontSize: '11px' }}>
                {totalLength}
              </td>
              <td style={{ ...cellStyle, width: '30px', textAlign: 'center' }}>{fromLength}</td>
              <td style={{ ...cellStyle, textAlign: 'left', fontSize: '12px' }}>{fromEquip}</td>
              <td style={{ ...cellStyle, textAlign: 'right', fontSize: '12px' }}>{toEquip}</td>
              <td style={{ ...cellStyle, width: '30px', textAlign: 'left' }}>{toLength}</td>
            </tr>
          )}

          {/* TR2: 메모 행 - Type이 숨겨지고 메모가 있으면 메모가 첫 번째 행이 됨 */}
          {hasMemo && (
            <tr>
              {/* 메모가 첫 번째 표시되는 행인 경우 Circuit 셀 렌더링 */}
              {firstVisibleRow === 'memo' && renderCircuitCell()}
              <td colSpan={6} style={{
                ...cellStyle,
                color: '#c62828',
                fontWeight: 500,
                backgroundColor: '#ffebee',
                borderLeft: '3px solid #ef5350'
              }}>
                {memoText.startsWith('@') ? `@ ${memoText.slice(1)}` : memoText}
              </td>
            </tr>
          )}

          {/* TR3: SetBlock + BlockPATH */}
          {showBlock && (
            <tr>
              {firstVisibleRow === 'block' && renderCircuitCell()}
              <td colSpan={6} style={{ ...cellStyle, textAlign: 'left' }}>
                {extraFeaturesVisible && (
                  <input
                    type="checkbox"
                    checked={isSelected || false}
                    onChange={(e) => onCircuitSelect && onCircuitSelect(circuit, e.target.checked)}
                    style={{ marginRight: '6px', cursor: 'pointer' }}
                  />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetActiveSetBlockCircuit(activeSetBlockCircuit === circuit ? null : circuit);
                  }}
                  style={{
                    cursor: 'pointer',
                    marginRight: '6px',
                    padding: '4px 7px',
                    backgroundColor: 'rgba(255, 0, 205, 0.17)',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.15s ease',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  {setBlock || '-'}
                </button>
                {activeSetBlockCircuit === circuit && (
                  <span style={{ marginRight: '8px' }}>
                    <input
                      type="text"
                      defaultValue={setBlock}
                      placeholder="새 값"
                      style={{ width: '60px', padding: '2px 4px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          onSetBlockChange && onSetBlockChange(circuit, e.target.value);
                          onSetActiveSetBlockCircuit(null);
                        }
                      }}
                      id={`setblock-input-${circuit}`}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById(`setblock-input-${circuit}`);
                        if (input) {
                          onSetBlockChange && onSetBlockChange(circuit, input.value);
                          onSetActiveSetBlockCircuit(null);
                        }
                      }}
                      style={{ marginLeft: '4px', padding: '2px 6px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    >✓ 수정</button>
                  </span>
                )}
                <span>{blockPath}</span>
              </td>
            </tr>
          )}

          {/* TR4: NodePATH */}
          {showNode && (
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              {firstVisibleRow === 'node' && renderCircuitCell()}
              <td colSpan={6} style={{
                ...cellStyle,
                fontWeight: 500,
                backgroundColor: isChecked ? '#fffde7' : 'transparent'
              }}>
                {circuitCalcResult ? (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <button
                      onMouseDown={() => {
                        isLongPressRef.current = false;
                        longPressTimerRef.current = setTimeout(() => {
                          isLongPressRef.current = true;
                          onResetAllCalc();
                        }, 500);
                      }}
                      onMouseUp={() => {
                        clearTimeout(longPressTimerRef.current);
                        if (!isLongPressRef.current) {
                          onResetCalc(circuit);
                        }
                      }}
                      onMouseLeave={() => clearTimeout(longPressTimerRef.current)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px 6px',
                        fontSize: '13px',
                        backgroundColor: '#f9fafb',
                        color: '#6b7280',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        marginRight: '8px'
                      }}
                      title="클릭: 초기화 / 길게 클릭: 전체 초기화"
                    >↩</button>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>{circuitCalcResult.fr}</span>
                    <span style={{ padding: '2px 4px', backgroundColor: 'blue', color: 'white', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>{circuitCalcResult.node1}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>{circuitCalcResult.ct}</span>
                    <span style={{ padding: '2px 4px', backgroundColor: 'red', color: 'white', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>{circuitCalcResult.node2}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>{circuitCalcResult.to}</span>
                    <button
                      onClick={() => onCalcAll(circuitCalcResult.node1, circuitCalcResult.node2)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 6px',
                        fontSize: '14px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginLeft: '8px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                      title="동일 노드 포함 서킷 모두 계산"
                    >all</button>
                  </div>
                ) : (
                  <>
                    {nodePath.split(/[\s]+/).filter(n => n).map((node, i, arr) => {
                      const nodeText = node.trim();
                      const isFirstSelected = circuitSelectedNodes[0] === nodeText;
                      const isSecondSelected = circuitSelectedNodes[1] === nodeText;
                      const endsWithAlpha = /[A-Za-z]$/.test(nodeText);
                      const containsJB = nodeText.includes('JB');

                      let nodeBgColor = 'transparent';
                      let nodeTextColor = 'inherit';

                      if (isFirstSelected) {
                        nodeBgColor = 'blue';
                        nodeTextColor = 'white';
                      } else if (isSecondSelected) {
                        nodeBgColor = 'red';
                        nodeTextColor = 'white';
                      } else if (containsJB) {
                        nodeBgColor = '#d2fdd8';
                        nodeTextColor = '#333';
                      } else if (endsWithAlpha) {
                        nodeBgColor = 'rgba(233, 231, 255, 0.48)';
                        nodeTextColor = '#333';
                      }

                      return (
                        <span key={i}>
                          <button
                            onMouseDown={() => {
                              isLongPressRef.current = false;
                              longPressTimerRef.current = setTimeout(() => {
                                isLongPressRef.current = true;
                                onNodeClick && onNodeClick(nodeText);
                              }, 500);
                            }}
                            onMouseUp={() => {
                              clearTimeout(longPressTimerRef.current);
                              if (!isLongPressRef.current) {
                                onNodeCalcClick(circuit, nodeText, lengthNode);
                              }
                            }}
                            onMouseLeave={() => clearTimeout(longPressTimerRef.current)}
                            onTouchStart={() => {
                              isLongPressRef.current = false;
                              longPressTimerRef.current = setTimeout(() => {
                                isLongPressRef.current = true;
                                onNodeClick && onNodeClick(nodeText);
                              }, 500);
                            }}
                            onTouchEnd={() => {
                              clearTimeout(longPressTimerRef.current);
                              if (!isLongPressRef.current) {
                                onNodeCalcClick(circuit, nodeText, lengthNode);
                              }
                            }}
                            style={{
                              backgroundColor: nodeBgColor,
                              color: nodeTextColor,
                              border: 'none',
                              borderRadius: '4px',
                              padding: '2px 4px',
                              fontSize: '14px',
                              fontWeight: (isFirstSelected || isSecondSelected || containsJB || endsWithAlpha) ? 'bold' : 'normal',
                              cursor: 'pointer',
                              marginBottom: '3px',
                              boxShadow: containsJB ? '0px 0px 5px 5px rgba(67, 255, 83, 0.377)' : 'none'
                            }}
                          >
                            {nodeText}
                          </button>
                          {i < arr.length - 1 && <span> </span>}
                        </span>
                      );
                    })}
                  </>
                )}
              </td>
            </tr>
          )}

          {/* T, B, N 모두 꺼져있고 메모도 없을 때 Circuit만 표시 */}
          {!showType && !showBlock && !showNode && !hasMemo && (
            <tr>
              {renderCircuitCell()}
              <td colSpan={6} style={{ ...cellStyle, backgroundColor: '#fafafa' }}></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}, (prevProps, nextProps) => {
  // 성능 최적화: 관련된 props만 비교
  return (
    prevProps.row === nextProps.row &&
    prevProps.virtualRow.start === nextProps.virtualRow.start &&
    prevProps.virtualRow.index === nextProps.virtualRow.index &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.activeSetBlockCircuit === nextProps.activeSetBlockCircuit &&
    prevProps.tbnState === nextProps.tbnState &&
    prevProps.extraFeaturesVisible === nextProps.extraFeaturesVisible &&
    prevProps.circuitSelectedNodes === nextProps.circuitSelectedNodes &&
    prevProps.circuitCalcResult === nextProps.circuitCalcResult
  );
});

export default CircuitRow;
