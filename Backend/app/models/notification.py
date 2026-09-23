from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from ..core.datetime_utils import get_current_time
from ..core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    notification_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    # Recipient user ID (matches User.id or Admin.id)
    user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    # Notification category / lifecycle type:
    # 'report_submitted', 'incident_in_progress', 'incident_resolved', 'urgent', 'pumps', 'system'
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # Associated spatial / municipal metadata
    location: Mapped[str] = mapped_column(String(255), default="")
    ward: Mapped[str] = mapped_column(String(64), default="")

    # Read state
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    # Reference keys
    report_id: Mapped[str] = mapped_column(String(64), default="")
    work_id: Mapped[str] = mapped_column(String(64), default="")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_current_time)
