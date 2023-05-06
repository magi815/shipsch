import pandas as pd
from sqlalchemy import create_engine, text

# MySQL database connection
engine = create_engine('mysql://root:dnwlsa10@localhost/sch_db')
#engine = create_engine('mysql+mysqldb://magi815:Newstart!0@magi815.mysql.pythonanywhere-services.com:3306/magi815$sch_db', encoding='utf-8')

# CSV file name
csv_file = "3278_추가수정.csv"
# Load CSV file into a pandas dataframe
df_csv = pd.read_csv(csv_file, encoding='cp949')

# Create a new table in the database with the same name as the CSV file
table_name = '3278'


# 데이터프레임의 차이 비교하기

# 변경된 행들을 데이터베이스에 추가하거나 수정하기
with engine.connect() as con:
    df_db = pd.read_sql_table(table_name, con)
    #df_diff = pd.concat([df_csv, df_db]).drop_duplicates(keep=False)
    #print(df_csv)
    for i, row in df_csv.iterrows():
        if row['Circuit'] in df_db['Circuit'].values:
            # Circuit 값이 일치하는 행이 이미 존재하는 경우, 해당 행을 업데이트합니다.
            update_query = f"UPDATE `3278` SET `From Length`={row['From Length']}, `To Length`={row['To Length']}, `길이Node`='{row['길이Node']}' WHERE Circuit='{row['Circuit']}';"


            con.execute(text(update_query))
            print(text(update_query))
        else:
            # Circuit 값이 일치하는 행이 존재하지 않는 경우, 새로운 행을 추가합니다.
            row.to_sql(table_name, engine, if_exists='append', index=False)

