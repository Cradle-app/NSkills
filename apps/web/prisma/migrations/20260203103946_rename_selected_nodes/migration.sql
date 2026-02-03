/*
  Warnings:

  - You are about to drop the column `selected_node_types` on the `user_github_repos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_github_repos" DROP COLUMN "selected_node_types",
ADD COLUMN     "selected_nodes" TEXT[] DEFAULT ARRAY[]::TEXT[];
