"""add ON DELETE CASCADE to esg_kpi_mappings.kpi_code"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "8c2b7c9f4e01"  # 🔹 new unique ID
down_revision = "7b9e4c3f2d10"  # 🔹 your last migration (weights cascade)
branch_labels = None
depends_on = None


def upgrade():
    # Drop the old foreign key constraint
    op.drop_constraint(
        "esg_kpi_mappings_kpi_code_fkey",
        "esg_kpi_mappings",
        type_="foreignkey"
    )

    # Add the new foreign key with ON DELETE CASCADE
    op.create_foreign_key(
        "esg_kpi_mappings_kpi_code_fkey",
        "esg_kpi_mappings",
        "esg_kpis",
        ["kpi_code"],
        ["kpi_code"],
        ondelete="CASCADE"
    )


def downgrade():
    # Drop the cascade FK
    op.drop_constraint(
        "esg_kpi_mappings_kpi_code_fkey",
        "esg_kpi_mappings",
        type_="foreignkey"
    )

    # Restore the old one without cascade
    op.create_foreign_key(
        "esg_kpi_mappings_kpi_code_fkey",
        "esg_kpi_mappings",
        "esg_kpis",
        ["kpi_code"],
        ["kpi_code"]
    )
