# app/crud/player.py
from sqlalchemy.orm import Session, joinedload
from app.db.models import Player
from app.schemas.player import PlayerCreate
from app.crud.utils import commit_or_rollback

def create_player(db: Session, player_data: PlayerCreate):
    player = Player(**player_data.dict())
    db.add(player)
    commit_or_rollback(db)
    db.refresh(player)
    return player

def upsert_player_by_code(db: Session, data: PlayerCreate):
    obj = None
    if data.player_code is not None:
        obj = db.query(Player).filter(Player.player_code == data.player_code).first()
    if obj:
        for k, v in data.dict(exclude_unset=True).items():
            setattr(obj, k, v)
    else:
        obj = Player(**data.dict())
        db.add(obj)
    commit_or_rollback(db)
    db.refresh(obj)
    return obj

def get_all_players(db: Session, *, team_id: int | None = None, position: str | None = None, q: str | None = None, limit=50, offset=0):
    limit = min(limit, 200)
    qry = db.query(Player).options(joinedload(Player.team))
    if team_id:
        qry = qry.filter(Player.team_id == team_id)
    if position:
        qry = qry.filter(Player.position == position)
    if q:
        qry = qry.filter(Player.name.ilike(f"%{q}%"))
    return qry.order_by(Player.name.asc()).limit(limit).offset(offset).all()

def get_player_by_id(db: Session, player_id: int):
    return db.query(Player).filter(Player.id == player_id).first()

def get_player_by_player_code(db: Session, player_code: int):
    return db.query(Player).filter(Player.player_code == player_code).first()

def update_player_partial(db: Session, player_id: int, payload: dict):
    obj = db.query(Player).filter(Player.id == player_id).first()
    if not obj:
        return None
    for k, v in payload.items():
        if hasattr(obj, k):
            setattr(obj, k, v)
    commit_or_rollback(db)
    db.refresh(obj)
    return obj
