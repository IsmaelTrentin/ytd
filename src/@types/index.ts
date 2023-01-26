export interface TrackersStream {
  downloaded: number;
  total: number;
}
export interface Trackers {
  start: number;
  audio: TrackersStream;
  video: TrackersStream;
  merged: { frame: number; speed: string; fps: number };
}
