# app/crud/utils.py
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

def commit_or_rollback(db: Session):
    try:
        db.commit()
    except:
        db.rollback()
        raise
