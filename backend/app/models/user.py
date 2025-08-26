# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    subscription_tier = Column(String, default="free")  # free, premium
    skill_level = Column(String, default="beginner")  # beginner, intermediate, advanced
    preferences = Column(JSON)  # learning preferences
    total_problems_solved = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())