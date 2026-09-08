from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_id: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    # Ownership — every report is scoped to the user who submitted it
    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id"), index=True, nullable=False
    )
    user_name: Mapped[str] = mapped_column(String(128), nullable=False)
    user_email: Mapped[str] = mapped_column(String(128), nullable=False)

    # Original uploaded image (exact file, no placeholders)
    original_image: Mapped[str] = mapped_column(String(255), default="")
    image_url: Mapped[str] = mapped_column(String(255), default="")

    # Report details
    location: Mapped[str] = mapped_column(String(255), default="")
    latitude: Mapped[float] = mapped_column(Float, default=0.0)
    longitude: Mapped[float] = mapped_column(Float, default=0.0)
    issue_type: Mapped[str] = mapped_column(String(128), default="Waterlogging")
    water_depth: Mapped[float] = mapped_column(Float, default=0.0)
    description: Mapped[str] = mapped_column(Text, default="")

    # Lifecycle
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(32), default="Under Review")

    # AI verification
    ai_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    ai_verification_result: Mapped[str] = mapped_column(String(64), default="Pending Analysis")

    # Dispatch
    dispatch_status: Mapped[str] = mapped_column(String(32), default="Unassigned")
    dispatched_to: Mapped[str] = mapped_column(String(128), default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)