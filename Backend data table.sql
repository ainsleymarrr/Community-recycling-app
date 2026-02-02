-- -------------------------------------------------------------
-- TablePlus 6.8.0(654)
--
-- https://tableplus.com/
--
-- Database: recycle_app
-- Generation Time: 2026-02-02 14:36:24.5240
-- -------------------------------------------------------------


DROP TABLE IF EXISTS "public"."conversations";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS conversations_id_seq;

-- Table Definition
CREATE TABLE "public"."conversations" (
    "id" int8 NOT NULL DEFAULT nextval('conversations_id_seq'::regclass),
    "user1_id" int8 NOT NULL,
    "user2_id" int8 NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

INSERT INTO "public"."users" ("id", "username", "password_hash", "role", "status", "created_at") VALUES
(1, 'testuser', 'fakehash', 'resident', 'pending', '2025-12-19 20:35:31.522211+08'),
(2, 'testuser2', 'hahha', 'resident', 'approved', '2025-12-22 00:14:53.319946+08');

INSERT INTO "public"."posts" ("id", "author_id", "description", "created_at") VALUES
(2, 1, 'Free books', '2025-12-21 14:26:54.372405+08'),
(3, 1, 'Free lamp', '2025-12-22 00:10:35.406402+08');

INSERT INTO "public"."conversations" ("id", "user1_id", "user2_id", "created_at") VALUES
(2, 1, 2, '2025-12-22 00:15:31.088663+08');

ALTER TABLE "public"."conversations" ADD FOREIGN KEY ("user1_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."conversations" ADD FOREIGN KEY ("user2_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


-- Indices
CREATE UNIQUE INDEX uniq_conversation_pair ON public.conversations USING btree (user1_id, user2_id);
