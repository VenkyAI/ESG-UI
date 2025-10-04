"""merge esg_form_submissions and aggregation_method

Revision ID: b418eb1d7eca
Revises: add_esg_form_submissions, add_aggregation_method
Create Date: 2025-09-23 15:02:13.014542

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b418eb1d7eca'
down_revision: Union[str, Sequence[str], None] = ('add_esg_form_submissions', 'add_aggregation_method')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
