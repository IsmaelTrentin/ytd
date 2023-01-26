import { Trackers } from './@types';
import cla from 'command-line-args';
import fs from 'fs';
import { handleDoubleStream } from './double.stream';
import { handleSingleStream } from './single.stream';
import { options } from './options';
import prompt from 'prompt-sync';
import sf from 'seconds-formater';
import ytdl from 'ytdl-core';

const main = async () => {
  return new Promise<void>(async (resolve, reject) => {
    let opts;
    try {
      opts = cla(options);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }

    let url: string | undefined = opts.url;
    let filter: string = opts.filter;
    let vq: string = opts.videoquality;
    let aq: string = opts.audioquality;

    if (url == undefined) {
      console.error('No url provided');
      console.log('Provide an url with --url');
      process.exit(1);
    }
    if (url.trim() === '') {
      console.error('Empty url');
      console.log('Provide an url with --url');
      process.exit(1);
    }

    if (opts.sample) {
      filter = 'audioonly';
      aq = 'highest';
      vq = 'lowest';
    }

    if (filter.trim() === '') {
      filter = 'audioandvideo';
    }
    if (vq.trim() === '') {
      vq = 'highestvideo';
    }
    if (aq.trim() === '') {
      aq = 'highestaudio';
    }

    const filterTypes = {
      audioonly: 1,
      videoonly: 3,
      audio: 5,
      video: 7,
      audioandvideo: 2,
      videoandaudio: 4,
    };
    if (!(filter in filterTypes)) {
      console.error(`Invalid filter '${filter}'`);
      console.log('Possible filters:\n  ', Object.keys(filterTypes).join(', '));
      process.exit(1);
    }
    const filterFlag = filterTypes[filter as keyof typeof filterTypes];

    console.log('Ismael Trentin - ytd © 2022');
    console.log('using ytdl-core and ffmpeg-static');
    console.log('---------------------------------');
    console.log();

    console.log(`- parameters${opts.sample ? ' (sampler mode)' : ''}:`);

    console.log('url:', url);
    console.log('dw filter:', filter);
    console.log('video quality:', vq);
    console.log('audio quality:', aq);
    console.log();

    const t1 = Date.now();
    const trackers: Trackers = {
      start: t1,
      audio: { downloaded: 0, total: Infinity },
      video: { downloaded: 0, total: Infinity },
      merged: { frame: 0, speed: '0x', fps: 0 },
    };

    process.stdout.write('fetching video infos...');

    const info = await ytdl.getInfo(url);
    const { title, author, lengthSeconds } = info.videoDetails;

    process.stdout.write('done\n');
    console.log('title:', title);
    console.log('author:', author.name);
    console.log('length:', sf.convert(parseInt(lengthSeconds)).format());
    console.log();

    const sanitizedTitle = title.replace(' ', '-');
    const ext = filterFlag === 1 || filterFlag === 5 ? 'mp3' : 'mp4';
    let fileName = `${sanitizedTitle}.${ext}`;

    if (fs.existsSync(fileName)) {
      const confirm = prompt()(
        `file ${fileName} already exists. Overwrite? Y/n `
      );
      if (confirm.toLowerCase() !== 'y') {
        fileName = `${Date.now()}.${fileName}`;
        console.log('New filename:', fileName);
      } else {
        console.log('overwriting');
      }
    }

    console.log('download started');

    if (filterFlag % 2 == 0) {
      console.log('(this mode will combine streams using ffmpeg)');
      await handleDoubleStream({
        aq,
        fileName,
        info,
        trackers,
        vq,
      });
    } else {
      await handleSingleStream({
        aq,
        fileName,
        filter: filter as ytdl.Filter,
        info,
      });
    }

    const t2 = Date.now();
    console.log(`done in ${(t2 - t1) / 1000}s`);
  });
};

main().catch(console.error);
