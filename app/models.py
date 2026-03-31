from typing import List
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, JSON, DateTime, func
from datetime import datetime

class Base(DeclarativeBase):
	pass


class UserDB(Base):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(primary_key=True)
	name: Mapped[str] = mapped_column(String(100), nullable=False)
	email: Mapped[str] = mapped_column(unique=True, nullable=False)
	password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

	schedules: Mapped[List["TabletScheduleDB"]] = relationship(
		"TabletScheduleDB", back_populates="owner", cascade="all, delete-orphan"
	)


class TabletScheduleDB(Base):
	__tablename__ = "tablet_schedules"

	id: Mapped[int] = mapped_column(primary_key=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
	morning: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
	afternoon: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
	evening: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
	updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

	owner: Mapped["UserDB"] = relationship("UserDB", back_populates="schedules")