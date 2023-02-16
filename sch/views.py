from django.shortcuts import render
import pandas as pd
global df
df = ""

def index(request):
    # 엑셀 파일 불러오기
    global df
    df = pd.read_excel('sch/3290.xlsx', sheet_name='원본')
    df = df.rename(columns={'Cable Type': 'CableType'})
    df = df.rename(columns={'From Length': 'FromLength'})
    df = df.rename(columns={'From Equipment': 'FromEquipment'})
    df = df.rename(columns={'To Equipment': 'ToEquipment'})
    df = df.rename(columns={'To Length': 'ToLength'})
    df = df.rename(columns={'Node PATH': 'NodePATH'})
    df = df.rename(columns={'Block PATH': 'BlockPATH'})
    df2 = pd.read_excel('sch/3290.xlsx', sheet_name='길이원본')
    #print('11',df2.loc[df2['Circuit'] == 'P-WD-1K', '길이Node'])

    df = pd.merge(df, df2[['Circuit', '길이Node']], on='Circuit', how='left')
    df['길이Node'] = df['길이Node'].fillna("")
    
    #print('22',df.loc[df['Circuit'] == 'P-WD-1K', '길이Node'])

    return render(request, 'my_template.html')
def filter(request):
    # 입력값 처리
    global df
    #query = request.GET.get('q')
    cir = request.GET.get('cir','')
    node = request.GET.get('node','')
    
    if cir != '':
        # 입력값을 포함하는 행 찾기
        df_filtered = df[df['Circuit'].str.contains(cir, na=False)]
        if node != '':
            df_filtered2 = df_filtered[df_filtered['NodePATH'].str.contains(node, na=False)]
        else:
            df_filtered2 = df_filtered         
    else:
        if node != '':
            df_filtered2 = df[df['NodePATH'].str.contains(node, na=False)]
        else:
            df_filtered = ""
            df_filtered2 = ""
    #print(df_filtered2)
    #print (df_filtered2.loc[5,'NodePATH'])
    context = {'data': df_filtered2,'len':len(df_filtered2)}
    return render(request, 'my_template.html', context)
