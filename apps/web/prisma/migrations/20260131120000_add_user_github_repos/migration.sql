-- CreateTable
CREATE TABLE "user_github_repos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repo_owner" TEXT NOT NULL,
    "repo_name" TEXT NOT NULL,
    "repo_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_github_repos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_github_repos_userId_repo_owner_repo_name_key" ON "user_github_repos"("userId", "repo_owner", "repo_name");

-- AddForeignKey
ALTER TABLE "user_github_repos" ADD CONSTRAINT "user_github_repos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
