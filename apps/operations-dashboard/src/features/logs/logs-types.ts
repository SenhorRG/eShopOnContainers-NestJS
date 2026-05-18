export type LogRow = {
  id: string;
  timestamp: string;
  service: string;
  level: string;
  body: string;
  context: string;
  route: string;
  raw: string;
};
