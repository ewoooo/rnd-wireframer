export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
	public: {
		Tables: {
			screen_modules: {
				Row: {
					id: string;
					name: string;
					order: number;
				};
				Insert: {
					id: string;
					name: string;
					order: number;
				};
				Update: {
					id?: string;
					name?: string;
					order?: number;
				};
			};
			screen_routes: {
				Row: {
					id: string;
					module_id: string;
					name: string;
					order: number;
					process_id: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<Database["public"]["Tables"]["screen_routes"]["Row"], "created_at" | "updated_at">;
				Update: Partial<Database["public"]["Tables"]["screen_routes"]["Insert"]>;
			};
			screen_variants: {
				Row: {
					id: string;
					screen_route_id: string;
					name: string;
					order: number;
					variant_type: "base" | "edge";
					base_variant_id: string | null;
					trigger: string | null;
					difference_from_base: string | null;
					follow_up: string | null;
					source_ref: Json | null;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<Database["public"]["Tables"]["screen_variants"]["Row"], "created_at" | "updated_at">;
				Update: Partial<Database["public"]["Tables"]["screen_variants"]["Insert"]>;
			};
			screens: {
				Row: {
					id: string;
					screen_variant_id: string;
					version: string;
					min_renderer_version: string;
					order: number;
					pattern_id: string | null;
					pattern_variant: string | null;
					theme_mode: string;
					title: string | null;
					author: string | null;
					screen: Json;
					source_ref: Json | null;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<Database["public"]["Tables"]["screens"]["Row"], "created_at" | "updated_at">;
				Update: Partial<Database["public"]["Tables"]["screens"]["Insert"]>;
			};
			organisms: {
				Row: {
					id: string;
					type: string;
					version: string;
					pattern_id: string | null;
					pattern_variant: string | null;
					title: string | null;
					author: string | null;
					props: Json | null;
					children: Json | null;
					states: Json | null;
					policy_refs: Json | null;
					feature_refs: Json | null;
					source_ref: Json | null;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<Database["public"]["Tables"]["organisms"]["Row"], "created_at" | "updated_at">;
				Update: Partial<Database["public"]["Tables"]["organisms"]["Insert"]>;
			};
			components: {
				Row: {
					id: string;
					type: string;
					version: string;
					pattern_id: string | null;
					pattern_variant: string | null;
					title: string | null;
					author: string | null;
					props: Json | null;
					children: Json | null;
					hooks: Json | null;
					events: Json | null;
					display: Json | null;
					source_ref: Json | null;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<Database["public"]["Tables"]["components"]["Row"], "created_at" | "updated_at">;
				Update: Partial<Database["public"]["Tables"]["components"]["Insert"]>;
			};
			component_renderer_kinds: {
				Row: {
					type: string;
					kind: string;
				};
				Insert: Database["public"]["Tables"]["component_renderer_kinds"]["Row"];
				Update: Partial<Database["public"]["Tables"]["component_renderer_kinds"]["Row"]>;
			};
		};
	};
}
