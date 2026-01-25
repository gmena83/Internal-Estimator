import fs from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import { pipeline } from "stream/promises";

export interface IStorageProvider {
  /**
   * Saves a file from a stream.
   * @returns The URL or path to the saved file.
   */
  saveFile(projectId: string, fileName: string, stream: NodeJS.ReadableStream): Promise<string>;

  /**
   * Deletes a specific file.
   */
  deleteFile(projectId: string, fileName: string): Promise<void>;

  /**
   * Deletes an entire project directory.
   */
  deleteDirectory(projectId: string): Promise<void>;

  /**
   * Ensures the project directory exists.
   */
  ensureDirectory(projectId: string): Promise<void>;
}

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), "uploads");
  }

  private getProjectDir(projectId: string): string {
    return path.join(this.baseDir, projectId);
  }

  async ensureDirectory(projectId: string): Promise<void> {
    const dir = this.getProjectDir(projectId);
    await fs.mkdir(dir, { recursive: true });
  }

  async saveFile(
    projectId: string,
    fileName: string,
    stream: NodeJS.ReadableStream,
  ): Promise<string> {
    await this.ensureDirectory(projectId);
    const filePath = path.join(this.getProjectDir(projectId), fileName);
    const writeStream = createWriteStream(filePath);

    await pipeline(stream, writeStream);

    return `/uploads/${projectId}/${fileName}`;
  }

  async deleteFile(projectId: string, fileName: string): Promise<void> {
    const filePath = path.join(this.getProjectDir(projectId), fileName);
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  async deleteDirectory(projectId: string): Promise<void> {
    const dir = this.getProjectDir(projectId);
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

export const storageProvider = new LocalStorageProvider();
