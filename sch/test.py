import pandas as pd
from sqlalchemy import create_engine, text

# MySQL database connection
engine = create_engine('mysql://root:dnwlsa10@localhost/sch_db')
# CSV file name
add_columns_query = """ALTER TABLE 3290 ADD checked INT(1) DEFAULT 0, ADD memo VARCHAR(255), ADD memodate DATE, ADD update DATE;"""


with engine.connect() as con:
    con.execute(add_columns_query)
