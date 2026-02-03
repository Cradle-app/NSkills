-- Drop JSON column if it was added previously
ALTER TABLE "user_github_repos" DROP COLUMN IF EXISTS "selectedNodes";

-- Add native PostgreSQL array of node/plugin types
ALTER TABLE "user_github_repos" ADD COLUMN IF NOT EXISTS "selected_node_types" TEXT[] DEFAULT ARRAY[]::TEXT[];
