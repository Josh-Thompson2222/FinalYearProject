from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey
class Base(DeclarativeBase):
	pass


class UserDB(Base):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(primary_key=True)
	name: Mapped[str] = mapped_column(String(100), nullable=False)
	email: Mapped[str] = mapped_column(unique=True, nullable=False)
	password_hash: Mapped[str] = mapped_column(String(255), nullable=False)