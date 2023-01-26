import { OptionDefinition } from 'command-line-args';

export const options: OptionDefinition[] = [
  {
    name: 'url',
    alias: 'u',
    type: String,
  },
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
    name: 'sample',
    type: Boolean,
    defaultValue: false,
  },
];
