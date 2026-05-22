import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * 서버 사이드 전용 클라이언트 (RLS 우회 가능)
 * Server Components, Route Handlers, Server Actions 에서만 사용
 */
export function createServerClient() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

	return createClient<Database>(supabaseUrl, serviceRoleKey, {
		auth: { persistSession: false },
	});
}
