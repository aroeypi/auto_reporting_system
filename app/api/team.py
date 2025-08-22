# app/api/team.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.schemas.team import TeamCreate, TeamResponse
from app.crud import team as team_crud
from app.db.database import get_db
from app.core.deps import get_current_user, pagination_params

router = APIRouter(tags=["teams"])

@router.post("/teams", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    return team_crud.create_team(db, team_data)

@router.get("/teams", response_model=List[TeamResponse])
def list_teams(pg=Depends(pagination_params), db: Session = Depends(get_db)):
    return team_crud.get_all_teams(db, limit=pg["limit"], offset=pg["offset"])

@router.get("/teams/{team_id}", response_model=TeamResponse)
def get_team(team_id: int, db: Session = Depends(get_db)):
    obj = team_crud.get_team(db, team_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Team not found")
    return obj
