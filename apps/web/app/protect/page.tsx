import { redirect } from 'next/navigation';
import { cleanDoor, doorQuery } from '@/lib/deeplink';
export const dynamic = 'force-dynamic';
/** The door other dApps link to. It sanitises the request, then opens Harbour pre-filled. */
export default async function Protect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = doorQuery(cleanDoor(await searchParams));
  redirect(q ? `/harbour?${q}` : '/harbour');
}
