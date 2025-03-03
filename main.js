import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import simpleGit, { SimpleGit } from "simple-git";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Store in Lambda environment variables
const GITHUB_REPO = "username/repository";    // Replace with your GitHub repository
const TEMP_DIR = os.tmpdir();                 // Lambda's temporary directory

export const handler = async (event: any): Promise<any> => {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not set in environment variables.");
  }

  const git: SimpleGit = simpleGit(TEMP_DIR);
  const repoUrl = `https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`;

  try {
    // Clone the repository
    console.log("Cloning the repository...");
    await git.clone(repoUrl, TEMP_DIR);

    // Navigate to the repository folder
    const repoPath = path.join(TEMP_DIR, path.basename(GITHUB_REPO));
    process.chdir(repoPath);

    // Add or update a file
    const filePath = path.join(repoPath, "daily_update.txt");
    const content = `Daily update: ${new Date().toISOString()}\n`;
    fs.appendFileSync(filePath, content);

    // Commit and push changes
    console.log("Adding changes...");
    await git.add(".");
    console.log("Committing changes...");
    await git.commit("Daily update via Lambda");
    console.log("Pushing changes...");
    await git.push();

    return {
      statusCode: 200,
      body: "Successfully updated the GitHub repository.",
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: `Error: ${error.message}`,
    };
  }
};
