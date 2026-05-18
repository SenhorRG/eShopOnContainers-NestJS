/** gRPC `@grpc/grpc-js` `Metadata`-compatible subset (avoids hard dependency). */
export type GrpcAuthorizationMetadata = {
  get(key: string): unknown[];
};

/** Extract `Bearer` token raw value from lowercase `authorization` metadata (Nest gRPC). */
export function extractBearerFromGrpcMetadata(metadata: GrpcAuthorizationMetadata | undefined): string | null {
  if (!metadata) return null;

  const values = metadata.get('authorization');
  const headerRaw = typeof values?.[0] === 'string' ? values[0] : '';
  const tokenMatch = /^Bearer\s+(.+)$/i.exec(headerRaw.trim());
  const token = tokenMatch?.[1]?.trim();
  return token?.length ? token : null;
}
