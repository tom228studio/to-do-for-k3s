from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Конфигурация БД через переменные окружения
DB_USER = os.getenv("POSTGRES_USER", "user")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "password")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_NAME = os.getenv("POSTGRES_DB", "tododb")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:5432/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Todo(Base):
    __tablename__ = "todos"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    completed = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)

class TodoCreate(BaseModel):
    title: str

class TodoResponse(TodoCreate):
    id: int
    completed: bool
    class Config:
        from_attributes = True

app = FastAPI()

# CORS пока открыт для всех, при настройке Nginx/Ingress это можно будет ужесточить
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/todos", response_model=list[TodoResponse])
def get_todos():
    db = SessionLocal()
    return db.query(Todo).all()

@app.post("/todos", response_model=TodoResponse)
def create_todo(todo: TodoCreate):
    db = SessionLocal()
    db_todo = Todo(title=todo.title)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@app.put("/todos/{todo_id}", response_model=TodoResponse)
def toggle_todo(todo_id: int):
    db = SessionLocal()
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo: raise HTTPException(status_code=404, detail="Not found")
    db_todo.completed = not db_todo.completed
    db.commit()
    return db_todo

@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int):
    db = SessionLocal()
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo: raise HTTPException(status_code=404, detail="Not found")
    db.delete(db_todo)
    db.commit()
    return {"message": "Deleted"}