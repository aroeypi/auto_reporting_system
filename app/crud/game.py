# app/crud/game.py
from sqlalchemy.orm import Session, joinedload
from app.db.models import Game, Team
from app.schemas.game import GameCreate
from app.crud.utils import commit_or_rollback

def create_game(db: Session, game_data: GameCreate):
    game = Game(**game_data.dict())
    db.add(game)
    commit_or_rollback(db)
    db.refresh(game)
    return game

def upsert_game(db: Session, data: GameCreate):
    obj = None
    if data.game_code:
        obj = db.query(Game).filter(Game.game_code == data.game_code).first()
    if obj:
        for k, v in data.dict(exclude_unset=True).items():
            setattr(obj, k, v)
    else:
        obj = Game(**data.dict())
        db.add(obj)
    commit_or_rollback(db)
    db.refresh(obj)
    return obj

def get_all_games(db: Session, *, limit=50, offset=0, date=None, team_code: str | None = None, order: str = "-date"):
    limit = min(limit, 200)
    q = db.query(Game).options(joinedload(Game.home_team), joinedload(Game.away_team))
    if date:
        q = q.filter(Game.date == date)
    if team_code:
        q = q.join(Team, Game.home_team).filter(Team.team_code == team_code) \
             .union(db.query(Game).join(Team, Game.away_team).filter(Team.team_code == team_code))
    q = q.order_by(Game.date.desc() if order == "-date" else Game.date.asc())
    return q.limit(limit).offset(offset).all()

def get_game_by_id(db: Session, game_id: int):
    return db.query(Game).filter(Game.id == game_id).first()

def get_game_by_game_code(db: Session, game_code: str):
    return db.query(Game).filter(Game.game_code == game_code).first()
