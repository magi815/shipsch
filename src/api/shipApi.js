import axios from 'axios';
import API_BASE_URL from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 선박(테이블) 목록 조회
export const getShips = async () => {
  const response = await api.get('/api/ships/');
  return response.data.ships || [];
};

// 특정 선박의 데이터 조회 (필터 포함)
export const getRows = async (shipNum, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.circuit) params.append('cir', filters.circuit);
  if (filters.node) params.append('node', filters.node);
  if (filters.cableType) params.append('type', filters.cableType);
  if (filters.setBlock) params.append('block', filters.setBlock);
  if (filters.memoOnly) params.append('memo_only', '1');
  const response = await api.get(`/api/${shipNum}/rows/?${params.toString()}`);
  return response.data;
};

// 메모 저장
export const saveMemo = async (shipNum, circuit, memo, imageFiles = []) => {
  const formData = new FormData();
  formData.append('circuit', circuit);
  formData.append('memo', memo);
  const now = new Date();
  const memodate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  formData.append('memodate', memodate);
  imageFiles.forEach(file => {
    formData.append('memo_images', file);
  });
  const response = await axios.post(`${API_BASE_URL}/${shipNum}/save_memo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// 메모 이미지 조회
export const getMemoImages = async (shipNum, circuit) => {
  const response = await axios.get(`${API_BASE_URL}/${shipNum}/get_memo_images?circuit=${encodeURIComponent(circuit)}`);
  return response.data;
};

// 메모 이미지 삭제
export const deleteMemoImage = async (shipNum, imageId) => {
  const formData = new FormData();
  formData.append('image_id', imageId);
  const response = await axios.post(`${API_BASE_URL}/${shipNum}/delete_memo_image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Set Block 일괄 수정
export const changeSetBlockAll = async (shipNum, circuits, blockNbr) => {
  const formData = new FormData();
  formData.append('circuit', circuits.join(','));
  formData.append('block_nbr', blockNbr);
  const response = await axios.post(`${API_BASE_URL}/${shipNum}/changesetblockall`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// 서킷 체크 상태 저장
export const saveChecked = async (shipNum, circuit, checked) => {
  const formData = new FormData();
  const circuitStr = Array.isArray(circuit) ? circuit.join(',') : circuit;
  formData.append('circuit', circuitStr);
  formData.append('checked', checked ? '1' : '0');
  const response = await axios.post(`${API_BASE_URL}/${shipNum}/update_checked`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// 전체 서킷 체크 상태 일괄 변경
export const saveCheckedAll = async (shipNum, circuits, checked) => {
  const formData = new FormData();
  formData.append('circuit', circuits.join(','));
  formData.append('checked', checked ? '1' : '0');
  const response = await axios.post(`${API_BASE_URL}/${shipNum}/update_checked`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export default api;
