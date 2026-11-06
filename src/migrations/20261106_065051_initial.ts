import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_vehicles_monthlies_formula" AS ENUM('loa', 'lld', 'credit');
  CREATE TYPE "public"."enum_vehicles_sale_status" AS ENUM('available', 'reserved', 'sold');
  CREATE TYPE "public"."enum_vehicles_fuel" AS ENUM('essence', 'diesel', 'hybride', 'hybride-rechargeable', 'electrique', 'gpl');
  CREATE TYPE "public"."enum_vehicles_gearbox" AS ENUM('manuelle', 'automatique');
  CREATE TYPE "public"."enum_vehicles_body_type" AS ENUM('citadine', 'berline', 'break', 'suv', 'monospace', 'coupe', 'utilitaire');
  CREATE TYPE "public"."enum_vehicles_crit_air" AS ENUM('0', '1', '2', '3', '4', '5');
  CREATE TYPE "public"."enum_vehicles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__vehicles_v_version_monthlies_formula" AS ENUM('loa', 'lld', 'credit');
  CREATE TYPE "public"."enum__vehicles_v_version_fuel" AS ENUM('essence', 'diesel', 'hybride', 'hybride-rechargeable', 'electrique', 'gpl');
  CREATE TYPE "public"."enum__vehicles_v_version_gearbox" AS ENUM('manuelle', 'automatique');
  CREATE TYPE "public"."enum__vehicles_v_version_body_type" AS ENUM('citadine', 'berline', 'break', 'suv', 'monospace', 'coupe', 'utilitaire');
  CREATE TYPE "public"."enum__vehicles_v_version_crit_air" AS ENUM('0', '1', '2', '3', '4', '5');
  CREATE TYPE "public"."enum__vehicles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_requests_history_status" AS ENUM('new', 'review', 'approved', 'refused', 'delivered');
  CREATE TYPE "public"."enum_requests_type" AS ENUM('financing', 'tradein', 'contact', 'callback');
  CREATE TYPE "public"."enum_requests_status" AS ENUM('new', 'review', 'approved', 'refused', 'delivered');
  CREATE TYPE "public"."enum_requests_formula" AS ENUM('loa', 'lld', 'credit');
  CREATE TYPE "public"."enum_requests_profile" AS ENUM('cdi', 'cdd', 'independant', 'societe', 'retraite', 'autre');
  CREATE TYPE "public"."enum_documents_kind" AS ENUM('id', 'address', 'payslips', 'tax', 'rib', 'kbis', 'accounts', 'bank', 'tradein-photo', 'other');
  CREATE TYPE "public"."enum_appointments_kind" AS ENUM('test-drive', 'visit', 'delivery');
  CREATE TYPE "public"."enum_appointments_status" AS ENUM('confirmed', 'cancelled', 'done');
  CREATE TYPE "public"."enum_subscribers_criteria_fuels" AS ENUM('essence', 'diesel', 'hybride', 'hybride-rechargeable', 'electrique', 'gpl');
  CREATE TYPE "public"."enum_campaigns_status" AS ENUM('draft', 'sent');
  CREATE TYPE "public"."enum_reviews_source" AS ENUM('google');
  CREATE TYPE "public"."enum_faqs_category" AS ENUM('general', 'loa', 'lld', 'credit', 'dossier', 'livraison');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_local_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__local_pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'commercial');
  CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  CREATE TYPE "public"."enum_redirects_to_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_agenda_weekly_day" AS ENUM('1', '2', '3', '4', '5', '6', '0');
  CREATE TABLE "vehicles_equipment" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "vehicles_monthlies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"formula" "enum_vehicles_monthlies_formula",
  	"manual" boolean DEFAULT false,
  	"amount" numeric,
  	"months" numeric,
  	"deposit" numeric
  );
  
  CREATE TABLE "vehicles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_id" integer,
  	"model_id" integer,
  	"title" varchar,
  	"reference" varchar,
  	"slug" varchar,
  	"status" "enum_vehicles_sale_status" DEFAULT 'available',
  	"sold_at" timestamp(3) with time zone,
  	"alerts_sent_at" timestamp(3) with time zone,
  	"featured" boolean DEFAULT false,
  	"year" numeric,
  	"first_registration" timestamp(3) with time zone,
  	"mileage" numeric,
  	"fuel" "enum_vehicles_fuel",
  	"gearbox" "enum_vehicles_gearbox",
  	"body_type" "enum_vehicles_body_type",
  	"power_hp" numeric,
  	"fiscal_hp" numeric,
  	"doors" numeric,
  	"seats" numeric,
  	"color" varchar,
  	"co2" numeric,
  	"crit_air" "enum_vehicles_crit_air",
  	"warranty_months" numeric DEFAULT 12,
  	"description" jsonb,
  	"price" numeric,
  	"monthly_from" numeric,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_vehicles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "vehicles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_vehicles_v_version_equipment" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_vehicles_v_version_monthlies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"formula" "enum__vehicles_v_version_monthlies_formula",
  	"manual" boolean DEFAULT false,
  	"amount" numeric,
  	"months" numeric,
  	"deposit" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_vehicles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_brand_id" integer,
  	"version_model_id" integer,
  	"version_title" varchar,
  	"version_reference" varchar,
  	"version_slug" varchar,
  	"version_status" "enum_vehicles_sale_status" DEFAULT 'available',
  	"version_sold_at" timestamp(3) with time zone,
  	"version_alerts_sent_at" timestamp(3) with time zone,
  	"version_featured" boolean DEFAULT false,
  	"version_year" numeric,
  	"version_first_registration" timestamp(3) with time zone,
  	"version_mileage" numeric,
  	"version_fuel" "enum__vehicles_v_version_fuel",
  	"version_gearbox" "enum__vehicles_v_version_gearbox",
  	"version_body_type" "enum__vehicles_v_version_body_type",
  	"version_power_hp" numeric,
  	"version_fiscal_hp" numeric,
  	"version_doors" numeric,
  	"version_seats" numeric,
  	"version_color" varchar,
  	"version_co2" numeric,
  	"version_crit_air" "enum__vehicles_v_version_crit_air",
  	"version_warranty_months" numeric DEFAULT 12,
  	"version_description" jsonb,
  	"version_price" numeric,
  	"version_monthly_from" numeric,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__vehicles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_vehicles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"logo_id" integer,
  	"intro" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "models" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"intro" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "requests_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"author_id" integer,
  	"at" timestamp(3) with time zone
  );
  
  CREATE TABLE "requests_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"status" "enum_requests_history_status",
  	"at" timestamp(3) with time zone,
  	"by_id" integer
  );
  
  CREATE TABLE "requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar,
  	"type" "enum_requests_type" NOT NULL,
  	"status" "enum_requests_status" DEFAULT 'new' NOT NULL,
  	"assigned_to_id" integer,
  	"last_action_at" timestamp(3) with time zone,
  	"delivered_at" timestamp(3) with time zone,
  	"review_requested_at" timestamp(3) with time zone,
  	"team_reminded_at" timestamp(3) with time zone,
  	"source" varchar,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"postal_code" varchar,
  	"message" varchar,
  	"marketing_consent" boolean DEFAULT false,
  	"vehicle_id" integer,
  	"formula" "enum_requests_formula",
  	"months" numeric,
  	"deposit" numeric,
  	"profile" "enum_requests_profile",
  	"monthly_income" numeric,
  	"monthly_budget" numeric,
  	"missing_documents" boolean DEFAULT true,
  	"reminders_sent" numeric DEFAULT 0,
  	"trade_in_brand" varchar,
  	"trade_in_model" varchar,
  	"trade_in_year" numeric,
  	"trade_in_mileage" numeric,
  	"trade_in_estimate" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "requests_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"documents_id" integer
  );
  
  CREATE TABLE "documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"request_id" integer,
  	"kind" "enum_documents_kind",
  	"delete_after" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "appointments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"kind" "enum_appointments_kind" NOT NULL,
  	"status" "enum_appointments_status" DEFAULT 'confirmed' NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"vehicle_id" integer,
  	"request_id" integer,
  	"reminder_sent" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subscribers_criteria_fuels" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_subscribers_criteria_fuels",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"first_name" varchar,
  	"newsletter" boolean DEFAULT false,
  	"alert_enabled" boolean DEFAULT false,
  	"criteria_max_price" numeric,
  	"criteria_max_monthly" numeric,
  	"criteria_max_mileage" numeric,
  	"consent_at" timestamp(3) with time zone NOT NULL,
  	"unsubscribe_token" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subscribers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"brands_id" integer
  );
  
  CREATE TABLE "campaigns" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subject" varchar NOT NULL,
  	"intro" varchar,
  	"send_now" boolean DEFAULT false,
  	"status" "enum_campaigns_status" DEFAULT 'draft',
  	"sent_at" timestamp(3) with time zone,
  	"sent_count" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "campaigns_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"vehicles_id" integer
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"first_name" varchar NOT NULL,
  	"rating" numeric NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"text" varchar NOT NULL,
  	"source" "enum_reviews_source" DEFAULT 'google',
  	"source_id" varchar,
  	"featured" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" jsonb NOT NULL,
  	"category" "enum_faqs_category" NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"cover_id" integer,
  	"excerpt" varchar,
  	"content" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_cover_id" integer,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "local_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"city" varchar,
  	"slug" varchar,
  	"headline" varchar,
  	"content" jsonb,
  	"distance_note" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_local_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_local_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_city" varchar,
  	"version_slug" varchar,
  	"version_headline" varchar,
  	"version_content" jsonb,
  	"version_distance_note" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__local_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"disabled" boolean DEFAULT false,
  	"role" "enum_users_role" DEFAULT 'commercial' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"format" "enum_exports_format" DEFAULT 'csv' NOT NULL,
  	"limit" numeric,
  	"page" numeric DEFAULT 1,
  	"sort" varchar,
  	"sort_order" "enum_exports_sort_order",
  	"drafts" "enum_exports_drafts" DEFAULT 'yes',
  	"collection_slug" varchar DEFAULT 'subscribers' NOT NULL,
  	"where" jsonb DEFAULT '{}'::jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "exports_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "imports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"collection_slug" varchar NOT NULL,
  	"import_mode" "enum_imports_import_mode",
  	"match_field" varchar DEFAULT 'id',
  	"status" "enum_imports_status" DEFAULT 'pending',
  	"summary_imported" numeric,
  	"summary_updated" numeric,
  	"summary_total" numeric,
  	"summary_issues" numeric,
  	"summary_issue_details" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to_type" "enum_redirects_to_type" DEFAULT 'reference',
  	"to_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "redirects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"vehicles_id" integer,
  	"articles_id" integer,
  	"local_pages_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"vehicles_id" integer,
  	"brands_id" integer,
  	"models_id" integer,
  	"requests_id" integer,
  	"documents_id" integer,
  	"appointments_id" integer,
  	"subscribers_id" integer,
  	"campaigns_id" integer,
  	"reviews_id" integer,
  	"faqs_id" integer,
  	"articles_id" integer,
  	"local_pages_id" integer,
  	"media_id" integer,
  	"users_id" integer,
  	"redirects_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "homepage_hero_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_title" varchar DEFAULT 'Votre voiture d’occasion contrôlée, financée en LOA, LLD ou crédit' NOT NULL,
  	"hero_subtitle" varchar DEFAULT 'Réponse sous 48 h, garantie 12 mois, livraison partout en France.',
  	"hero_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"faqs_id" integer
  );
  
  CREATE TABLE "agency" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Lease Auto, votre spécialiste de l’occasion financée',
  	"intro" varchar DEFAULT 'Depuis notre agence d’Épinay-sur-Seine, nous sélectionnons des véhicules d’occasion contrôlés et trouvons le financement adapté à chaque profil.',
  	"content" jsonb,
  	"map_embed_url" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "agency_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "settings_opening_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"days" varchar NOT NULL,
  	"hours" varchar NOT NULL
  );
  
  CREATE TABLE "settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"company_name" varchar DEFAULT 'Lease Auto',
  	"company_legal_form" varchar,
  	"company_siren" varchar,
  	"company_rcs" varchar,
  	"company_orias" varchar,
  	"company_address" varchar DEFAULT '42 boulevard Foch',
  	"company_postal_code" varchar DEFAULT '93800',
  	"company_city" varchar DEFAULT 'Épinay-sur-Seine',
  	"company_phone" varchar DEFAULT '01 84 21 83 93',
  	"company_whatsapp" varchar,
  	"company_email" varchar DEFAULT 'contact@lease-auto.fr',
  	"company_maps_url" varchar,
  	"company_google_review_url" varchar,
  	"social_facebook" varchar,
  	"social_instagram" varchar,
  	"social_tiktok" varchar,
  	"financing_loa_enabled" boolean DEFAULT true,
  	"financing_loa_annual_rate" numeric,
  	"financing_loa_taeg" numeric,
  	"financing_loa_min_months" numeric DEFAULT 12,
  	"financing_loa_max_months" numeric DEFAULT 84,
  	"financing_loa_default_months" numeric DEFAULT 48,
  	"financing_loa_default_deposit_percent" numeric DEFAULT 0,
  	"financing_loa_residual_percent" numeric DEFAULT 35,
  	"financing_loa_representative_example" varchar,
  	"financing_lld_enabled" boolean DEFAULT true,
  	"financing_lld_annual_rate" numeric,
  	"financing_lld_taeg" numeric,
  	"financing_lld_min_months" numeric DEFAULT 12,
  	"financing_lld_max_months" numeric DEFAULT 84,
  	"financing_lld_default_months" numeric DEFAULT 48,
  	"financing_lld_default_deposit_percent" numeric DEFAULT 0,
  	"financing_lld_residual_percent" numeric DEFAULT 35,
  	"financing_lld_representative_example" varchar,
  	"financing_credit_enabled" boolean DEFAULT true,
  	"financing_credit_annual_rate" numeric,
  	"financing_credit_taeg" numeric,
  	"financing_credit_min_months" numeric DEFAULT 12,
  	"financing_credit_max_months" numeric DEFAULT 72,
  	"financing_credit_default_months" numeric DEFAULT 48,
  	"financing_credit_default_deposit_percent" numeric DEFAULT 0,
  	"financing_credit_representative_example" varchar,
  	"financing_legal_notice" varchar DEFAULT 'Un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant de vous engager.',
  	"retention_sold_visible_days" numeric DEFAULT 15,
  	"retention_documents_days" numeric DEFAULT 90,
  	"retention_internal_reminder_hours" numeric DEFAULT 24,
  	"retention_review_request_days" numeric DEFAULT 5,
  	"legal_notice" jsonb,
  	"privacy_policy" jsonb,
  	"terms" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "agenda_weekly" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" "enum_agenda_weekly_day" NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL
  );
  
  CREATE TABLE "agenda_closures" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"from" timestamp(3) with time zone NOT NULL,
  	"to" timestamp(3) with time zone NOT NULL,
  	"reason" varchar
  );
  
  CREATE TABLE "agenda" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slot_minutes" numeric DEFAULT 45,
  	"min_notice_hours" numeric DEFAULT 4,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "vehicles_equipment" ADD CONSTRAINT "vehicles_equipment_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vehicles_monthlies" ADD CONSTRAINT "vehicles_monthlies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vehicles_rels" ADD CONSTRAINT "vehicles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vehicles_rels" ADD CONSTRAINT "vehicles_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vehicles_v_version_equipment" ADD CONSTRAINT "_vehicles_v_version_equipment_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vehicles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vehicles_v_version_monthlies" ADD CONSTRAINT "_vehicles_v_version_monthlies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vehicles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vehicles_v" ADD CONSTRAINT "_vehicles_v_parent_id_vehicles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vehicles_v" ADD CONSTRAINT "_vehicles_v_version_brand_id_brands_id_fk" FOREIGN KEY ("version_brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vehicles_v" ADD CONSTRAINT "_vehicles_v_version_model_id_models_id_fk" FOREIGN KEY ("version_model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vehicles_v" ADD CONSTRAINT "_vehicles_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vehicles_v_rels" ADD CONSTRAINT "_vehicles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_vehicles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vehicles_v_rels" ADD CONSTRAINT "_vehicles_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "models" ADD CONSTRAINT "models_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "requests_notes" ADD CONSTRAINT "requests_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "requests_notes" ADD CONSTRAINT "requests_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "requests_history" ADD CONSTRAINT "requests_history_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "requests_history" ADD CONSTRAINT "requests_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "requests" ADD CONSTRAINT "requests_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "requests" ADD CONSTRAINT "requests_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "requests_rels" ADD CONSTRAINT "requests_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "requests_rels" ADD CONSTRAINT "requests_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "documents" ADD CONSTRAINT "documents_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appointments" ADD CONSTRAINT "appointments_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appointments" ADD CONSTRAINT "appointments_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscribers_criteria_fuels" ADD CONSTRAINT "subscribers_criteria_fuels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscribers_rels" ADD CONSTRAINT "subscribers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscribers_rels" ADD CONSTRAINT "subscribers_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "campaigns_rels" ADD CONSTRAINT "campaigns_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "campaigns_rels" ADD CONSTRAINT "campaigns_rels_vehicles_fk" FOREIGN KEY ("vehicles_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "local_pages" ADD CONSTRAINT "local_pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_local_pages_v" ADD CONSTRAINT "_local_pages_v_parent_id_local_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."local_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_local_pages_v" ADD CONSTRAINT "_local_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_vehicles_fk" FOREIGN KEY ("vehicles_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_local_pages_fk" FOREIGN KEY ("local_pages_id") REFERENCES "public"."local_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vehicles_fk" FOREIGN KEY ("vehicles_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_models_fk" FOREIGN KEY ("models_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_requests_fk" FOREIGN KEY ("requests_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_appointments_fk" FOREIGN KEY ("appointments_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk" FOREIGN KEY ("subscribers_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_campaigns_fk" FOREIGN KEY ("campaigns_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_local_pages_fk" FOREIGN KEY ("local_pages_id") REFERENCES "public"."local_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_hero_badges" ADD CONSTRAINT "homepage_hero_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_stats" ADD CONSTRAINT "homepage_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_steps" ADD CONSTRAINT "homepage_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agency_rels" ADD CONSTRAINT "agency_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."agency"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agency_rels" ADD CONSTRAINT "agency_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_opening_hours" ADD CONSTRAINT "settings_opening_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_texts" ADD CONSTRAINT "settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agenda_weekly" ADD CONSTRAINT "agenda_weekly_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."agenda"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agenda_closures" ADD CONSTRAINT "agenda_closures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."agenda"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "vehicles_equipment_order_idx" ON "vehicles_equipment" USING btree ("_order");
  CREATE INDEX "vehicles_equipment_parent_id_idx" ON "vehicles_equipment" USING btree ("_parent_id");
  CREATE INDEX "vehicles_monthlies_order_idx" ON "vehicles_monthlies" USING btree ("_order");
  CREATE INDEX "vehicles_monthlies_parent_id_idx" ON "vehicles_monthlies" USING btree ("_parent_id");
  CREATE INDEX "vehicles_brand_idx" ON "vehicles" USING btree ("brand_id");
  CREATE INDEX "vehicles_model_idx" ON "vehicles" USING btree ("model_id");
  CREATE INDEX "vehicles_reference_idx" ON "vehicles" USING btree ("reference");
  CREATE UNIQUE INDEX "vehicles_slug_idx" ON "vehicles" USING btree ("slug");
  CREATE INDEX "vehicles_status_idx" ON "vehicles" USING btree ("status");
  CREATE INDEX "vehicles_fuel_idx" ON "vehicles" USING btree ("fuel");
  CREATE INDEX "vehicles_body_type_idx" ON "vehicles" USING btree ("body_type");
  CREATE INDEX "vehicles_monthly_from_idx" ON "vehicles" USING btree ("monthly_from");
  CREATE INDEX "vehicles_meta_meta_image_idx" ON "vehicles" USING btree ("meta_image_id");
  CREATE INDEX "vehicles_updated_at_idx" ON "vehicles" USING btree ("updated_at");
  CREATE INDEX "vehicles_created_at_idx" ON "vehicles" USING btree ("created_at");
  CREATE INDEX "vehicles__status_idx" ON "vehicles" USING btree ("_status");
  CREATE INDEX "vehicles_rels_order_idx" ON "vehicles_rels" USING btree ("order");
  CREATE INDEX "vehicles_rels_parent_idx" ON "vehicles_rels" USING btree ("parent_id");
  CREATE INDEX "vehicles_rels_path_idx" ON "vehicles_rels" USING btree ("path");
  CREATE INDEX "vehicles_rels_media_id_idx" ON "vehicles_rels" USING btree ("media_id");
  CREATE INDEX "_vehicles_v_version_equipment_order_idx" ON "_vehicles_v_version_equipment" USING btree ("_order");
  CREATE INDEX "_vehicles_v_version_equipment_parent_id_idx" ON "_vehicles_v_version_equipment" USING btree ("_parent_id");
  CREATE INDEX "_vehicles_v_version_monthlies_order_idx" ON "_vehicles_v_version_monthlies" USING btree ("_order");
  CREATE INDEX "_vehicles_v_version_monthlies_parent_id_idx" ON "_vehicles_v_version_monthlies" USING btree ("_parent_id");
  CREATE INDEX "_vehicles_v_parent_idx" ON "_vehicles_v" USING btree ("parent_id");
  CREATE INDEX "_vehicles_v_version_version_brand_idx" ON "_vehicles_v" USING btree ("version_brand_id");
  CREATE INDEX "_vehicles_v_version_version_model_idx" ON "_vehicles_v" USING btree ("version_model_id");
  CREATE INDEX "_vehicles_v_version_version_reference_idx" ON "_vehicles_v" USING btree ("version_reference");
  CREATE INDEX "_vehicles_v_version_version_slug_idx" ON "_vehicles_v" USING btree ("version_slug");
  CREATE INDEX "_vehicles_v_version_version_status_idx" ON "_vehicles_v" USING btree ("version_status");
  CREATE INDEX "_vehicles_v_version_version_fuel_idx" ON "_vehicles_v" USING btree ("version_fuel");
  CREATE INDEX "_vehicles_v_version_version_body_type_idx" ON "_vehicles_v" USING btree ("version_body_type");
  CREATE INDEX "_vehicles_v_version_version_monthly_from_idx" ON "_vehicles_v" USING btree ("version_monthly_from");
  CREATE INDEX "_vehicles_v_version_meta_version_meta_image_idx" ON "_vehicles_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_vehicles_v_version_version_updated_at_idx" ON "_vehicles_v" USING btree ("version_updated_at");
  CREATE INDEX "_vehicles_v_version_version_created_at_idx" ON "_vehicles_v" USING btree ("version_created_at");
  CREATE INDEX "_vehicles_v_version_version__status_idx" ON "_vehicles_v" USING btree ("version__status");
  CREATE INDEX "_vehicles_v_created_at_idx" ON "_vehicles_v" USING btree ("created_at");
  CREATE INDEX "_vehicles_v_updated_at_idx" ON "_vehicles_v" USING btree ("updated_at");
  CREATE INDEX "_vehicles_v_latest_idx" ON "_vehicles_v" USING btree ("latest");
  CREATE INDEX "_vehicles_v_rels_order_idx" ON "_vehicles_v_rels" USING btree ("order");
  CREATE INDEX "_vehicles_v_rels_parent_idx" ON "_vehicles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_vehicles_v_rels_path_idx" ON "_vehicles_v_rels" USING btree ("path");
  CREATE INDEX "_vehicles_v_rels_media_id_idx" ON "_vehicles_v_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "brands_name_idx" ON "brands" USING btree ("name");
  CREATE UNIQUE INDEX "brands_slug_idx" ON "brands" USING btree ("slug");
  CREATE INDEX "brands_logo_idx" ON "brands" USING btree ("logo_id");
  CREATE INDEX "brands_meta_meta_image_idx" ON "brands" USING btree ("meta_image_id");
  CREATE INDEX "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "brands" USING btree ("created_at");
  CREATE INDEX "models_brand_idx" ON "models" USING btree ("brand_id");
  CREATE INDEX "models_slug_idx" ON "models" USING btree ("slug");
  CREATE INDEX "models_meta_meta_image_idx" ON "models" USING btree ("meta_image_id");
  CREATE INDEX "models_updated_at_idx" ON "models" USING btree ("updated_at");
  CREATE INDEX "models_created_at_idx" ON "models" USING btree ("created_at");
  CREATE UNIQUE INDEX "brand_slug_idx" ON "models" USING btree ("brand_id","slug");
  CREATE INDEX "requests_notes_order_idx" ON "requests_notes" USING btree ("_order");
  CREATE INDEX "requests_notes_parent_id_idx" ON "requests_notes" USING btree ("_parent_id");
  CREATE INDEX "requests_notes_author_idx" ON "requests_notes" USING btree ("author_id");
  CREATE INDEX "requests_history_order_idx" ON "requests_history" USING btree ("_order");
  CREATE INDEX "requests_history_parent_id_idx" ON "requests_history" USING btree ("_parent_id");
  CREATE INDEX "requests_history_by_idx" ON "requests_history" USING btree ("by_id");
  CREATE UNIQUE INDEX "requests_reference_idx" ON "requests" USING btree ("reference");
  CREATE INDEX "requests_type_idx" ON "requests" USING btree ("type");
  CREATE INDEX "requests_status_idx" ON "requests" USING btree ("status");
  CREATE INDEX "requests_assigned_to_idx" ON "requests" USING btree ("assigned_to_id");
  CREATE INDEX "requests_vehicle_idx" ON "requests" USING btree ("vehicle_id");
  CREATE INDEX "requests_updated_at_idx" ON "requests" USING btree ("updated_at");
  CREATE INDEX "requests_created_at_idx" ON "requests" USING btree ("created_at");
  CREATE INDEX "requests_rels_order_idx" ON "requests_rels" USING btree ("order");
  CREATE INDEX "requests_rels_parent_idx" ON "requests_rels" USING btree ("parent_id");
  CREATE INDEX "requests_rels_path_idx" ON "requests_rels" USING btree ("path");
  CREATE INDEX "requests_rels_documents_id_idx" ON "requests_rels" USING btree ("documents_id");
  CREATE INDEX "documents_request_idx" ON "documents" USING btree ("request_id");
  CREATE INDEX "documents_delete_after_idx" ON "documents" USING btree ("delete_after");
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "documents_filename_idx" ON "documents" USING btree ("filename");
  CREATE INDEX "appointments_starts_at_idx" ON "appointments" USING btree ("starts_at");
  CREATE INDEX "appointments_vehicle_idx" ON "appointments" USING btree ("vehicle_id");
  CREATE INDEX "appointments_request_idx" ON "appointments" USING btree ("request_id");
  CREATE INDEX "appointments_updated_at_idx" ON "appointments" USING btree ("updated_at");
  CREATE INDEX "appointments_created_at_idx" ON "appointments" USING btree ("created_at");
  CREATE INDEX "subscribers_criteria_fuels_order_idx" ON "subscribers_criteria_fuels" USING btree ("order");
  CREATE INDEX "subscribers_criteria_fuels_parent_idx" ON "subscribers_criteria_fuels" USING btree ("parent_id");
  CREATE UNIQUE INDEX "subscribers_email_idx" ON "subscribers" USING btree ("email");
  CREATE INDEX "subscribers_unsubscribe_token_idx" ON "subscribers" USING btree ("unsubscribe_token");
  CREATE INDEX "subscribers_updated_at_idx" ON "subscribers" USING btree ("updated_at");
  CREATE INDEX "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");
  CREATE INDEX "subscribers_rels_order_idx" ON "subscribers_rels" USING btree ("order");
  CREATE INDEX "subscribers_rels_parent_idx" ON "subscribers_rels" USING btree ("parent_id");
  CREATE INDEX "subscribers_rels_path_idx" ON "subscribers_rels" USING btree ("path");
  CREATE INDEX "subscribers_rels_brands_id_idx" ON "subscribers_rels" USING btree ("brands_id");
  CREATE INDEX "campaigns_updated_at_idx" ON "campaigns" USING btree ("updated_at");
  CREATE INDEX "campaigns_created_at_idx" ON "campaigns" USING btree ("created_at");
  CREATE INDEX "campaigns_rels_order_idx" ON "campaigns_rels" USING btree ("order");
  CREATE INDEX "campaigns_rels_parent_idx" ON "campaigns_rels" USING btree ("parent_id");
  CREATE INDEX "campaigns_rels_path_idx" ON "campaigns_rels" USING btree ("path");
  CREATE INDEX "campaigns_rels_vehicles_id_idx" ON "campaigns_rels" USING btree ("vehicles_id");
  CREATE UNIQUE INDEX "reviews_source_id_idx" ON "reviews" USING btree ("source_id");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_cover_idx" ON "articles" USING btree ("cover_id");
  CREATE INDEX "articles_meta_meta_image_idx" ON "articles" USING btree ("meta_image_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_cover_idx" ON "_articles_v" USING btree ("version_cover_id");
  CREATE INDEX "_articles_v_version_meta_version_meta_image_idx" ON "_articles_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE UNIQUE INDEX "local_pages_slug_idx" ON "local_pages" USING btree ("slug");
  CREATE INDEX "local_pages_meta_meta_image_idx" ON "local_pages" USING btree ("meta_image_id");
  CREATE INDEX "local_pages_updated_at_idx" ON "local_pages" USING btree ("updated_at");
  CREATE INDEX "local_pages_created_at_idx" ON "local_pages" USING btree ("created_at");
  CREATE INDEX "local_pages__status_idx" ON "local_pages" USING btree ("_status");
  CREATE INDEX "_local_pages_v_parent_idx" ON "_local_pages_v" USING btree ("parent_id");
  CREATE INDEX "_local_pages_v_version_version_slug_idx" ON "_local_pages_v" USING btree ("version_slug");
  CREATE INDEX "_local_pages_v_version_meta_version_meta_image_idx" ON "_local_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_local_pages_v_version_version_updated_at_idx" ON "_local_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_local_pages_v_version_version_created_at_idx" ON "_local_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_local_pages_v_version_version__status_idx" ON "_local_pages_v" USING btree ("version__status");
  CREATE INDEX "_local_pages_v_created_at_idx" ON "_local_pages_v" USING btree ("created_at");
  CREATE INDEX "_local_pages_v_updated_at_idx" ON "_local_pages_v" USING btree ("updated_at");
  CREATE INDEX "_local_pages_v_latest_idx" ON "_local_pages_v" USING btree ("latest");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE INDEX "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX "redirects_rels_order_idx" ON "redirects_rels" USING btree ("order");
  CREATE INDEX "redirects_rels_parent_idx" ON "redirects_rels" USING btree ("parent_id");
  CREATE INDEX "redirects_rels_path_idx" ON "redirects_rels" USING btree ("path");
  CREATE INDEX "redirects_rels_vehicles_id_idx" ON "redirects_rels" USING btree ("vehicles_id");
  CREATE INDEX "redirects_rels_articles_id_idx" ON "redirects_rels" USING btree ("articles_id");
  CREATE INDEX "redirects_rels_local_pages_id_idx" ON "redirects_rels" USING btree ("local_pages_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_vehicles_id_idx" ON "payload_locked_documents_rels" USING btree ("vehicles_id");
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
  CREATE INDEX "payload_locked_documents_rels_models_id_idx" ON "payload_locked_documents_rels" USING btree ("models_id");
  CREATE INDEX "payload_locked_documents_rels_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("requests_id");
  CREATE INDEX "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");
  CREATE INDEX "payload_locked_documents_rels_appointments_id_idx" ON "payload_locked_documents_rels" USING btree ("appointments_id");
  CREATE INDEX "payload_locked_documents_rels_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("subscribers_id");
  CREATE INDEX "payload_locked_documents_rels_campaigns_id_idx" ON "payload_locked_documents_rels" USING btree ("campaigns_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_local_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("local_pages_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "homepage_hero_badges_order_idx" ON "homepage_hero_badges" USING btree ("_order");
  CREATE INDEX "homepage_hero_badges_parent_id_idx" ON "homepage_hero_badges" USING btree ("_parent_id");
  CREATE INDEX "homepage_stats_order_idx" ON "homepage_stats" USING btree ("_order");
  CREATE INDEX "homepage_stats_parent_id_idx" ON "homepage_stats" USING btree ("_parent_id");
  CREATE INDEX "homepage_steps_order_idx" ON "homepage_steps" USING btree ("_order");
  CREATE INDEX "homepage_steps_parent_id_idx" ON "homepage_steps" USING btree ("_parent_id");
  CREATE INDEX "homepage_hero_hero_image_idx" ON "homepage" USING btree ("hero_image_id");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_faqs_id_idx" ON "homepage_rels" USING btree ("faqs_id");
  CREATE INDEX "agency_rels_order_idx" ON "agency_rels" USING btree ("order");
  CREATE INDEX "agency_rels_parent_idx" ON "agency_rels" USING btree ("parent_id");
  CREATE INDEX "agency_rels_path_idx" ON "agency_rels" USING btree ("path");
  CREATE INDEX "agency_rels_media_id_idx" ON "agency_rels" USING btree ("media_id");
  CREATE INDEX "settings_opening_hours_order_idx" ON "settings_opening_hours" USING btree ("_order");
  CREATE INDEX "settings_opening_hours_parent_id_idx" ON "settings_opening_hours" USING btree ("_parent_id");
  CREATE INDEX "settings_texts_order_parent" ON "settings_texts" USING btree ("order","parent_id");
  CREATE INDEX "agenda_weekly_order_idx" ON "agenda_weekly" USING btree ("_order");
  CREATE INDEX "agenda_weekly_parent_id_idx" ON "agenda_weekly" USING btree ("_parent_id");
  CREATE INDEX "agenda_closures_order_idx" ON "agenda_closures" USING btree ("_order");
  CREATE INDEX "agenda_closures_parent_id_idx" ON "agenda_closures" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "vehicles_equipment" CASCADE;
  DROP TABLE "vehicles_monthlies" CASCADE;
  DROP TABLE "vehicles" CASCADE;
  DROP TABLE "vehicles_rels" CASCADE;
  DROP TABLE "_vehicles_v_version_equipment" CASCADE;
  DROP TABLE "_vehicles_v_version_monthlies" CASCADE;
  DROP TABLE "_vehicles_v" CASCADE;
  DROP TABLE "_vehicles_v_rels" CASCADE;
  DROP TABLE "brands" CASCADE;
  DROP TABLE "models" CASCADE;
  DROP TABLE "requests_notes" CASCADE;
  DROP TABLE "requests_history" CASCADE;
  DROP TABLE "requests" CASCADE;
  DROP TABLE "requests_rels" CASCADE;
  DROP TABLE "documents" CASCADE;
  DROP TABLE "appointments" CASCADE;
  DROP TABLE "subscribers_criteria_fuels" CASCADE;
  DROP TABLE "subscribers" CASCADE;
  DROP TABLE "subscribers_rels" CASCADE;
  DROP TABLE "campaigns" CASCADE;
  DROP TABLE "campaigns_rels" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "local_pages" CASCADE;
  DROP TABLE "_local_pages_v" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "exports" CASCADE;
  DROP TABLE "exports_texts" CASCADE;
  DROP TABLE "imports" CASCADE;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "redirects_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "homepage_hero_badges" CASCADE;
  DROP TABLE "homepage_stats" CASCADE;
  DROP TABLE "homepage_steps" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_rels" CASCADE;
  DROP TABLE "agency" CASCADE;
  DROP TABLE "agency_rels" CASCADE;
  DROP TABLE "settings_opening_hours" CASCADE;
  DROP TABLE "settings" CASCADE;
  DROP TABLE "settings_texts" CASCADE;
  DROP TABLE "agenda_weekly" CASCADE;
  DROP TABLE "agenda_closures" CASCADE;
  DROP TABLE "agenda" CASCADE;
  DROP TYPE "public"."enum_vehicles_monthlies_formula";
  DROP TYPE "public"."enum_vehicles_sale_status";
  DROP TYPE "public"."enum_vehicles_fuel";
  DROP TYPE "public"."enum_vehicles_gearbox";
  DROP TYPE "public"."enum_vehicles_body_type";
  DROP TYPE "public"."enum_vehicles_crit_air";
  DROP TYPE "public"."enum_vehicles_status";
  DROP TYPE "public"."enum__vehicles_v_version_monthlies_formula";
  DROP TYPE "public"."enum__vehicles_v_version_fuel";
  DROP TYPE "public"."enum__vehicles_v_version_gearbox";
  DROP TYPE "public"."enum__vehicles_v_version_body_type";
  DROP TYPE "public"."enum__vehicles_v_version_crit_air";
  DROP TYPE "public"."enum__vehicles_v_version_status";
  DROP TYPE "public"."enum_requests_history_status";
  DROP TYPE "public"."enum_requests_type";
  DROP TYPE "public"."enum_requests_status";
  DROP TYPE "public"."enum_requests_formula";
  DROP TYPE "public"."enum_requests_profile";
  DROP TYPE "public"."enum_documents_kind";
  DROP TYPE "public"."enum_appointments_kind";
  DROP TYPE "public"."enum_appointments_status";
  DROP TYPE "public"."enum_subscribers_criteria_fuels";
  DROP TYPE "public"."enum_campaigns_status";
  DROP TYPE "public"."enum_reviews_source";
  DROP TYPE "public"."enum_faqs_category";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum_local_pages_status";
  DROP TYPE "public"."enum__local_pages_v_version_status";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_exports_format";
  DROP TYPE "public"."enum_exports_sort_order";
  DROP TYPE "public"."enum_exports_drafts";
  DROP TYPE "public"."enum_imports_import_mode";
  DROP TYPE "public"."enum_imports_status";
  DROP TYPE "public"."enum_redirects_to_type";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_agenda_weekly_day";`)
}
