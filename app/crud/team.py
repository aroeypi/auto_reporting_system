# app/crud/team.py
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.db.models import Team
from app.schemas.team import TeamCreate
from app.crud.utils import commit_or_rollback

def create_team(db: Session, team_data: TeamCreate):
    team = Team(**team_data.dict())
    db.add(team)
    commit_or_rollback(db)
    db.refresh(team)
    return team

def get_team(db: Session, team_id: int):
    return db.query(Team).filter(Team.id == team_id).first()

def get_team_by_code(db: Session, team_code: str):
    return db.query(Team).filter(Team.team_code == team_code).first()

def get_all_teams(db: Session, *, q: str | None = None, limit: int = 100, offset: int = 0):
    limit = min(limit, 200)
    qry = db.query(Team)
    if q:
        qry = qry.filter((Team.name.ilike(f"%{q}%")) | (Team.team_code.ilike(f"%{q}%")))
    return qry.order_by(Team.name.asc()).limit(limit).offset(offset).all()

def bulk_upsert_teams(db: Session, rows: list[dict]):
    if not rows:
        return 0
    stmt = insert(Team).values(rows)
    update_cols = {c.name: getattr(stmt.excluded, c.name) for c in Team.__table__.columns if c.name not in ('id','team_code')}
    stmt = stmt.on_conflict_do_update(index_elements=[Team.team_code], set_=update_cols)
    db.execute(stmt)
    commit_or_rollback(db)
    return len(rows)
