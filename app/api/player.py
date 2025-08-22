# app/api/player.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.player import PlayerCreate, PlayerResponse
from app.crud import player as player_crud
from app.db.database import get_db
from app.core.deps import get_current_user, pagination_params

router = APIRouter(tags=["players"])

@router.post("/players", response_model=PlayerResponse, status_code=status.HTTP_201_CREATED)
def create_player(
    player_data: PlayerCreate,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    return player_crud.create_player(db, player_data)

@router.get("/players", response_model=List[PlayerResponse])
def list_players(
    team_id: Optional[int] = Query(None),
    position: Optional[str] = Query(None, regex="^(P|B)$"),
    pg=Depends(pagination_params),
    db: Session = Depends(get_db),
):
    return player_crud.get_all_players(
        db,
        team_id=team_id,
        position=position,
        limit=pg["limit"],
        offset=pg["offset"],
    )

@router.get("/players/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, db: Session = Depends(get_db)):
    obj = player_crud.get_player_by_id(db, player_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Player not found")
    return obj
