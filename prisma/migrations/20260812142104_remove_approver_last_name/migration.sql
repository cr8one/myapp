/*
  Warnings:

  - You are about to drop the column `approver_last_name` on the `t_tokui_credit_request_approval_steps` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "t_tokui_credit_request_approval_steps" DROP COLUMN "approver_last_name";
