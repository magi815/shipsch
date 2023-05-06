
from pyvis.network import Network
import mysql.connector
import re
from tabulate import tabulate

def callen(a, b, c, d):
    result = ""   

    if (b in a) and (c in a) and (")-T       " in a):
        first_val_idx = a.index(")-T       ") - 7
        #print(first_val_idx,first_val_idx + 7)
        #print(a[first_val_idx:first_val_idx + 7])
        first_val = float(a[first_val_idx:first_val_idx + 7])

        second_val_idx = a.index(c) - 9
        second_val = float(a[second_val_idx:second_val_idx + 7])

        third_val_idx = a.index(b) - 9
        third_val = float(a[third_val_idx:third_val_idx + 7])

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

DATABASES = {
        'default': {
                'ENGINE': 'django.db.backends.mysql',
                'NAME': 'sch_db',
                'USER': 'root',
                'PASSWORD': 'dnwlsa10',
                'HOST': 'localhost',
                'PORT': '3306',
        }
}


# MySQL에 연결
connection = mysql.connector.connect(
        host="localhost",
        port=3306,
        user=DATABASES['default']['USER'],
        password=DATABASES['default']['PASSWORD'],
        database=DATABASES['default']['NAME'],
)

# 커서 생성
cursor = connection.cursor()
# 테이블명 '3303' 데이터 불러오기
cursor.execute("SELECT * FROM `3278`")
columns = cursor.description
Circuit_index = next((index for index, column in enumerate(columns) if column[0] == 'Circuit'), None)
node_path_index = next((index for index, column in enumerate(columns) if column[0] == 'Node PATH'), None)
fe_index = next((index for index, column in enumerate(columns) if column[0] == 'From Equipment'), None)
te_index = next((index for index, column in enumerate(columns) if column[0] == 'To Equipment'), None)
nodelen_index = next((index for index, column in enumerate(columns) if column[0] == '길이Node'), None)


edges = []
# 결과 출력
# result = cursor.fetchall()
for row in cursor:
    node = row[node_path_index]
    if node is not None:
        split_node = node.split(" ")
        if 'EF' in node:
            for i, element in enumerate(split_node):
                if i < len(split_node):
                    if 'EF' in split_node[i] and 'EF' in split_node[i+1]:
                        nodelen = row[nodelen_index]
                        if nodelen is not None:                            
                            c = callen(nodelen,split_node[i],split_node[i+1],2)
                            if (split_node[i], split_node[i + 1],c) not in edges:
                                edges.append((split_node[i], split_node[i + 1],c))
                        
                        else:
                            if (split_node[i], split_node[i + 1],1) not in edges:
                                edges.append((split_node[i], split_node[i + 1],1))



print(edges)

nt = Network(notebook=True)

for edge in edges:
    nt.add_node(edge[0],size=5)
    nt.add_node(edge[1],size=5)
    nt.add_edge(edge[0], edge[1], width=1,springLength=edge[2])

# 그래프 설정
nt.toggle_physics(False)  # 물리 시뮬레이션을 끄면 그래프의 노드 및 엣지를 자유롭게 드래그할 수 있습니다.
nt.show_buttons(filter_=['physics'])

# 그래프를 HTML 파일로 저장하거나 브라우저에서 열기
nt.show("graph.html")

# 커서와 연결 종료
cursor.close()
connection.close()


