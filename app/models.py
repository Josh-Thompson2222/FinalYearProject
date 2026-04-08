from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, JSON, DateTime, func
from datetime import datetime
from typing import List
class Base(DeclarativeBase):
	pass


class UserDB(Base):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(primary_key=True)
	name: Mapped[str] = mapped_column(String(100), nullable=False)
	email: Mapped[str] = mapped_column(unique=True, nullable=False)
	password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

	intake_logs: Mapped[List["IntakeLogDB"]] = relationship("IntakeLogDB", back_populates="owner")

	schedules: Mapped[List["TabletScheduleDB"]] = relationship("TabletScheduleDB", back_populates="owner", cascade="all, delete-orphan")


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

class IntakeLogDB(Base):
    __tablename__ = "intake_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    tablet_name: Mapped[str] = mapped_column(String, nullable=False)
    time_of_day: Mapped[str] = mapped_column(String, nullable=False)  # "morning"|"afternoon"|"evening"
    qty_taken: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    taken_at: Mapped[datetime] = mapped_column( DateTime(timezone=True), server_default=func.now(), nullable=False )

    owner: Mapped["UserDB"] = relationship("UserDB", back_populates="intake_logs")