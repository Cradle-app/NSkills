import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/user/repos
 * Save a GitHub repo submission for the user (by wallet address).
 * Body: { walletAddress, repo_owner, repo_name, repo_url?, selected_nodes? }
 * selected_nodes: array of { type: string } or string[] — stored as native DB array of node type strings.
 * In the database this is stored as `selected_nodes` (text[]).
 */
export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database client not initialized" },
      { status: 500 }
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      walletAddress,
      repo_owner,
      repo_name,
      repo_url,
      selected_nodes: rawSelectedNodes,
    } = body;

    if (!walletAddress || !repo_owner || !repo_name) {
      return NextResponse.json(
        { error: "walletAddress, repo_owner, and repo_name are required" },
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { wallet_address: normalizedAddress },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Connect wallet and link GitHub first." },
        { status: 404 }
      );
    }

    // Normalize selected_nodes → string[] (native array of node type strings)
    const selected_nodes: string[] = Array.isArray(rawSelectedNodes)
      ? rawSelectedNodes
          .filter((n: unknown) => {
            if (typeof n === "string") return n.length > 0;
            return (
              n &&
              typeof n === "object" &&
              "type" in n &&
              typeof (n as { type: unknown }).type === "string"
            );
          })
          .map((n: unknown) =>
            typeof n === "string" ? n : (n as { type: string }).type
          )
      : [];

    const repo = await prisma.userGithubRepo.upsert({
      where: {
        userId_repo_owner_repo_name: {
          userId: user.id,
          repo_owner,
          repo_name,
        },
      },
      update: {
        ...(repo_url !== undefined && { repo_url: repo_url ?? undefined }),
        ...(Array.isArray(rawSelectedNodes) && { selected_nodes }),
      } as { repo_url?: string; selected_nodes?: string[] },
      create: {
        userId: user.id,
        repo_owner,
        repo_name,
        repo_url: repo_url ?? null,
        selected_nodes,
      } as Parameters<typeof prisma.userGithubRepo.upsert>[0]["create"],
    });

    const repoWithNodes = repo as typeof repo & {
      selected_nodes: string[];
    };

    return NextResponse.json({
      success: true,
      repo: {
        id: repo.id,
        repo_owner: repo.repo_owner,
        repo_name: repo.repo_name,
        repo_url: repo.repo_url,
        selected_nodes: repoWithNodes.selected_nodes ?? [],
      },
    });
  } catch (error: unknown) {
    console.error("Error saving user repo:", error);
    return NextResponse.json(
      { error: "Failed to save repository" },
      { status: 500 }
    );
  }
}
