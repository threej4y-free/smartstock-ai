"""Add the inventory expiration policy.

Revision ID: 20260827_0002
Revises: 20260827_0001
Create Date: 2026-08-27
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260827_0002"
down_revision: str | None = "20260827_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    policy = op.create_table(
        "inventory_policy",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("expiration_safety_days", sa.Integer(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint("id = 1", name="ck_inventory_policy_singleton"),
        sa.CheckConstraint(
            "expiration_safety_days >= 0",
            name="ck_inventory_policy_expiration_safety_nonnegative",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.bulk_insert(policy, [{"id": 1, "expiration_safety_days": 2}])


def downgrade() -> None:
    op.drop_table("inventory_policy")
