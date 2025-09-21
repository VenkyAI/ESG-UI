"""Add company_id and reporting_period to ESG tables"""

from alembic import op
import sqlalchemy as sa


# Revision identifiers, used by Alembic.
revision = '09a072684923'
down_revision = 'efc1226184dd'  # <-- make sure this matches your last migration ID
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add to esg_pillar_scores
    op.add_column('esg_pillar_scores', sa.Column('company_id', sa.Integer(), nullable=False, server_default="1"))
    op.add_column('esg_pillar_scores', sa.Column('reporting_period', sa.Date(), nullable=False, server_default="2024-01-01"))

    # Add to esg_dashboard
    op.add_column('esg_dashboard', sa.Column('company_id', sa.Integer(), nullable=False, server_default="1"))
    op.add_column('esg_dashboard', sa.Column('reporting_period', sa.Date(), nullable=False, server_default="2024-01-01"))


def downgrade() -> None:
    op.drop_column('esg_pillar_scores', 'company_id')
    op.drop_column('esg_pillar_scores', 'reporting_period')

    op.drop_column('esg_dashboard', 'company_id')
    op.drop_column('esg_dashboard', 'reporting_period')
