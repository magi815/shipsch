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
cursor.execute("SELECT * FROM `3303`")
columns = cursor.description
Circuit_index = next((index for index, column in enumerate(columns) if column[0] == 'Circuit'), None)
node_path_index = next((index for index, column in enumerate(columns) if column[0] == 'Node PATH'), None)
fe_index = next((index for index, column in enumerate(columns) if column[0] == 'From Equipment'), None)
te_index = next((index for index, column in enumerate(columns) if column[0] == 'To Equipment'), None)
nodelen_index = next((index for index, column in enumerate(columns) if column[0] == '길이Node'), None)


# 결과 출력
# result = cursor.fetchall()
data = {}
for row in cursor:
    node = row[node_path_index]
    fe = row[fe_index]
    te = row[te_index]
    nodelen = row[nodelen_index]
    felength = -1
    telength = -1
    #print(row[Circuit_index])
    if node is not None and nodelen is not None:
        split_node = node.split(" ")

        # 각 요소 중에서 처음으로 끝 글자가 숫자가 아닌 알파벳 대문자인 요소의 순서를 찾기
        index = -1
        for i, element in enumerate(split_node):
            if re.match(r'^.*[A-Z]$', element):
                index = i
                break
        if index != -1:
            lens = callen(nodelen,split_node[0],split_node[index],2)
            #print(row[Circuit_index],split_node[index],index,lens)
            if lens <= 5:
                txt = fe + '[' + str(lens) + ']'
                if split_node[index] in data:
                    if txt not in data[split_node[index]]:
                        data[split_node[index]].append(txt)  # Use append instead of push
                else:
                    data[split_node[index]] = [txt]
#print(data)

headers = ["Key", "FE Values"]
table_data = [(key, ", ".join(map(str, values))) for key, values in data.items()]
print(tabulate(table_data, headers=headers, tablefmt="pretty"))




# 커서와 연결 종료
cursor.close()
connection.close()