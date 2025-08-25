# app/schemas/team.py
from pydantic import BaseModel, ConfigDict

class TeamBase(BaseModel):
    name: str
    team_code: str  # 예: OB

class TeamCreate(TeamBase):
    pass

class TeamResponse(TeamBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
