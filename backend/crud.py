from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime
import models, schemas, auth
from typing import Optional

# Users
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_all_users(db: Session):
    return db.query(models.User).all()

def create_user(db: Session, data: schemas.UserCreate):
    user = models.User(
        name=data.name,
        email=data.email,
        password_hash=auth.hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not auth.verify_password(password, user.password_hash):
        return None
    return user

# Projects
def get_projects_for_user(db: Session, user):
    if user.role == "admin":
        projects = db.query(models.Project).all()
    else:
        projects = db.query(models.Project).filter(
            or_(
                models.Project.owner_id == user.id,
                models.Project.members.any(models.User.id == user.id)
            )
        ).all()
    
    for p in projects:
        p.task_count = db.query(func.count(models.Task.id)).filter(models.Task.project_id == p.id).scalar()
    return projects

def get_project(db: Session, project_id: int, user):
    if user.role == "admin":
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
    else:
        project = db.query(models.Project).filter(
            models.Project.id == project_id,
            or_(
                models.Project.owner_id == user.id,
                models.Project.members.any(models.User.id == user.id)
            )
        ).first()
    if project:
        project.task_count = db.query(func.count(models.Task.id)).filter(models.Task.project_id == project_id).scalar()
    return project

def create_project(db: Session, data: schemas.ProjectCreate, owner_id: int):
    project = models.Project(name=data.name, description=data.description, owner_id=owner_id)
    db.add(project)
    db.commit()
    db.refresh(project)
    project.task_count = 0
    return project

def update_project(db: Session, project_id: int, data: schemas.ProjectCreate):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        return None
    project.name = data.name
    project.description = data.description
    db.commit()
    db.refresh(project)
    project.task_count = db.query(func.count(models.Task.id)).filter(models.Task.project_id == project_id).scalar()
    return project

def delete_project(db: Session, project_id: int):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        return False
    db.delete(project)
    db.commit()
    return True

def add_project_member(db: Session, project_id: int, user_id: int):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not project or not user:
        return False
    if user not in project.members:
        project.members.append(user)
        db.commit()
    return True

def remove_project_member(db: Session, project_id: int, user_id: int):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        return
    project.members = [m for m in project.members if m.id != user_id]
    db.commit()

# Tasks
def get_tasks(db: Session, project_id: int, user):
    project = get_project(db, project_id, user)
    if not project:
        return []
    return db.query(models.Task).filter(models.Task.project_id == project_id).all()

def create_task(db: Session, data: schemas.TaskCreate, project_id: int, created_by: int):
    task = models.Task(
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        due_date=data.due_date,
        project_id=project_id,
        assignee_id=data.assignee_id,
        created_by=created_by,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

def update_task(db: Session, task_id: int, data: schemas.TaskUpdate, user):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        return None
    # Members can only update status of their own tasks
    if user.role == "member" and task.assignee_id != user.id:
        return None
    
    if data.title is not None:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.status is not None:
        task.status = data.status
    if data.priority is not None and user.role == "admin":
        task.priority = data.priority
    if data.due_date is not None and user.role == "admin":
        task.due_date = data.due_date
    if data.assignee_id is not None and user.role == "admin":
        task.assignee_id = data.assignee_id
    
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task

def delete_task(db: Session, task_id: int):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        return False
    db.delete(task)
    db.commit()
    return True

# Dashboard
def get_dashboard_stats(db: Session, user):
    if user.role == "admin":
        project_ids = [p.id for p in db.query(models.Project.id).all()]
    else:
        projects = db.query(models.Project).filter(
            or_(
                models.Project.owner_id == user.id,
                models.Project.members.any(models.User.id == user.id)
            )
        ).all()
        project_ids = [p.id for p in projects]

    now = datetime.utcnow()
    
    total_tasks = db.query(func.count(models.Task.id)).filter(models.Task.project_id.in_(project_ids)).scalar()
    todo = db.query(func.count(models.Task.id)).filter(models.Task.project_id.in_(project_ids), models.Task.status == "todo").scalar()
    in_progress = db.query(func.count(models.Task.id)).filter(models.Task.project_id.in_(project_ids), models.Task.status == "in_progress").scalar()
    done = db.query(func.count(models.Task.id)).filter(models.Task.project_id.in_(project_ids), models.Task.status == "done").scalar()
    overdue = db.query(func.count(models.Task.id)).filter(
        models.Task.project_id.in_(project_ids),
        models.Task.due_date < now,
        models.Task.status != "done"
    ).scalar()

    return {
        "total_projects": len(project_ids),
        "total_tasks": total_tasks,
        "todo": todo,
        "in_progress": in_progress,
        "done": done,
        "overdue": overdue,
    }
