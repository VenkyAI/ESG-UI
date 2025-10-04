
"""add esg_kpi_weights table

Revision ID: ab8ea72496d5
Revises: b418eb1d7eca
Create Date: 2025-09-23
"""

revision = 'ab8ea72496d5'
down_revision = 'b418eb1d7eca'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "esg_kpi_weights",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("kpi_code", sa.String, sa.ForeignKey("esg_kpis.kpi_code"), nullable=False),
        sa.Column("weight", sa.Numeric, nullable=False),
        sa.Column("company_id", sa.Integer, nullable=False),
        sa.Column("reporting_period", sa.Date, nullable=False),
    )


def downgrade():
    op.drop_table("esg_kpi_weights")
