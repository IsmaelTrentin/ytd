import { Presets, SingleBar } from 'cli-progress';

import fs from 'fs';
import ytdl from 'ytdl-core';

interface SingleStreamParams {
  filter: ytdl.Filter;
  aq: string;
  info: ytdl.videoInfo;
  fileName: string;
}

export const handleSingleStream = (params: SingleStreamParams) => {
  return new Promise<void>((resolve, reject) => {
    const { filter, info, aq, fileName } = params;

    const bar = new SingleBar({}, Presets.legacy);
    let started = false;

    const stream = ytdl
      .downloadFromInfo(info, {
        filter: filter,
        quality: aq,
      })
      .on('progress', (_, downloaded, total) => {
        if (!started) {
          bar.start(total, 0);
          started = true;
        }
        bar.update(downloaded);
      });

    const pipeProc = stream.pipe(fs.createWriteStream(fileName));

    stream.on('finish', () => {
      bar.stop();
      pipeProc.close();
      stream.destroy();
      resolve();
    });
    stream.on('error', err => reject(err));
  });
};
