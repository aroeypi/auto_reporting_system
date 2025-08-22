# app/api/user.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.models import User
from app.schemas.user import UserCreate, LoginRequest, KakaoUser
from app.crud.user import create_user, authenticate_user
from app.db.database import get_db
from app.core.jwt import create_access_token
from fastapi.responses import JSONResponse
from typing import List

router = APIRouter()

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    created_user = create_user(db, user)
    return created_user

@router.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(data={"sub": user.username})
    return JSONResponse(content={
        "access_token": token,
        "user": {
            "id": user.id,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "email": user.email,
            "username": user.username
        }
    })

@router.get("/users", response_model=List[dict])
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"email": u.email, "username": u.username} for u in users]

@router.post("/kakao-login")
def kakao_login(data: KakaoUser, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        user = User(
            email=data.email,
            username=f'kakao_{data.kakaoId}',
            password='kakao_login',
            first_name=data.nickname,
            last_name='',
            phone='',
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(data={"sub": user.email})
    return {
        "access_token": token,
        "user": {
            "email": user.email,
            "username": user.username,
            "firstName": user.first_name,
            "lastName": user.last_name,
        },
    }

    
