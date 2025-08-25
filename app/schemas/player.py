# app/schemas/player.py
from pydantic import BaseModel, ConfigDict
from typing import Optional

class PlayerBase(BaseModel):
    name: str
    position: str
    team_id: int
    player_code: Optional[int] = None  # 외부 식별자

class PlayerCreate(PlayerBase):
    pass

class PlayerResponse(PlayerBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
