"""add aggregation_method to esg_kpi_mappings

Revision ID: add_aggregation_method
Revises: 0397556dab62
Create Date: 2025-09-23
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "add_aggregation_method"
down_revision = "0397556dab62"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "esg_kpi_mappings",
        sa.Column("aggregation_method", sa.String(), nullable=True, server_default="SUM"),
    )


def downgrade():
    op.drop_column("esg_kpi_mappings", "aggregation_method")
