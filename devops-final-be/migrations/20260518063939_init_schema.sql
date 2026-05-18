-- Create "audit_logs" table
CREATE TABLE "audit_logs" (
  "id" text NOT NULL,
  "table_name" text NOT NULL,
  "record_id" text NOT NULL,
  "user_id" text NOT NULL,
  "action" text NOT NULL,
  "old_value" text NULL,
  "new_value" text NULL,
  "created_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "roles" table
CREATE TABLE "roles" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uni_roles_name" UNIQUE ("name")
);
-- Create "users" table
CREATE TABLE "users" (
  "id" text NOT NULL,
  "role_id" text NOT NULL,
  "username" text NOT NULL,
  "email" text NOT NULL,
  "password" text NULL,
  "is_approve" boolean NOT NULL DEFAULT false,
  "first_name" text NULL,
  "last_name" text NULL,
  "nickname" text NULL,
  "gender" text NULL,
  "phone" text NULL,
  "profile_image" text NULL DEFAULT 'https://www.isranews.org/article/images/2025/Harry/6/Hun_Sen_July_2019.jpg',
  "created_at" timestamptz NULL,
  "updated_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uni_users_email" UNIQUE ("email"),
  CONSTRAINT "uni_users_username" UNIQUE ("username"),
  CONSTRAINT "fk_users_role" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "warehouse_items" table
CREATE TABLE "warehouse_items" (
  "id" text NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "description" text NULL,
  "quantity" bigint NOT NULL DEFAULT 0,
  "minimum_quantity" bigint NOT NULL DEFAULT 0,
  "unit" text NOT NULL,
  "category" text NOT NULL,
  "created_at" timestamptz NULL,
  "updated_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_warehouse_items_code" to table: "warehouse_items"
CREATE UNIQUE INDEX "idx_warehouse_items_code" ON "warehouse_items" ("code");
-- Create "warehouse_transactions" table
CREATE TABLE "warehouse_transactions" (
  "id" text NOT NULL,
  "code" text NOT NULL,
  "type" text NOT NULL,
  "item_id" text NULL,
  "item_code" text NOT NULL,
  "item_name" text NOT NULL,
  "quantity" bigint NOT NULL,
  "operator_user_id" text NOT NULL,
  "operator" text NOT NULL,
  "approval_status" text NOT NULL DEFAULT 'รออนุมัติ',
  "approved_by_user_id" text NULL,
  "approved_by" text NULL,
  "approved_at" timestamptz NULL,
  "rejected_by_user_id" text NULL,
  "rejected_by" text NULL,
  "rejected_at" timestamptz NULL,
  "rejection_reason" text NULL,
  "created_at" timestamptz NULL,
  "updated_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_warehouse_transactions_item" FOREIGN KEY ("item_id") REFERENCES "warehouse_items" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_warehouse_transactions_operator_user" FOREIGN KEY ("operator_user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "idx_warehouse_transactions_code" to table: "warehouse_transactions"
CREATE UNIQUE INDEX "idx_warehouse_transactions_code" ON "warehouse_transactions" ("code");
