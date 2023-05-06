
from sqlalchemy import create_engine, text

# MySQL database connection
engine = create_engine('mysql://root:dnwlsa10@localhost/sch_db')
# Set the Circuit column as the index
with engine.connect() as con:
    con.execute(text("DELETE FROM `3303` WHERE `Circuit` is NULL;"))
    