import { OptionDefinition } from 'command-line-args';
import dwFolders from 'downloads-folder';
import path from 'path';

export const options: OptionDefinition[] = [
  {
    name: 'filter',
    alias: 'd',
    type: String,
    defaultValue: 'audioandvideo',
  },
  {
    name: 'videoquality',
    alias: 'v',
    type: String,
    defaultValue: 'highest',
  },
  {
    name: 'audioquality',
    alias: 'a',
    type: String,
    defaultValue: 'highest',
  },
  {
    name: 'outdir',
    alias: 'o',
    type: String,
    defaultValue: path.join(dwFolders(), 'ytd_downloads'),
  },
  {
    name: 'sample',
    type: Boolean,
    defaultValue: false,
  },
];
