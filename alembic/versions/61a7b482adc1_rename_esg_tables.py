"""rename esg tables

Revision ID: 61a7b482adc1
Revises: 95d24e6d8a8a
Create Date: 2025-09-30 23:20:48.291507

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '61a7b482adc1'
down_revision: Union[str, Sequence[str], None] = '95d24e6d8a8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: rename old ESG tables."""
    op.rename_table("esg_scores", "esg_raw_scores")
    op.rename_table("esg_dashboard", "esg_final_scores")


def downgrade() -> None:
    """Downgrade schema: revert table names."""
    op.rename_table("esg_raw_scores", "esg_scores")
    op.rename_table("esg_final_scores", "esg_dashboard")
