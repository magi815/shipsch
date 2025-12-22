import React, { useState, useRef, useEffect } from 'react';

function Header({ ships, currentShip, onShipChange, filters, onFilter, onReset, extraFeaturesVisible, onToggleExtraFeatures, darkMode, onToggleDarkMode }) {
  const [localFilters, setLocalFilters] = useState({
    circuit: '',
    node: '',
    cableType: '',
    setBlock: '',
  });
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onFilter(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({ circuit: '', node: '', cableType: '', setBlock: '' });
    onReset();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSubmit(e);
  };

  const getActiveFilters = () => {
    const active = [];
    if (filters?.circuit) active.push({ key: 'circuit', label: 'Circuit', value: filters.circuit });
    if (filters?.node) active.push({ key: 'node', label: 'Node', value: filters.node });
    if (filters?.cableType) active.push({ key: 'cableType', label: 'Type', value: filters.cableType });
    if (filters?.setBlock) active.push({ key: 'setBlock', label: 'Block', value: filters.setBlock });
    if (filters?.memoOnly) active.push({ key: 'memoOnly', label: '메모만', value: '' });
    return active;
  };

  const activeFilters = getActiveFilters();

  const handleRemoveFilter = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFilter(newFilters);
    setLocalFilters(prev => ({ ...prev, [key]: '' }));
  };

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: darkMode ? '#202124' : 'white',
      borderBottom: darkMode ? '1px solid #3c4043' : '1px solid #e5e7eb',
      padding: '8px 0',
      minWidth: '790px',
      transition: 'background-color 0.3s, border-color 0.3s'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 10px',
        minWidth: '770px'
      }}>
        <select
          value={currentShip || ''}
          onChange={(e) => onShipChange(e.target.value)}
          style={{
            padding: '8px 32px 8px 12px',
            fontSize: '15px',
            fontWeight: 600,
            border: darkMode ? '1px solid #5f6368' : '2px solid #0ea5e9',
            borderRadius: '8px',
            backgroundColor: darkMode ? '#292a2d' : '#f0f9ff',
            color: darkMode ? '#8ab4f8' : '#0369a1',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${darkMode ? '%238ab4f8' : '%230369a1'}' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            minWidth: '90px'
          }}
        >
          {ships.map((ship) => (
            <option key={ship} value={ship}>{ship}</option>
          ))}
        </select>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: darkMode ? '#292a2d' : '#f9fafb',
          borderRadius: '8px',
          padding: '4px 8px',
          border: darkMode ? '1px solid #3c4043' : '1px solid #e5e7eb',
          minWidth: 0
        }}>
          {['circuit', 'node', 'cableType', 'setBlock'].map((field) => (
            <input
              key={field}
              type="search"
              name={field}
              placeholder={field === 'cableType' ? 'Type' : field === 'setBlock' ? 'Block' : field.charAt(0).toUpperCase() + field.slice(1)}
              value={localFilters[field]}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              style={{
                flex: 1,
                minWidth: '60px',
                padding: '6px 10px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: darkMode ? '#35363a' : 'white',
                color: darkMode ? '#e8eaed' : '#333',
                outline: 'none'
              }}
            />
          ))}
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              padding: '6px 12px',
              backgroundColor: darkMode ? '#8ab4f8' : '#0ea5e9',
              color: darkMode ? '#202124' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            <span>🔍</span>
          </button>
        </div>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            style={{
              width: '36px',
              height: '36px',
              border: darkMode ? '1px solid #3c4043' : '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: darkMode ? '#292a2d' : 'white',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: darkMode ? '#9aa0a6' : '#6b7280'
            }}
          >
            ⋮
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              backgroundColor: darkMode ? '#292a2d' : 'white',
              borderRadius: '8px',
              boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.15)',
              border: darkMode ? '1px solid #3c4043' : '1px solid #e5e7eb',
              minWidth: '180px',
              zIndex: 2000,
              overflow: 'hidden'
            }}>
              {[
                { label: darkMode ? '☀️ 라이트 모드' : '🌙 다크 모드', action: () => onToggleDarkMode && onToggleDarkMode() },
                { label: '📝 메모 목록', action: () => onFilter({ ...localFilters, memoOnly: true }) },
                { label: extraFeaturesVisible ? '🔽 추가 기능 숨기기' : '🔼 추가 기능 보이기', action: () => onToggleExtraFeatures && onToggleExtraFeatures() },
                { label: '⚙️ 노드 데이터 관리', action: () => window.open('https://magi815.pythonanywhere.com/node_manage/', '_blank') },
                { label: '➕ 새로운 DB 추가', action: () => window.open('https://magi815.pythonanywhere.com/createtable/', '_blank') },
                { label: '📱 Android App 다운로드', action: () => window.location.href = 'https://magi815.pythonanywhere.com/download_apk/' }
              ].map(({ label, action }, idx) => (
                <button
                  key={idx}
                  onClick={() => { action(); setShowMenu(false); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: darkMode ? '#e8eaed' : '#374151',
                    borderBottom: idx < 5 ? (darkMode ? '1px solid #3c4043' : '1px solid #f3f4f6') : 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = darkMode ? '#35363a' : '#f9fafb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '8px',
          flexWrap: 'wrap',
          padding: '0 10px',
          minWidth: '770px'
        }}>
          <span style={{ fontSize: '11px', color: darkMode ? '#9aa0a6' : '#9ca3af', marginRight: '4px' }}>필터:</span>
          {activeFilters.map(({ key, label, value }) => (
            <span
              key={key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px 2px 8px',
                backgroundColor: darkMode ? '#35363a' : '#fef3c7',
                color: darkMode ? '#fdd663' : '#92400e',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 500
              }}
            >
              <span style={{ color: darkMode ? '#fdd663' : '#d97706' }}>{label}:</span>
              {value && <span>{value}</span>}
              <button
                onClick={() => handleRemoveFilter(key)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: darkMode ? '#fdd663' : '#b45309',
                  cursor: 'pointer',
                  padding: '0 2px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  lineHeight: 1,
                  marginLeft: '2px'
                }}
              >
                ×
              </button>
            </span>
          ))}
          <button
            onClick={handleReset}
            style={{
              padding: '2px 8px',
              backgroundColor: darkMode ? '#5c2626' : '#fee2e2',
              color: darkMode ? '#f28b82' : '#dc2626',
              border: 'none',
              borderRadius: '12px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            ✕ 초기화
          </button>
        </div>
      )}
    </div>
  );
}

export default Header;
