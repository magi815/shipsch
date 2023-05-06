import pandas as pd
from sqlalchemy import create_engine, text

# MySQL database connection
engine = create_engine('mysql://root:dnwlsa10@localhost/sch_db')
#engine = create_engine('mysql+mysqldb://magi815:Newstart!0@magi815.mysql.pythonanywhere-services.com:3306/magi815$sch_db', encoding='utf-8')
# CSV file name
csv_file = "3303.csv"
# Load CSV file into a pandas dataframe
df = pd.read_csv(csv_file, encoding='cp949')

# Create a new table in the database with the same name as the CSV file
table_name = csv_file.replace(".csv", "").replace(" ", "_")
df.to_sql(table_name, con=engine, index=False, if_exists='append')

# Set the Circuit column as the index
with engine.connect() as con:
    con.execute(text("ALTER TABLE `3303` MODIFY COLUMN `Circuit` TEXT;"))
    con.execute(text(f"ALTER TABLE `3303` ADD checked INT(1) DEFAULT 0, ADD memo VARCHAR(255), ADD memodate VARCHAR(100), ADD update_at VARCHAR(100);"))
    con.execute(text(f"ALTER TABLE `3303` ADD setb VARCHAR(45) , ADD setnode_f VARCHAR(45), ADD setnode_t VARCHAR(45), ADD list_node VARCHAR(255),ADD list_BlockPATH TEXT, ADD reverse INT(1) DEFAULT 0;"))
    con.execute(text("ALTER TABLE `3303` ADD COLUMN ship INT DEFAULT 3303"))

    