

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


CREATE OR REPLACE FUNCTION "public"."add_credits_from_purchase"("p_user_id" "uuid", "p_credits_to_add" integer, "p_stripe_session_id" "text", "p_amount_paid" integer, "p_currency" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert purchase record
  INSERT INTO credit_purchases (
    user_id,
    stripe_session_id,
    credits_purchased,
    amount_paid,
    currency
  ) VALUES (
    p_user_id,
    p_stripe_session_id,
    p_credits_to_add,
    p_amount_paid,
    p_currency
  );

  -- Add credits to user account
  INSERT INTO user_credits (user_id, credits)
  VALUES (p_user_id, p_credits_to_add)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    credits = user_credits.credits + p_credits_to_add,
    updated_at = now();
END;
$$;


ALTER FUNCTION "public"."add_credits_from_purchase"("p_user_id" "uuid", "p_credits_to_add" integer, "p_stripe_session_id" "text", "p_amount_paid" integer, "p_currency" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_credits"("p_user_id" "uuid", "p_credits_to_deduct" integer DEFAULT 1) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_credits integer;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO current_credits
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if user has enough credits
  IF current_credits IS NULL OR current_credits < p_credits_to_deduct THEN
    RETURN false;
  END IF;

  -- Deduct credits
  UPDATE user_credits
  SET 
    credits = credits - p_credits_to_deduct,
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."deduct_credits"("p_user_id" "uuid", "p_credits_to_deduct" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  BEGIN

    INSERT INTO public.user_credits (user_id, credits)
    VALUES (NEW.id, 1)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_saved_image_prediction_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update saved_images
  set prediction_id = NEW.prediction_id
  where prediction_id is null
    and edited_url = NEW.result_url
    and user_id = NEW.user_id;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."sync_saved_image_prediction_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_processing_jobs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_processing_jobs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

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



CREATE OR REPLACE VIEW "public"."stripe_user_orders" WITH ("security_invoker"='true') AS
 SELECT "c"."customer_id",
    "o"."id" AS "order_id",
    "o"."checkout_session_id",
    "o"."payment_intent_id",
    "o"."amount_subtotal",
    "o"."amount_total",
    "o"."currency",
    "o"."payment_status",
    "o"."status" AS "order_status",
    "o"."created_at" AS "order_date"
   FROM ("public"."stripe_customers" "c"
     LEFT JOIN "public"."stripe_orders" "o" ON (("c"."customer_id" = "o"."customer_id")))
  WHERE (("c"."user_id" = "auth"."uid"()) AND ("c"."deleted_at" IS NULL) AND ("o"."deleted_at" IS NULL));


ALTER VIEW "public"."stripe_user_orders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."stripe_user_subscriptions" WITH ("security_invoker"='true') AS
 SELECT "c"."customer_id",
    "s"."subscription_id",
    "s"."status" AS "subscription_status",
    "s"."price_id",
    "s"."current_period_start",
    "s"."current_period_end",
    "s"."cancel_at_period_end",
    "s"."payment_method_brand",
    "s"."payment_method_last4"
   FROM ("public"."stripe_customers" "c"
     LEFT JOIN "public"."stripe_subscriptions" "s" ON (("c"."customer_id" = "s"."customer_id")))
  WHERE (("c"."user_id" = "auth"."uid"()) AND ("c"."deleted_at" IS NULL) AND ("s"."deleted_at" IS NULL));


ALTER VIEW "public"."stripe_user_subscriptions" OWNER TO "postgres";


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



ALTER TABLE ONLY "public"."processing_jobs"
    ADD CONSTRAINT "processing_jobs_prediction_id_key" UNIQUE ("prediction_id");



ALTER TABLE ONLY "public"."saved_images"
    ADD CONSTRAINT "saved_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_customer_id_key" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."stripe_orders"
    ADD CONSTRAINT "stripe_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_customer_id_key" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_credit_purchases_created_at" ON "public"."credit_purchases" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_credit_purchases_stripe_session" ON "public"."credit_purchases" USING "btree" ("stripe_session_id");



CREATE INDEX "idx_credit_purchases_user_id" ON "public"."credit_purchases" USING "btree" ("user_id");



CREATE INDEX "idx_galleries_created_at" ON "public"."galleries" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_galleries_user_created" ON "public"."galleries" USING "btree" ("user_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_galleries_user_created" IS 'Optimizes gallery list queries by user_id';



CREATE INDEX "idx_galleries_user_id" ON "public"."galleries" USING "btree" ("user_id");



CREATE INDEX "idx_processing_jobs_prediction_id" ON "public"."processing_jobs" USING "btree" ("prediction_id");



CREATE INDEX "idx_processing_jobs_started_at" ON "public"."processing_jobs" USING "btree" ("started_at" DESC);



CREATE INDEX "idx_processing_jobs_status" ON "public"."processing_jobs" USING "btree" ("status");



CREATE INDEX "idx_processing_jobs_user_id" ON "public"."processing_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_saved_images_created_at" ON "public"."saved_images" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_saved_images_gallery_id" ON "public"."saved_images" USING "btree" ("gallery_id");



COMMENT ON INDEX "public"."idx_saved_images_gallery_id" IS 'Optimizes album filtering queries';



CREATE INDEX "idx_saved_images_pagination" ON "public"."saved_images" USING "btree" ("user_id", "created_at" DESC, "id");



COMMENT ON INDEX "public"."idx_saved_images_pagination" IS 'Optimizes pagination queries with consistent ordering';



CREATE INDEX "idx_saved_images_tags" ON "public"."saved_images" USING "gin" ("tags");



CREATE INDEX "idx_saved_images_user_created" ON "public"."saved_images" USING "btree" ("user_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_saved_images_user_created" IS 'Optimizes main gallery and history queries by user_id and created_at';



CREATE INDEX "idx_saved_images_user_gallery" ON "public"."saved_images" USING "btree" ("user_id", "gallery_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_saved_images_user_gallery" IS 'Optimizes gallery filtering queries by user_id and gallery_id';



CREATE INDEX "idx_saved_images_user_id" ON "public"."saved_images" USING "btree" ("user_id");



CREATE INDEX "idx_user_credits_user_id" ON "public"."user_credits" USING "btree" ("user_id");



CREATE INDEX "processing_jobs_prediction_id_idx" ON "public"."processing_jobs" USING "btree" ("prediction_id");



CREATE INDEX "saved_images_prediction_id_idx" ON "public"."saved_images" USING "btree" ("prediction_id");



CREATE OR REPLACE TRIGGER "trg_sync_saved_prediction" AFTER UPDATE ON "public"."processing_jobs" FOR EACH ROW WHEN ((("new"."status" = 'completed'::"text") AND ("new"."prediction_id" IS NOT NULL))) EXECUTE FUNCTION "public"."sync_saved_image_prediction_id"();



CREATE OR REPLACE TRIGGER "trigger_processing_jobs_updated_at" BEFORE UPDATE ON "public"."processing_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_processing_jobs_updated_at"();



CREATE OR REPLACE TRIGGER "update_galleries_updated_at" BEFORE UPDATE ON "public"."galleries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_credits_updated_at" BEFORE UPDATE ON "public"."user_credits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."credit_purchases"
    ADD CONSTRAINT "credit_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."galleries"
    ADD CONSTRAINT "galleries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."processing_jobs"
    ADD CONSTRAINT "processing_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_images"
    ADD CONSTRAINT "saved_images_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_images"
    ADD CONSTRAINT "saved_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Service role can insert user credits" ON "public"."user_credits" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "System can insert credit purchases" ON "public"."credit_purchases" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can create own galleries" ON "public"."galleries" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own saved images" ON "public"."saved_images" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own galleries" ON "public"."galleries" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own saved images" ON "public"."saved_images" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own processing jobs" ON "public"."processing_jobs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own credits" ON "public"."user_credits" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own galleries" ON "public"."galleries" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own saved images" ON "public"."saved_images" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own galleries" ON "public"."galleries" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own processing jobs" ON "public"."processing_jobs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own saved images" ON "public"."saved_images" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own credits" ON "public"."user_credits" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own processing jobs" ON "public"."processing_jobs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own credit purchases" ON "public"."credit_purchases" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own credits" ON "public"."user_credits" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own customer data" ON "public"."stripe_customers" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND ("deleted_at" IS NULL)));



CREATE POLICY "Users can view their own order data" ON "public"."stripe_orders" FOR SELECT TO "authenticated" USING ((("customer_id" IN ( SELECT "stripe_customers"."customer_id"
   FROM "public"."stripe_customers"
  WHERE (("stripe_customers"."user_id" = "auth"."uid"()) AND ("stripe_customers"."deleted_at" IS NULL)))) AND ("deleted_at" IS NULL)));



CREATE POLICY "Users can view their own subscription data" ON "public"."stripe_subscriptions" FOR SELECT TO "authenticated" USING ((("customer_id" IN ( SELECT "stripe_customers"."customer_id"
   FROM "public"."stripe_customers"
  WHERE (("stripe_customers"."user_id" = "auth"."uid"()) AND ("stripe_customers"."deleted_at" IS NULL)))) AND ("deleted_at" IS NULL)));



ALTER TABLE "public"."credit_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."galleries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."processing_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_credits" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."add_credits_from_purchase"("p_user_id" "uuid", "p_credits_to_add" integer, "p_stripe_session_id" "text", "p_amount_paid" integer, "p_currency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_credits_from_purchase"("p_user_id" "uuid", "p_credits_to_add" integer, "p_stripe_session_id" "text", "p_amount_paid" integer, "p_currency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_credits_from_purchase"("p_user_id" "uuid", "p_credits_to_add" integer, "p_stripe_session_id" "text", "p_amount_paid" integer, "p_currency" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_credits"("p_user_id" "uuid", "p_credits_to_deduct" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_credits"("p_user_id" "uuid", "p_credits_to_deduct" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_credits"("p_user_id" "uuid", "p_credits_to_deduct" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_saved_image_prediction_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_saved_image_prediction_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_saved_image_prediction_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_processing_jobs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_processing_jobs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_processing_jobs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















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



GRANT ALL ON TABLE "public"."stripe_user_orders" TO "anon";
GRANT ALL ON TABLE "public"."stripe_user_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_user_orders" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."stripe_user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_user_subscriptions" TO "service_role";



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
