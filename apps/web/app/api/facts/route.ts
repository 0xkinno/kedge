import facts from '@/data/FACTS.json';
import { json } from '@/lib/server';
export const dynamic = 'force-static';
export const GET = () => json(facts);
