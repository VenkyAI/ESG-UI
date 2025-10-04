"""add ON DELETE CASCADE to esg_kpi_weights.kpi_code

Revision ID: 7b9e4c3f2d10
Revises: 61a7b482adc1
Create Date: 2025-10-02 12:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7b9e4c3f2d10"
down_revision: Union[str, Sequence[str], None] = "61a7b482adc1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply ON DELETE CASCADE to esg_kpi_weights.kpi_code FK"""
    # Drop the old constraint
    op.drop_constraint(
        "esg_kpi_weights_kpi_code_fkey", "esg_kpi_weights", type_="foreignkey"
    )

    # Add the new one with cascade
    op.create_foreign_key(
        "esg_kpi_weights_kpi_code_fkey",
        "esg_kpi_weights",
        "esg_kpis",
        ["kpi_code"],
        ["kpi_code"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    """Revert ON DELETE CASCADE back to normal FK"""
    # Drop the cascade FK
    op.drop_constraint(
        "esg_kpi_weights_kpi_code_fkey", "esg_kpi_weights", type_="foreignkey"
    )

    # Recreate the plain FK (no cascade)
    op.create_foreign_key(
        "esg_kpi_weights_kpi_code_fkey",
        "esg_kpi_weights",
        "esg_kpis",
        ["kpi_code"],
        ["kpi_code"],
    )
