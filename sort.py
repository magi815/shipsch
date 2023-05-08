import pandas as pd




def sort_dataframe_by_reference(df, reference_set):

    reference_list = reference_set.split()

    # 'Node' 열의 값을 문자열로 변환
    df['Node'] = df['Node'].astype(str)

    def count_reference_chars(node_path):
        count = sum([1 for char in reference_list if char in node_path])
        return count if count > 0 else None

    # 노드 경로에서 기준값 개수 계산 및 정렬 기준 생성
    df['count'] = df['Node'].apply(count_reference_chars)
    df['first_reference_char'] = df['Node'].apply(lambda x: [c for c in reference_list if c in x][0] if any(c in x for c in reference_list) else '')
    df['last_reference_char'] = df['Node'].apply(lambda x: [c for c in reference_list if c in x][-1] if any(c in x for c in reference_list) else '')

    # 정렬 기준에 따라 데이터 정렬
    sorted_df = df.sort_values(by=['last_reference_char', 'count'], ascending=[False, False], key=lambda x: x.map({k: i for i, k in enumerate(reference_list)}))

    return sorted_df

# 사용 예시
file_path = 'test.xlsx'
df = pd.read_excel(file_path)
reference_set = "E2FS0001 E2FS0002 E2JBJ017 E2FP0022 E2FP0023 E2FP0020 E2FP0021 E2FP0103 E2FP0024 E2FP0105 E2FP0106 E2FP0104 E2FP0100 E2FP0018 E2FP025D"

sorted_df = sort_dataframe_by_reference(df, reference_set)

# 정렬된 데이터프레임을 엑셀 파일로 저장
#sorted_df.to_excel('sorted_test.xlsx', index=False)\
#print(sorted_df)
all_reference_chars = sorted_df['first_reference_char'].tolist() + sorted_df['last_reference_char'].tolist()
unique_reference_chars = list(set(char for char in all_reference_chars if char != ''))

print(unique_reference_chars)

def find_nodes_with_string(node_column, circuit_column, search_string, reference_set):
    # 결측값 처리
    node_column = node_column.dropna()
    
    # search_string을 포함하는 값 찾기
    matching_rows = node_column[node_column.str.contains(r'\b{}\b'.format(search_string))]
    
    max_length = 0
    longest_filtered_result = []
    
    # 결과 출력
    for index, node in matching_rows.items():
        result = []
        nodes = node.split()
        for i, n in enumerate(nodes):
            if search_string == n:                
                if i > 0 and nodes[i - 1] in reference_set:
                    if i < len(nodes) - 1 and nodes[i + 1] not in reference_set:
                        result.extend(nodes[(i+1):])
                    
                if i < len(nodes) - 1 and nodes[i + 1] in reference_set:
                    if i > 0 and nodes[i - 1] not in reference_set:
                        result.extend(nodes[:i])
            #print(f"Circuit: {circuit_column.loc[i]}, Result: {result}")

        # search_string의 첫 두 글자와 같은 값만 출력
        filtered_result = [item for item in result if item.startswith(search_string[:2])]

        # 가장 길이가 긴 값 찾기
        if len(filtered_result) > max_length:
            max_length = len(filtered_result)
            longest_filtered_result = filtered_result
    
    return longest_filtered_result


def sort_dataframe_by_reference(df, reference_set):

    reference_list = reference_set.split()

    # 'Node' 열의 값을 문자열로 변환
    df['Node'] = df['Node'].astype(str)

    def count_reference_chars(node_path):
        return sum([1 for char in reference_list if char in node_path])

    # 노드 경로에서 기준값 개수 계산 및 정렬 기준 생성
    df['count'] = df['Node'].apply(count_reference_chars)
    df['first_reference_char'] = df['Node'].apply(lambda x: [c for c in reference_list if c in x][0] if any(c in x for c in reference_list) else '')
    df['last_reference_char'] = df['Node'].apply(lambda x: [c for c in reference_list if c in x][-1] if any(c in x for c in reference_list) else '')

    # 정렬 기준에 따라 데이터 정렬
    sorted_df = df.sort_values(by=['last_reference_char', 'count'], ascending=[False, False], key=lambda x: x.map({k: i for i, k in enumerate(reference_list)}))

    return sorted_df




def sort_dataframe(df, reference_set, start):
    reference_list = reference_set.split()

    # 'Node' 열의 값을 문자열로 변환
    df['Node'] = df['Node'].astype(str)

    def count_reference_chars(node_path):
        count = sum([1 for char in reference_list if char in node_path])
        return count if count > 0 else None

    # 노드 경로에서 기준값 개수 계산 및 정렬 기준 생성
    df[start] = df['Node'].apply(count_reference_chars)    
    df[start+'_s'] = df['Node'].apply(lambda x: [c for c in reference_list if c in x][0] if any(c in x for c in reference_list) else '')
    df[start+'_t'] = df['Node'].apply(lambda x: [c for c in reference_list if c in x][-1] if any(c in x for c in reference_list) else '')

    # 정렬 기준에 따라 데이터 정렬
    sorted_df = df.sort_values(by=[start+'_t', start], ascending=[False, False], key=lambda x: x.map({k: i for i, k in enumerate(reference_list)}))

    return sorted_df

#a = "E3FS2050"
#print(a)

#longest_result = find_nodes_with_string(df['Node'], df['Circuit'], a, reference_set)
#longest_result_string = ' '.join(longest_result)
#print(longest_result)

#sort = sort_dataframe(sorted_df, longest_result_string,a)
#print(sort)



print(unique_reference_chars)
for a in unique_reference_chars:

    longest_result = find_nodes_with_string(df['Node'], df['Circuit'], a, reference_set)
    longest_result_string = ' '.join(longest_result)
    sorted_df = sort_dataframe(sorted_df, longest_result_string,a)

sorted_df = sorted_df.sort_values(by=['last_reference_char', 'count'], ascending=[False, False], key=lambda x: x.map({k: i for i, k in enumerate(reference_set.split())}))
sorted_df.to_excel('sort.xlsx', index=False)