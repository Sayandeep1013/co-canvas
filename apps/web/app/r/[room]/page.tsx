import { slugify } from "@canvas/shared";
import RoomPhase0 from "@/components/RoomPhase0";

/**
 * Room route. In Next 16 `params` is async. We normalize the slug here (server)
 * and hand it to the client component that runs the Yjs pipeline.
 */
export default async function RoomPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;
  const slug = slugify(decodeURIComponent(room));
  return <RoomPhase0 slug={slug} />;
}
