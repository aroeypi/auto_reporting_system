# app/schemas/user.py
from pydantic import BaseModel

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str
    
class KakaoUser(BaseModel):
    email: str
    nickname: str
    kakaoId: str