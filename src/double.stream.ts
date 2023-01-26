import { Trackers } from './@types';
import cp from 'child_process';
import ffmpeg from 'ffmpeg-static';
import readline from 'readline';
import ytdl from 'ytdl-core';

interface DoubleStreamParams {
  trackers: Trackers;
  aq: string;
  vq: string;
  info: ytdl.videoInfo;
  filePath: string;
}

export const handleDoubleStream = (params: DoubleStreamParams) => {
  return new Promise<void>((resolve, reject) => {
    const { trackers, aq, vq, info, filePath } = params;

    const audioStream = ytdl
      .downloadFromInfo(info, {
        filter: 'audioonly',
        quality: aq,
      })
      .on('progress', (_, downloaded, total) => {
        trackers.audio = { downloaded, total };
      });
    const videoStream = ytdl
      .downloadFromInfo(info, {
        filter: 'videoonly',
        quality: vq,
      })
      .on('progress', (_, downloaded, total) => {
        trackers.video = { downloaded, total };
      });

    // Prepare the progress bar
    let progressbarHandle: NodeJS.Timeout;
    const progressbarInterval = 1000;
    const showProgress = () => {
      readline.cursorTo(process.stdout, 0);
      const toMB = (i: number) => (i / 1024 / 1024).toFixed(2);

      process.stdout.write(
        `audio  | ${(
          (trackers.audio.downloaded / trackers.audio.total) *
          100
        ).toFixed(2)}% processed `
      );
      process.stdout.write(
        `(${toMB(trackers.audio.downloaded)}MB of ${toMB(
          trackers.audio.total
        )}MB).${' '.repeat(10)}\n`
      );

      process.stdout.write(
        `video  | ${(
          (trackers.video.downloaded / trackers.video.total) *
          100
        ).toFixed(2)}% processed `
      );
      process.stdout.write(
        `(${toMB(trackers.video.downloaded)}MB of ${toMB(
          trackers.video.total
        )}MB).${' '.repeat(10)}\n`
      );

      process.stdout.write(
        `merged | processing frame ${trackers.merged.frame} `
      );
      process.stdout.write(
        `(at ${trackers.merged.fps} fps => ${
          trackers.merged.speed
        }).${' '.repeat(10)}\n`
      );

      process.stdout.write(
        `running for: ${((Date.now() - trackers.start) / 1000).toFixed(
          2
        )} seconds.`
      );
      readline.moveCursor(process.stdout, 0, -3);
    };

    // Start the ffmpeg child process
    const ffmpegProcess = cp.spawn(
      ffmpeg as string,
      [
        // Remove ffmpeg's console spamming
        '-loglevel',
        '8',
        '-hide_banner',
        // Redirect/Enable progress messages
        '-progress',
        'pipe:3',
        // Set inputs
        '-i',
        'pipe:4',
        '-i',
        'pipe:5',
        // Map audio & video from streams
        '-map',
        '0:a',
        '-map',
        '1:v',
        // Keep encoding
        '-c:v',
        'copy',
        // Define output file
        filePath,
        '-y',
      ],
      {
        windowsHide: true,
        stdio: [
          /* Standard: stdin, stdout, stderr */
          'inherit',
          'inherit',
          'inherit',
          /* Custom: pipe:3, pipe:4, pipe:5 */
          'pipe',
          'pipe',
          'pipe',
        ],
      }
    );

    ffmpegProcess.on('close', () => {
      process.stdout.write('\n\n\n\n');
      clearInterval(progressbarHandle);
      resolve();
    });

    if (
      ffmpegProcess.stdio[3] == null ||
      ffmpegProcess.stdio[4] == null ||
      ffmpegProcess.stdio[5 as number] == null
    ) {
      reject('unexpected stdio error (3/4/5)');
      return;
    }

    // Link streams
    // FFmpeg creates the transformer streams and we just have to insert / read data
    ffmpegProcess.stdio[3].on('data', chunk => {
      // Start the progress bar
      if (!progressbarHandle)
        progressbarHandle = setInterval(showProgress, progressbarInterval);
      // Parse the param=value list returned by ffmpeg
      const lines: string[] = chunk.toString().trim().split('\n');
      const args: any = {};
      for (const l of lines) {
        const [key, value] = l.split('=');
        const k = key.trim() as keyof typeof trackers['merged'];
        args[k] = value.trim();
      }
      trackers.merged = args;
    });

    audioStream.pipe(ffmpegProcess.stdio[4] as any);
    videoStream.pipe(ffmpegProcess.stdio[5 as number] as any);

    ffmpegProcess.on('error', err => reject(err));
  });
};
