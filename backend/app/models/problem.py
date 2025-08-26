# backend/app/models/problem.py
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Float
from sqlalchemy.sql import func
from app.core.database import Base

class Problem(Base):
   __tablename__ = "problems"
   
   id = Column(Integer, primary_key=True, index=True)
   leetcode_id = Column(String, unique=True, index=True)  # problem slug from URL
   title = Column(String, index=True)
   difficulty = Column(String)  # Easy, Medium, Hard
   description = Column(Text)
   category = Column(String)  # Array, DP, Graph, etc.
   tags = Column(JSON)  # ["hash-table", "two-pointers"]
   constraints = Column(Text)
   examples = Column(JSON)  # Input/output examples
   time_complexity = Column(String)  # O(n), O(log n), etc.
   space_complexity = Column(String)
   created_at = Column(DateTime, server_default=func.now())
   updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())