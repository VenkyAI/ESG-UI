"""add companies and foreign keys

Revision ID: 95d24e6d8a8a
Revises: ab8ea72496d5
Create Date: 2025-09-27 18:40:53.070269
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '95d24e6d8a8a'
down_revision: Union[str, Sequence[str], None] = 'ab8ea72496d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    # 1. Create companies table
    op.create_table(
        "companies",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("parent_id", sa.Integer, sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP, server_default=sa.func.now()),
    )

    # 2. Insert default company (id=1)
    op.execute(
        "INSERT INTO companies (id, name, parent_id) VALUES (1, 'Default Company', NULL)"
    )

    # 3. Add foreign keys to existing ESG tables
    op.create_foreign_key("fk_form_company", "esg_form_submissions", "companies", ["company_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("fk_pillar_company", "esg_pillar_weights", "companies", ["company_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("fk_kpiw_company", "esg_kpi_weights", "companies", ["company_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("fk_scores_company", "esg_scores", "companies", ["company_id"], ["id"], ondelete="CASCADE")


def downgrade():
    # Drop FKs first
    op.drop_constraint("fk_form_company", "esg_form_submissions", type_="foreignkey")
    op.drop_constraint("fk_pillar_company", "esg_pillar_weights", type_="foreignkey")
    op.drop_constraint("fk_kpiw_company", "esg_kpi_weights", type_="foreignkey")
    op.drop_constraint("fk_scores_company", "esg_scores", type_="foreignkey")

    # Drop companies table
    op.drop_table("companies")
