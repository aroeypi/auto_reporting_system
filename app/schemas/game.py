# app/schemas/game.py
from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional

class GameBase(BaseModel):
    date: date
    home_team_id: int
    away_team_id: int
    stadium: str
    game_code: Optional[str] = None

class GameCreate(GameBase):
    pass

class GameResponse(GameBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
