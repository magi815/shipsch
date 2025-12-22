import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShips, getRows, saveMemo, saveChecked, saveCheckedAll, changeSetBlockAll } from '../api/shipApi';

// 선박 목록 조회 훅
export const useShips = () => {
  return useQuery({
    queryKey: ['ships'],
    queryFn: getShips,
    staleTime: 1000 * 60 * 30, // 30분간 캐시 유지
    cacheTime: 1000 * 60 * 60, // 1시간 캐시
  });
};

// 특정 선박의 데이터 조회 훅
export const useRows = (shipNum, filters = {}) => {
  return useQuery({
    queryKey: ['rows', shipNum, filters],
    queryFn: () => getRows(shipNum, filters),
    enabled: !!shipNum,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    select: (data) => data.rows || [],
  });
};

// 메모 저장 mutation 훅
export const useSaveMemo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shipNum, circuit, memo, imageFiles }) =>
      saveMemo(shipNum, circuit, memo, imageFiles),
    onMutate: async ({ shipNum, circuit, memo }) => {
      // 낙관적 업데이트: 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['rows', shipNum] });

      // 이전 데이터 스냅샷
      const previousData = queryClient.getQueriesData({ queryKey: ['rows', shipNum] });

      // 현재 시간 생성
      const now = new Date();
      const memodate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      // 낙관적 업데이트 적용
      queryClient.setQueriesData({ queryKey: ['rows', shipNum] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          rows: old.rows?.map(row =>
            row.Circuit === circuit ? { ...row, memo, memodate } : row
          )
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // 에러 시 롤백
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (data, error, { shipNum }) => {
      // 성공/실패 후 데이터 재검증
      queryClient.invalidateQueries({ queryKey: ['rows', shipNum] });
    },
  });
};

// 체크 상태 저장 mutation 훅
export const useSaveChecked = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shipNum, circuit, checked }) =>
      saveChecked(shipNum, circuit, checked),
    onMutate: async ({ shipNum, circuit, checked }) => {
      await queryClient.cancelQueries({ queryKey: ['rows', shipNum] });

      const previousData = queryClient.getQueriesData({ queryKey: ['rows', shipNum] });

      // 낙관적 업데이트
      queryClient.setQueriesData({ queryKey: ['rows', shipNum] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          rows: old.rows?.map(row =>
            row.Circuit === circuit ? { ...row, checked: checked ? 1 : 0 } : row
          )
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
};

// 전체 체크 상태 저장 mutation 훅
export const useSaveCheckedAll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shipNum, circuits, checked }) =>
      saveCheckedAll(shipNum, circuits, checked),
    onMutate: async ({ shipNum, circuits, checked }) => {
      await queryClient.cancelQueries({ queryKey: ['rows', shipNum] });

      const previousData = queryClient.getQueriesData({ queryKey: ['rows', shipNum] });

      // 낙관적 업데이트
      queryClient.setQueriesData({ queryKey: ['rows', shipNum] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          rows: old.rows?.map(row =>
            circuits.includes(row.Circuit) ? { ...row, checked: checked ? 1 : 0 } : row
          )
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
};

// SetBlock 일괄 변경 mutation 훅
export const useChangeSetBlockAll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shipNum, circuits, blockNbr }) =>
      changeSetBlockAll(shipNum, circuits, blockNbr),
    onMutate: async ({ shipNum, circuits, blockNbr }) => {
      await queryClient.cancelQueries({ queryKey: ['rows', shipNum] });

      const previousData = queryClient.getQueriesData({ queryKey: ['rows', shipNum] });

      // 낙관적 업데이트
      queryClient.setQueriesData({ queryKey: ['rows', shipNum] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          rows: old.rows?.map(row =>
            circuits.includes(row.Circuit) ? { ...row, 'SET Block': blockNbr } : row
          )
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (data, error, { shipNum }) => {
      queryClient.invalidateQueries({ queryKey: ['rows', shipNum] });
    },
  });
};
