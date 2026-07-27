-- ============================================================
-- KAS KELAS - Fresh Database Setup
-- Run this in Supabase SQL Editor (one shot, DROP first)
-- ============================================================

DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "PaymentPeriod" CASCADE;
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "Student" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'bendahara',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Category" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

CREATE TABLE "Student" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL UNIQUE,
    "classNumber" INTEGER NOT NULL,
    "isActive" BOOLEAN DEFAULT true
);

CREATE TABLE "PaymentPeriod" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMPTZ NOT NULL,
    "endDate" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "Payment" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
    "periodId" TEXT NOT NULL REFERENCES "PaymentPeriod"(id) ON DELETE CASCADE,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "fine" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'BELUM',
    "paidAt" TIMESTAMPTZ,
    UNIQUE("studentId", "periodId")
);

CREATE TABLE "Transaction" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT DEFAULT '',
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "categoryId" TEXT NOT NULL REFERENCES "Category"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed Users
INSERT INTO "User" ("name", "password", "role") VALUES
('bendahara', 'bendahara123', 'bendahara'),
('ketua', 'ketua123', 'ketua'),
('wali', 'wali123', 'wali')
ON CONFLICT (name) DO NOTHING;

-- Seed Categories
INSERT INTO "Category" ("name", "type") VALUES
('Kas Harian', 'pemasukan'),
('Kas Kegiatan', 'pemasukan'),
('Kas Kebersihan', 'pemasukan'),
('Lain-lain', 'pemasukan'),
('Minum', 'pengeluaran'),
('Alat Tulis', 'pengeluaran'),
('Lain-lain', 'pengeluaran')
ON CONFLICT DO NOTHING;

-- Seed Students (36)
INSERT INTO "Student" ("name", "classNumber", "isActive") VALUES
('Aulia', 1, true),
('Abel', 2, true),
('Aurel', 3, true),
('Aurora', 4, true),
('Ayla', 5, true),
('Kezia', 6, true),
('Bilqis', 7, true),
('Tata', 8, true),
('Puri', 9, true),
('Cheisia', 10, true),
('Destiana', 11, true),
('Dhea', 12, true),
('Dian', 13, true),
('Cita', 14, true),
('Fariha', 15, true),
('Felita', 16, true),
('Feodora', 17, true),
('Fiorella', 18, true),
('Gaudya', 19, true),
('Kartika', 20, true),
('Kharisma', 21, true),
('Lutfiana', 22, true),
('Marsya', 23, true),
('Khalisa', 24, true),
('Rizkya', 25, true),
('Rosiana', 26, true),
('Sagita', 27, true),
('Septiani', 28, true),
('Shovi', 29, true),
('Shyfa', 30, true),
('Talita', 31, true),
('Tiara', 32, true),
('Vinsensia', 33, true),
('Vion', 34, true),
('Yuda', 35, true),
('Zeva', 36, true)
ON CONFLICT (name) DO NOTHING;
