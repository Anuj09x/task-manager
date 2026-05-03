from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uvicorn

from database import engine, get_db, Base
import models, schemas, crud, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Team Task Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    user_id = auth.verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Auth routes
@app.post("/auth/signup", response_model=schemas.TokenResponse)
def signup(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = crud.create_user(db, user_data)
    token = auth.create_token(user.id)
    return {"token": token, "user": user}

@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_token(user.id)
    return {"token": token, "user": user}

@app.get("/auth/me", response_model=schemas.UserOut)
def me(current_user=Depends(get_current_user)):
    return current_user

# Projects
@app.get("/projects", response_model=List[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.get_projects_for_user(db, current_user)

@app.post("/projects", response_model=schemas.ProjectOut)
def create_project(data: schemas.ProjectCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return crud.create_project(db, data, current_user.id)

@app.get("/projects/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    project = crud.get_project(db, project_id, current_user)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.put("/projects/{project_id}", response_model=schemas.ProjectOut)
def update_project(project_id: int, data: schemas.ProjectCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    project = crud.update_project(db, project_id, data)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    if not crud.delete_project(db, project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Deleted"}

# Project members
@app.post("/projects/{project_id}/members")
def add_member(project_id: int, data: schemas.AddMember, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    result = crud.add_project_member(db, project_id, data.user_id)
    if not result:
        raise HTTPException(status_code=404, detail="User or project not found")
    return {"message": "Member added"}

@app.delete("/projects/{project_id}/members/{user_id}")
def remove_member(project_id: int, user_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    crud.remove_project_member(db, project_id, user_id)
    return {"message": "Member removed"}

# Tasks
@app.get("/projects/{project_id}/tasks", response_model=List[schemas.TaskOut])
def list_tasks(project_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.get_tasks(db, project_id, current_user)

@app.post("/projects/{project_id}/tasks", response_model=schemas.TaskOut)
def create_task(project_id: int, data: schemas.TaskCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create tasks")
    return crud.create_task(db, data, project_id, current_user.id)

@app.put("/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, data: schemas.TaskUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    task = crud.update_task(db, task_id, data, current_user)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized")
    return task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    if not crud.delete_task(db, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Deleted"}

# Users (admin only)
@app.get("/users", response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return crud.get_all_users(db)

# Dashboard
@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.get_dashboard_stats(db, current_user)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
