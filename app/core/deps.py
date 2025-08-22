# app/core/deps.py
from fastapi import Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.jwt import decode_token
from app.db.models import User
from typing import Optional

def get_current_user(
    db: Session = Depends(get_db),
    authorization: Optional[str] = None,
):
    # Authorization: Bearer <token>
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    username_or_email = payload["sub"]
    user = db.query(User).filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def admin_required(user = Depends(get_current_user)):
    # 필요 시 User에 role 필드 추가하여 체크
    # if user.role != "admin": raise HTTPException(403, "Admin only")
    return user

def pagination_params(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return {"limit": limit, "offset": offset}
