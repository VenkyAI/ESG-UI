"""add methodology column to esg_form_submissions"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "9d4e2a1f6b23"   # 🔹 new unique revision ID
down_revision = "8c2b7c9f4e01"  # 🔹 last migration = add_cascade_to_mappings
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "esg_form_submissions",
        sa.Column("methodology", sa.String(), nullable=True)
    )


def downgrade():
    op.drop_column("esg_form_submissions", "methodology")
