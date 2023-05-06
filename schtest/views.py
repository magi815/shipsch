from django.shortcuts import render
import pandas as pd
from collections import Counter

global df
global shipnum
df = ""
shipnum = 0

def main(request):
    return render(request, 'test_mainpage.html')


def index(request,num):
    # 엑셀 파일 불러오기
    global shipnum
    shipnum = num
    global df
    df = pd.read_csv('sch/3290.csv', encoding='cp949', lineterminator='\r')


    
    df = df.rename(columns={'Cable Type': 'CableType'})
    df = df.rename(columns={'From Length': 'FromLength'})
    df = df.rename(columns={'From Equipment': 'FromEquipment'})
    df = df.rename(columns={'To Equipment': 'ToEquipment'})
    df = df.rename(columns={'To Length': 'ToLength'})
    df = df.rename(columns={'Node PATH': 'NodePATH'})
    df = df.rename(columns={'Block PATH': 'BlockPATH'})
    df = df.rename(columns={'SET Block': 'SETBlock'})

    # 'NodePATH' 값이 없는 행을 찾습니다.
    mask = df['NodePATH'].isna()

    # 'NodePATH' 값이 없는 행의 'From장비Tag', 'To장비Tag', 'Circuit' 값을 가져옵니다.
    missing_values = df.loc[mask, ['From장비Tag', 'To장비Tag', 'Circuit','NodePATH']]

    # 'From장비Tag' 또는 'To장비Tag' 값과 같은 'Circuit'을 가진 행을 찾습니다.
    for index, row in missing_values.iterrows():
        mask = (df['From장비Tag'] == row['From장비Tag']) | (df['To장비Tag'] == row['To장비Tag']) | (df['From장비Tag'] == row['To장비Tag']) | (df['To장비Tag'] == row['From장비Tag']) & len(str(row['NodePATH']))>0
        circuit_value = df.loc[mask, 'Circuit'].values
        nodepath_value = df.loc[mask, 'NodePATH'].values

        # 찾은 값이 있으면 'NodePATH' 값을 업데이트합니다.
        if len(nodepath_value) > 0:
            a = str(nodepath_value[0]).split(' ')
            filtered_a = [x for x in a if x not in [None, '', 'nan']]
            if len(filtered_a) > 0:
                #df.at[index, 'NodePATH'] = nodepath_value[0]
                if (df.loc[mask, 'From장비Tag'].values[0] == row['From장비Tag']) or (df.loc[mask, 'From장비Tag'].values[0] == row['To장비Tag']):
                    df.at[index, 'CheckNode'] = circuit_value[0] + " " +filtered_a[0]
                elif (df.loc[mask, 'To장비Tag'].values[0] == row['From장비Tag']) or (df.loc[mask, 'To장비Tag'].values[0] == row['To장비Tag']):
                    df.at[index, 'CheckNode'] = circuit_value[0] + " " +filtered_a[len(filtered_a)-1]
                #print(filtered_a,len(filtered_a))
    for index, row in df.iterrows():
        if pd.isna(row['NodePATH']):
            check_node_value = row['CheckNode']
            if not pd.isna(check_node_value):
                df.at[index, 'NodePATH'] = check_node_value

    context = {'shipnum':shipnum}
    return render(request, 'test_template.html', context)
     
def filter(request):
    # 입력값 처리
    global df
    #query = request.GET.get('q')
    cir = request.GET.get('cir','') 
    cir = cir.strip()
    node = request.GET.get('node','') 
    node = node.strip()
    type = request.GET.get('type','') 
    type = type.strip()
    df2 = df
    if cir != '':
    # Circuit 값이 있는 경우
        df2 = df2[(df2['Circuit'].str.contains(cir, case=False, na=False)) | (df2['NodePATH'].str.contains(cir, case=False, na=False))]
        if node != '':
            # Circuit 값과 NodePATH 값이 모두 있는 경우
            df2 = df2[df2['NodePATH'].str.contains(node, case=False, na=False)]
            if type != '':
                # Circuit 값, NodePATH 값, Type 값이 모두 있는 경우
                df2 = df2[df2['CableType'].str.contains(type, case=False, na=False)]
        elif type != '':
            # Circuit 값과 Type 값이 있는 경우
            df2 = df2[df2['CableType'].str.contains(type, case=False, na=False)]
    else:
        if node != '':
            # Circuit 값이 없고 NodePATH 값이 있는 경우
            df2 = df2[df2['NodePATH'].str.contains(node, case=False, na=False)]
            if type != '':
                # Circuit 값이 없고 NodePATH 값과 Type 값이 있는 경우
                df2 = df2[df2['CableType'].str.contains(type, case=False, na=False)]
        elif type != '':
            # Circuit 값이 없고 Type 값이 있는 경우
            df2 = df2[df2['CableType'].str.contains(type, case=False, na=False)]
        else :
            df2 = pd.DataFrame([])

    df2 = df2.reset_index(drop=True)
    sbs = sorted(list(set(df2['SETBlock'].tolist())))
    sbs_count = {}
    for sb in sbs:
        count = df2[df2['SETBlock'] == sb].shape[0]
        sbs_count[sb] = count
    print(sbs_count)
    #print(df_filtered2)
    #print (df_filtered2.loc[5,'NodePATH'])
    context = {'data': df2,'len':len(df2),'cir':cir,'node':node,'type':type, 'shipnum':shipnum,'sbs':sbs,sbs_count:'sbs_count'}
    return render(request, 'test_template.html', context)
