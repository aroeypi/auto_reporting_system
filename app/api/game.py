# app/api/game.py
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.game import GameCreate, GameResponse
from app.crud import game as game_crud
from app.db.database import get_db
from app.core.deps import get_current_user, pagination_params

router = APIRouter(tags=["games"])

@router.post("/games", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
def create_game(
    game_data: GameCreate,
    response: Response,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),   # 쓰기 보호
):
    obj = game_crud.create_game(db, game_data)
    # 비즈키가 있다면 Location에 비즈키 경로를 넣는 게 더 좋음
    location = f"/api/games/{getattr(obj, 'game_code', obj.id)}"
    response.headers["Location"] = location
    return obj

@router.get("/games", response_model=List[GameResponse])
def list_games(
    date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    team_code: Optional[str] = Query(None, description="예: OB, LT"),
    pg=Depends(pagination_params),
    db: Session = Depends(get_db),
):
    return game_crud.get_all_games(
        db,
        limit=pg["limit"],
        offset=pg["offset"],
        date=date,
        team_code=team_code,
    )

# 비즈키 조회 (권장)
@router.get("/games/{game_code}", response_model=GameResponse)
def get_game_by_code(game_code: str, db: Session = Depends(get_db)):
    obj = game_crud.get_game_by_game_code(db, game_code)
    if not obj:
        raise HTTPException(status_code=404, detail="Game not found")
    return obj

# 내부 PK로 조회가 꼭 필요하면 분리
@router.get("/games/by-id/{game_id}", response_model=GameResponse)
def get_game_by_id(game_id: int, db: Session = Depends(get_db)):
    obj = game_crud.get_game_by_id(db, game_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Game not found")
    return obj
