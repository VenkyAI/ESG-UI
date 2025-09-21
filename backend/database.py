from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Default DB connection string (replace with your actual Postgres password/db if needed)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Abc123***@localhost:5432/esgdb")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
