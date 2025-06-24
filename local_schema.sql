

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "authenticative";


ALTER SCHEMA "authenticative" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."stripe_order_status" AS ENUM (
    'pending',
    'completed',
    'canceled'
);


ALTER TYPE "public"."stripe_order_status" OWNER TO "postgres";


CREATE TYPE "public"."stripe_subscription_status" AS ENUM (
    'not_started',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
);


ALTER TYPE "public"."stripe_subscription_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "authenticative"."is_user_authenticated"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT array[(select auth.jwt()->>'aal')] <@ (
    SELECT
      CASE
        WHEN count(id) > 0 THEN array['aal2']
        ELSE array['aal1', 'aal2']
      END as aal
    FROM auth.mfa_factors
    WHERE (auth.uid() = user_id)
    AND status = 'verified'
  );
$$;


ALTER FUNCTION "authenticative"."is_user_authenticated"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."credit_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_session_id" "text" NOT NULL,
    "credits_purchased" integer NOT NULL,
    "amount_paid" integer NOT NULL,
    "currency" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."galleries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_private" boolean DEFAULT false,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."galleries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."processing_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prediction_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "result_url" "text",
    "error_message" "text",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    CONSTRAINT "processing_jobs_status_check" CHECK (("status" = ANY (ARRAY['processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."processing_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gallery_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "original_url" "text" NOT NULL,
    "edited_url" "text" NOT NULL,
    "prompt" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_hd" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "thumbnail_url" "text",
    "prediction_id" "text"
);


ALTER TABLE "public"."saved_images" OWNER TO "postgres";


COMMENT ON COLUMN "public"."saved_images"."thumbnail_url" IS 'URL to optimized thumbnail (300x300px) for gallery display. Original image URL remains in edited_url for downloads.';



CREATE TABLE IF NOT EXISTS "public"."stripe_customers" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "customer_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."stripe_customers" OWNER TO "postgres";


ALTER TABLE "public"."stripe_customers" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."stripe_customers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stripe_orders" (
    "id" bigint NOT NULL,
    "checkout_session_id" "text" NOT NULL,
    "payment_intent_id" "text" NOT NULL,
    "customer_id" "text" NOT NULL,
    "amount_subtotal" bigint NOT NULL,
    "amount_total" bigint NOT NULL,
    "currency" "text" NOT NULL,
    "payment_status" "text" NOT NULL,
    "status" "public"."stripe_order_status" DEFAULT 'pending'::"public"."stripe_order_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."stripe_orders" OWNER TO "postgres";


ALTER TABLE "public"."stripe_orders" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."stripe_orders_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stripe_subscriptions" (
    "id" bigint NOT NULL,
    "customer_id" "text" NOT NULL,
    "subscription_id" "text",
    "price_id" "text",
    "current_period_start" bigint,
    "current_period_end" bigint,
    "cancel_at_period_end" boolean DEFAULT false,
    "payment_method_brand" "text",
    "payment_method_last4" "text",
    "status" "public"."stripe_subscription_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."stripe_subscriptions" OWNER TO "postgres";


ALTER TABLE "public"."stripe_subscriptions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."stripe_subscriptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."todo_list" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "urgent" boolean DEFAULT false NOT NULL,
    "description" "text",
    "done" boolean DEFAULT false NOT NULL,
    "done_at" timestamp with time zone,
    "owner" "uuid" NOT NULL
);


ALTER TABLE "public"."todo_list" OWNER TO "postgres";


ALTER TABLE "public"."todo_list" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."todo_list_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_credits" (
    "user_id" "uuid" NOT NULL,
    "credits" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_credits" OWNER TO "postgres";


ALTER TABLE ONLY "public"."credit_purchases"
    ADD CONSTRAINT "credit_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."galleries"
    ADD CONSTRAINT "galleries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."processing_jobs"
    ADD CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_images"
    ADD CONSTRAINT "saved_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_orders"
    ADD CONSTRAINT "stripe_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."todo_list"
    ADD CONSTRAINT "todo_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."credit_purchases"
    ADD CONSTRAINT "credit_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."galleries"
    ADD CONSTRAINT "galleries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."processing_jobs"
    ADD CONSTRAINT "processing_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_images"
    ADD CONSTRAINT "saved_images_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."saved_images"
    ADD CONSTRAINT "saved_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."todo_list"
    ADD CONSTRAINT "todo_list_owner_fkey" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Owner can do everything" ON "public"."todo_list" TO "authenticated" USING (("authenticative"."is_user_authenticated"() AND ("owner" = "auth"."uid"())));



ALTER TABLE "public"."todo_list" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON TABLE "public"."credit_purchases" TO "anon";
GRANT ALL ON TABLE "public"."credit_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."galleries" TO "anon";
GRANT ALL ON TABLE "public"."galleries" TO "authenticated";
GRANT ALL ON TABLE "public"."galleries" TO "service_role";



GRANT ALL ON TABLE "public"."processing_jobs" TO "anon";
GRANT ALL ON TABLE "public"."processing_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."processing_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."saved_images" TO "anon";
GRANT ALL ON TABLE "public"."saved_images" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_images" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_customers" TO "anon";
GRANT ALL ON TABLE "public"."stripe_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_customers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."stripe_customers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stripe_customers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stripe_customers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_orders" TO "anon";
GRANT ALL ON TABLE "public"."stripe_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."stripe_orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stripe_orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stripe_orders_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."stripe_subscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stripe_subscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stripe_subscriptions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."todo_list" TO "anon";
GRANT ALL ON TABLE "public"."todo_list" TO "authenticated";
GRANT ALL ON TABLE "public"."todo_list" TO "service_role";



GRANT ALL ON SEQUENCE "public"."todo_list_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."todo_list_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."todo_list_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_credits" TO "anon";
GRANT ALL ON TABLE "public"."user_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credits" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
