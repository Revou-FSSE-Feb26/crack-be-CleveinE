CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "VenueType" AS ENUM ('INDOOR', 'OUTDOOR');
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "User" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "role" "Role" NOT NULL DEFAULT 'USER', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Venue" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "type" "VenueType" NOT NULL, "description" TEXT NOT NULL, "price" INTEGER NOT NULL, CONSTRAINT "Venue_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Lane" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "venueId" TEXT NOT NULL, CONSTRAINT "Lane_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Bow" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT NOT NULL, "price" INTEGER NOT NULL, "level" TEXT NOT NULL DEFAULT 'All levels', CONSTRAINT "Bow_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Booking" ("id" TEXT NOT NULL, "date" TIMESTAMP(3) NOT NULL, "time" TEXT NOT NULL, "duration" INTEGER NOT NULL, "bringOwnBow" BOOLEAN NOT NULL DEFAULT true, "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED', "total" INTEGER NOT NULL, "userId" TEXT NOT NULL, "venueId" TEXT NOT NULL, "laneId" TEXT NOT NULL, "bowId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Booking_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Booking_date_idx" ON "Booking"("date");
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_venueId_laneId_date_time_idx" ON "Booking"("venueId", "laneId", "date", "time");
ALTER TABLE "Lane" ADD CONSTRAINT "Lane_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_laneId_fkey" FOREIGN KEY ("laneId") REFERENCES "Lane"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bowId_fkey" FOREIGN KEY ("bowId") REFERENCES "Bow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
