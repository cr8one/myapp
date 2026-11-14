/*
  Warnings:

  - You are about to drop the column `meal_a` on the `t_acct_meal_advances` table. All the data in the column will be lost.
  - You are about to drop the column `meal_b` on the `t_acct_meal_advances` table. All the data in the column will be lost.
  - You are about to drop the column `other_items` on the `t_acct_meal_advances` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "t_acct_meal_advances" DROP COLUMN "meal_a",
DROP COLUMN "meal_b",
DROP COLUMN "other_items",
ADD COLUMN     "items" JSONB;
