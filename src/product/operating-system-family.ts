/** The family a recognized operating system name belongs to. */
export const OperatingSystemFamily = {
  Unknown: 0,
  Windows: 1,
  MacOS: 2,
  Linux: 3,
  Android: 4,
  IOS: 5,
  IPadOS: 6,
  ChromeOS: 7,
  WatchOS: 8,
  Other: 9,
  None: 10,
} as const;

export type OperatingSystemFamily =
  (typeof OperatingSystemFamily)[keyof typeof OperatingSystemFamily];
