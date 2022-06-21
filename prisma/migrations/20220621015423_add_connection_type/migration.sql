/*
  Warnings:

  - Added the required column `type` to the `Connection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Connection" ADD COLUMN     "type" TEXT NOT NULL;
