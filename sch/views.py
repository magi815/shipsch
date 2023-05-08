from django.shortcuts import redirect,render
import pandas as pd
from django.db import connection
from django.http import JsonResponse
from django.core import serializers
from .models import MyModelWithDynamicTable, MyMap
from django.urls import reverse
import json
from django.views.decorators.csrf import csrf_exempt

#from django.views.decorators.cache import cache_control
#from django.views.decorators.csrf import csrf_exempt

mode = "basic"
#@csrf_exempt
#@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def main(request):
    return render(request, 'mainpage.html')


def index(request,num):
    global mode
    mode = 'basic'
    #loaddf(num)
    context = {'shipnum':num,'mode':mode, 'error':0}   
    return render(request, 'my_template.html', context=context)

import re

def special(input_string):
    # Define the special characters in a character set, e.g., '-'
    special_chars = '-'
    
    # Replace the special characters with the same character preceded by a '#'
    modified_string = re.sub(f'([{special_chars}])', r'#\1', input_string)
    
    return modified_string

def filter(request,num):    
    try:
        # 입력값 처리
        global mode
        mode = 'basic'
        query = f'SELECT * FROM `{num}` '
        conditions = []
        cir = request.GET.get('cir','') 
        cir = cir.strip()
        if len(cir) > 0 :
            conditions.append(f'UPPER(`Circuit`) LIKE CONCAT("%", UPPER("{cir}"), "%")')
        node = request.GET.get('node','') 
        node = node.strip()
        if len(node) > 0 :
            conditions.append(f'UPPER(`Node PATH`) LIKE CONCAT("%", UPPER("{node}"), "%")')
        type_ = request.GET.get('type','') 
        type_ = type_.strip()
        if len(type_) > 0 :
            conditions.append(f'UPPER(`Cable Type`) LIKE CONCAT("%", UPPER("{type_}"), "%")')
        block = request.GET.get('block','') 
        block = block.strip()
        if len(block) > 0 :
            conditions.append(f'UPPER(`SET Block`) LIKE CONCAT("%", UPPER("{block}"), "%")')

        if conditions:
            query += "WHERE " + " AND ".join(conditions)
        
        query += ";"
        if len(conditions)>0 :        
            with connection.cursor() as cursor:
                cursor.execute(query)
                results = cursor.fetchall()
                columns = [col[0] for col in cursor.description]
                df = pd.DataFrame(results, columns=columns)
           
            df = df.dropna(subset=['Circuit'])
            df = df.rename(columns={'Cable Type': 'CableType',
                                    'From Length': 'FromLength',
                                    'From Equipment': 'FromEquipment',
                                    'To Equipment': 'ToEquipment',
                                    'To Length': 'ToLength',
                                    'Node PATH': 'NodePATH',
                                    'Block PATH': 'BlockPATH',
                                    'SET Block': 'SETBlock'})
            mask = df['NodePATH'].isna()
            missing_values = df.loc[mask, ['From장비Tag', 'To장비Tag', 'Circuit','NodePATH']]
            for index, row in missing_values.iterrows():
                mask = (
                    ((row['From장비Tag'] is not None) and (len(row['From장비Tag']) > 3)) & 
                    (
                        (df['From장비Tag'] == row['From장비Tag']) | 
                        (df['To장비Tag'] == row['From장비Tag'])
                    ) | 
                    ((row['To장비Tag'] is not None) and (len(row['To장비Tag']) > 3)) & 
                    (
                        (df['To장비Tag'] == row['To장비Tag']) | 
                        (df['From장비Tag'] == row['To장비Tag'])
                    ) & 
                    (len(str(row['NodePATH'])) > 0)
                )   
                circuit_value = df.loc[mask, 'Circuit'].values
                nodepath_value = df.loc[mask, 'NodePATH'].values
                # 찾은 값이 있으면 'NodePATH' 값을 업데이트합니다.
                if len(nodepath_value) > 0:
                    a = str(nodepath_value[0]).split(' ')
                    filtered_a = [x for x in a if x not in [None, '', 'nan','None']]
                    if len(filtered_a) > 0:
                        #df.at[index, 'NodePATH'] = nodepath_value[0]
                        if (df.loc[mask, 'From장비Tag'].values[0] == row['From장비Tag']) or (df.loc[mask, 'From장비Tag'].values[0] == row['To장비Tag']):
                            df.at[index, 'CheckNode'] = circuit_value[0] + " " +filtered_a[0]+"근처"
                        elif (df.loc[mask, 'To장비Tag'].values[0] == row['From장비Tag']) or (df.loc[mask, 'To장비Tag'].values[0] == row['To장비Tag']):
                            df.at[index, 'CheckNode'] = circuit_value[0] + " " +filtered_a[len(filtered_a)-1]+"근처"
                        #print(filtered_a,len(filtered_a))
            for index, row in df.iterrows():
                if pd.isna(row['NodePATH']):
                    check_node_value = row['CheckNode']
                    if not pd.isna(check_node_value):
                        df.at[index, 'NodePATH'] = check_node_value
                        
            df = df.reset_index(drop=True)

            if 'SETBlock' in df.columns:
                sbs = sorted(list(set(df['SETBlock'].tolist())))
            else:
                sbs =[]
            # 블록별 개수 딕셔너리 초기화
            sbs_count = {}

            # 각 블록의 개수 세기
            for sb in sbs:
                count = df[df['SETBlock'] == sb].shape[0]
                sbs_count[sb] = count
            if len(df) >0:
                count_checked = len(df[df['checked'] == 1])
            else:
                count_checked = 0

            #print(df_filtered2)
            #print (df_filtered2.loc[5,'NodePATH'])
            context = {'data': df,'mode':mode, len:len(df),'cir':cir,'count_checked':count_checked,'node':node,'type':type_, 'block':block, 'shipnum':num, 'showcount':200,'sbs_count':sbs_count, 'error':0}
            return render(request, 'my_template.html', context=context)        
        else:
            context = {'shipnum':num,'mode':mode, 'error':0}   
            return render(request, 'my_template.html', context=context)
            
    except Exception as e:
        # 에러 발생 시 리다이렉트        
        context = {'shipnum':num,'mode':mode, 'error':1}   
        return render(request, 'my_template.html', context=context)
        #return
def callen(a, b, c, d):
    result = ""   

    if (b in a) and (c in a) and (")-T       " in a):
        first_val_idx = a.index(")-T       ") - 7
        #print(first_val_idx,first_val_idx + 7)
        #print(a[first_val_idx:first_val_idx + 7])

        second_val_idx = a.index(c) - 9

        third_val_idx = a.index(b) - 9
        #print(a,b,c,d,a[first_val_idx:first_val_idx + 7],a[second_val_idx:second_val_idx + 7],a[third_val_idx:third_val_idx + 7])
        first_val = float(a[first_val_idx:first_val_idx + 7].replace(")",""))
        second_val = float(a[second_val_idx:second_val_idx + 7].replace(")",""))
        third_val = float(a[third_val_idx:third_val_idx + 7].replace(")",""))
        if a.index(b) <= a.index(c):
            fr = round(third_val * 100) / 100
            to = round((first_val - second_val) * 100) / 100
            ct = round((second_val - third_val) * 100) / 100
            total = round((fr + to + ct) * 100) / 100
        else:
            fr = round((first_val - third_val) * 100) / 100
            to = round(second_val * 100) / 100
            ct = round((third_val - second_val) * 100) / 100
            total = round((fr + to + ct) * 100) / 100

        # 출력: a.index(b), a.index(c), first_val, second_val, third_val, b, c
        #print(a.index(b), a.index(c), first_val, second_val, third_val, b, c)
        if d == 2:
            return ct
        else:
            return

def map_main(request):
    context = {'error':0}  
    edges=[]
    nodes = []  # 추가된 줄
    shipnum = request.GET.get('shipnum','') 
    node = request.GET.get('node','').strip()
    endnodes = []
    context = {'node':"",'endnodes':"", 'shipnum':"", 'error': 0, 'edges': "", 'nodes': ""}
    if len(node) > 1 :        
        query = f'SELECT * FROM `{shipnum}` '
        conditions = []        
        conditions.append(f'UPPER(`Node PATH`) LIKE CONCAT("%", UPPER("{node}"), "%")')
        if conditions:
            query += "WHERE " + " AND ".join(conditions)        
        query += ";"
        if len(conditions)>0 :        
            with connection.cursor() as cursor:
                cursor.execute(query)
                results = cursor.fetchall()
                columns = [col[0] for col in cursor.description]
                df_map = pd.DataFrame(results, columns=columns)
            
            df_map = df_map.dropna(subset=['Circuit'])
            df_map = df_map.rename(columns={'Cable Type': 'CableType',
                                    'From Length': 'FromLength',
                                    'From Equipment': 'FromEquipment',
                                    'To Equipment': 'ToEquipment',
                                    'To Length': 'ToLength',
                                    'Node PATH': 'NodePATH',
                                    'Block PATH': 'BlockPATH',
                                    'SET Block': 'SETBlock'})
            nodes_set = set()  # 추가된 줄
            for _, row in df_map.iterrows():

                nodepath = row['NodePATH'].strip()
                nodelen = row['길이Node']
                if nodepath is not None:
                    split_node2 = nodepath.split(" ")
                    split_node = []
                    for i in range(len(split_node2)):
                        if i == 0 or split_node2[i] != split_node2[i - 1]:
                            split_node.append(split_node2[i])

                    if node in nodepath:
                        for i, element in enumerate(split_node):
                            if i == 0 or  i == len(split_node)-1:
                                if split_node[i] not in endnodes:
                                    endnodes.append(split_node[i])
                                if node in split_node[i] and not split_node[i][-1].isalpha():
                                    if i == len(split_node)-1:
                                        if "JB" in row['ToEquipment'] or "CABINET" in row['ToEquipment'] or "STARTER" in row['ToEquipment'] or "PANEL" in row['ToEquipment'] or "FVT" in row['ToEquipment']  :
                                            c = 1
                                            if [row['ToEquipment'], split_node[i],c] not in edges and [split_node[i], row['ToEquipment'],c] not in edges :
                                                edges.append([row['ToEquipment'], split_node[i],c])
                                                nodes_set.add(split_node[i])
                                                nodes_set.add(row['ToEquipment'])

                                        elif nodelen is not None:
                                            c = row['ToLength']
                                            if [row['Circuit'], split_node[i],c] not in edges and [split_node[i], row['Circuit'],c] not in edges :
                                                edges.append([row['Circuit'], split_node[i],c]) 
                                                nodes_set.add(split_node[i])
                                                nodes_set.add(row['Circuit'])
                                        else:
                                            if [row['Circuit'], split_node[i],1] not in edges and [split_node[i], row['Circuit'],1] not in edges :
                                                edges.append([row['Circuit'], split_node[i],1]) 
                                                nodes_set.add(split_node[i])
                                                nodes_set.add(row['Circuit'])

                            if i < len(split_node)-1:
                                if node in split_node[i] and node in split_node[i+1]:
                                    if nodelen is not None:                            
                                        c = callen(nodelen,split_node[i],split_node[i+1],2)
                                        if [split_node[i], split_node[i + 1],c] not in edges and [split_node[i+1], split_node[i],c] not in edges :
                                            edges.append([split_node[i], split_node[i + 1],c])                                    
                                    else:
                                        if [split_node[i], split_node[i + 1],1] not in edges and [split_node[i+1], split_node[i],1] not in edges:
                                            edges.append([split_node[i], split_node[i + 1],1])
                                    # 아래 두 줄은 nodes_set에 각 노드를 추가합니다.
                                    nodes_set.add(split_node[i])
                                    nodes_set.add(split_node[i + 1])
            # nodes_set의 각 노드에 대해 nodes 리스트를 생성합니다.
            for node_id in nodes_set:
                nodes.append({
                    "id": node_id,
                    "label": node_id
                })
        context = {'node':node,'endnodes':json.dumps(endnodes), 'shipnum':shipnum, 'error': 0, 'edges': json.dumps(edges), 'nodes': json.dumps(nodes)}  # nodes를 context에 추가
        
    return render(request, 'map_main.html', context=context)


@csrf_exempt
def save_node_positions(request):
    if request.method == "POST":
        data = json.loads(request.body)
        title = data.get("title")
        ship = data.get("ship")
        nodes = json.dumps(data.get("nodes"))
        edges = json.dumps(data.get("edges"))
        nodepos = json.dumps(data.get("nodepos"))
        # 기존 MyMap 객체를 찾거나 없으면 새로 생성합니다.
        my_map, created = MyMap.objects.update_or_create(
            title=title,
            defaults={"ship": ship, "nodes": nodes, "edges": edges, "nodepos": nodepos}
        )

        if created:
            my_map.save()

        # 저장에 성공한 경우
        return JsonResponse({"status": "success","shipnum":ship, "nodes": nodes, "edges": edges, "node_positions": nodepos})
    return JsonResponse({"status": "error"})

def load_mymap(request):
    ship = request.GET.get("ship", "")
    title = request.GET.get("title", "")
    if ship and title:
        try:
            mymap = MyMap.objects.get(title=title)
            nodes = json.loads(mymap.nodes)
            edges = json.loads(mymap.edges)
            node_positions = json.loads(mymap.nodepos)
            return JsonResponse({"status": "success","shipnum":ship, "nodes": nodes, "edges": edges, "node_positions": node_positions})
        except MyMap.DoesNotExist:
            return JsonResponse({"status": "error", "message": "MyMap not found"})
    else:
        print(ship,title)
        return JsonResponse({"status": "error", "message": "Invalid parameters"})



def get_mymap_titles(request):
    mymaps = MyMap.objects.values_list('ship', 'title')
    mymaps_list = [f"{ship} {title}" for ship, title in mymaps]
    return JsonResponse({"status": "success", "titles": mymaps_list})


class AnotherModel(MyModelWithDynamicTable):
    pass

def save_memo(request,num):    
    
    if request.method == 'POST':
        circuit = request.POST.get('circuit')
        memo = request.POST.get('memo')
        memodate = request.POST.get('memodate')

        if memo == "":
            memodate = None

        
        # YourModel에 저장
        AnotherModel._meta.db_table = str(num)
        model_instance = AnotherModel(Circuit=circuit, memo=memo,memodate=memodate)
        model_instance.save(update_fields=['memo', 'memodate'])

        # 저장 성공시, JsonResponse를 반환
        response = {'status': 'success'}

    else:
        # POST 요청이 아닐 경우, JsonResponse를 반환
        response = {'status': 'fail'}
    return JsonResponse(response)

def changesetblockall(request,num):
    if request.method == 'POST':
        circuit_list = request.POST.get('circuit')
        block_nbr = request.POST.get('block_nbr')
        AnotherModel._meta.db_table = str(num)
        circuits = circuit_list.split(',')
        AnotherModel.objects.filter(Circuit__in=circuits).update(SET_Block=block_nbr)
        
        response = {'status': 'success'}
    else:
        response = {'status': 'fail'}
    return JsonResponse(response)


def changesetblock(request,num):
    if request.method == 'POST':
        circuit = request.POST.get('circuit')
        block_nbr = request.POST.get('block_nbr')
        # YourModel에 저장
        AnotherModel._meta.db_table = str(num)
        model_instance = AnotherModel(Circuit=circuit, SET_Block=block_nbr)
        model_instance.save(update_fields=['SET_Block'])

        # 저장 성공시, JsonResponse를 반환
        response = {'status': 'success'}
    else:
        # POST 요청이 아닐 경우, JsonResponse를 반환
        response = {'status': 'fail'}
    return JsonResponse(response)

def savenode(request,num):
    if request.method == 'POST':
        circuit = request.POST.get('circuit')
        list_node = request.POST.get('list_node')
        list_BlockPATH = request.POST.get('list_BlockPATH')
        reverse = request.POST.get('reverse')

        # YourModel에 저장
        AnotherModel._meta.db_table = str(num)
        model_instance = AnotherModel(Circuit=circuit, list_node=list_node,list_BlockPATH=list_BlockPATH,reverse=reverse)
        model_instance.save(update_fields=['list_node', 'list_BlockPATH', 'reverse'])

        # 저장 성공시, JsonResponse를 반환
        response = {'status': 'success'}

    else:
        # POST 요청이 아닐 경우, JsonResponse를 반환
        response = {'status': 'fail'}
    return JsonResponse(response)


def delnode(request,num):
    if request.method == 'POST':
        circuit = request.POST.get('circuit')
        list_node = request.POST.get('list_node')
        reverse = request.POST.get('reverse')

        AnotherModel._meta.db_table = str(num)
        model_instance = MyModelWithDynamicTable(Circuit=circuit, list_node=list_node,reverse=reverse)
        model_instance.save(update_fields=['list_node', 'reverse'])

        # 저장 성공시, JsonResponse를 반환
        response = {'status': 'success'}

    else:
        # POST 요청이 아닐 경우, JsonResponse를 반환
        response = {'status': 'fail'}
    return JsonResponse(response)


def update_checked(request,num):    
    if request.method == 'POST':
        circuit = request.POST.get('circuit')
        checked = request.POST.get('checked')

        AnotherModel._meta.db_table = str(num)
        model_instance = AnotherModel(Circuit=circuit, checked=checked)
        model_instance.save(update_fields=['checked'])

        # 저장 성공시, JsonResponse를 반환
        response = {'status': 'success'}
    else:
        # POST 요청이 아닐 경우, JsonResponse를 반환
        response = {'status': 'fail'}
    return JsonResponse(response)



