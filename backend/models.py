from sqlalchemy import Column, String
from database import Base
import uuid

class Room(Base):
    __tablename__ = "rooms"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
