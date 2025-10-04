"""add aggregation_method to KPI mappings

Revision ID: caef4cd19613
Revises: 9d4e2a1f6b23
Create Date: 2025-10-02 21:49:20.856444
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'caef4cd19613'
down_revision: Union[str, Sequence[str], None] = '9d4e2a1f6b23'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "esg_kpi_mappings",
        sa.Column("aggregation_method", sa.String(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("esg_kpi_mappings", "aggregation_method")
