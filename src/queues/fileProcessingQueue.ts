import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../config/redis';
import logger from '../utils/logger';
import { FileModel } from '../models/File';
import { IFile, IFileProcessingJob } from '../types/types';
import { handleDidsRes } from '../utils/handelChecking';
import { writeNoromboFile } from '../utils/writeNoromboFile';
import { redis } from '../service/redisInstance';

export const fileProcessingQueue = new Queue('process-file', {
  connection: redisConnection,
});

export const fileProcessingWorker = new Worker(
  'process-file',
  async (job) => {
    const { callerIds, filePath, SFileId, redisFileKey } = job.data as IFileProcessingJob;

    logger.info(`🚀 Starting file processing job for ID: ${SFileId}`);

    try {
      const res = await handleDidsRes(callerIds);
      const pathToSave = `${filePath}_completed.xlsx`;

      const writeSuccess = await writeNoromboFile(res, pathToSave);
      if (!writeSuccess) {
        logger.error(`❌ Failed to write file to path: ${pathToSave}`);
        return;
      }

      const SFile = await FileModel.findById(SFileId);
      if (!SFile) {
        logger.error(`❌ File with ID ${SFileId} not found in database`);
        return;
      }

      // Update Redis cache
      try {
        const redisFiles = await redis.lrange(redisFileKey, 0, -1);

        if (redisFiles.length > 0) {
          const updatedFiles = redisFiles.map((fileStr) => {
            const file = JSON.parse(fileStr) as IFile;

            if (JSON.stringify(file._id) === SFileId || JSON.parse(JSON.stringify(file._id)) === SFileId) {
              file.state = 'completed';
              file.path = pathToSave;
            }

            return JSON.stringify(file);
          });

          await redis.multi()
            .del(redisFileKey)
            .rpush(redisFileKey, ...updatedFiles)
            .exec();

          logger.info(`✅ Redis file list updated for key: ${redisFileKey}`);
        }
      } catch (redisErr: unknown) {
        logger.error(`⚠️ Failed to update Redis for key ${redisFileKey}`, redisErr);
      }

      // Update MongoDB document
      SFile.state = 'completed';
      SFile.path = pathToSave;

      await SFile.save();
      logger.info(`✅ Successfully saved SFile ${SFileId} to database`);
    } catch (err) {
      logger.error(`🔥 Unhandled error during file processing`, err);
    }
  },
  {
    connection: redisConnection,
  }
);
