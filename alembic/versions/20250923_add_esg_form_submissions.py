"""add esg_form_submissions table

Revision ID: add_esg_form_submissions
Revises: 0397556dab62
Create Date: 2025-09-23

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "add_esg_form_submissions"
down_revision = "0397556dab62"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        "esg_form_submissions",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("company_id", sa.Integer, nullable=False),
        sa.Column("reporting_period", sa.Date, nullable=False),
        sa.Column("form_field", sa.String, nullable=False),
        sa.Column("field_value", sa.String, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

def downgrade() -> None:
    op.drop_table("esg_form_submissions")
