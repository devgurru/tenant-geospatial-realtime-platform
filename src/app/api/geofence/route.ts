import { NextRequest, NextResponse } from "next/server";
import { GEOFENCE_WKT } from "@/lib/geofence";
import { prisma } from "@/lib/prisma";

type GeofenceRow = { inside: boolean };

function parseCoordinate(value: string | null, name: string): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (name === "lat" && (parsed < -90 || parsed > 90)) return null;
  if (name === "lng" && (parsed < -180 || parsed > 180)) return null;
  return parsed;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = parseCoordinate(searchParams.get("lat"), "lat");
  const lng = parseCoordinate(searchParams.get("lng"), "lng");

  if (lat === null || lng === null) {
    return NextResponse.json(
      {
        error:
          "Query params lat and lng are required (e.g. ?lat=37.78&lng=-122.41)",
      },
      { status: 400 },
    );
  }

  try {
    // Prisma tagged template — parameterized raw SQL (PostGIS ST_Contains)
    const rows = (await prisma.$queryRaw`
      SELECT ST_Contains(
        ST_GeomFromText(${GEOFENCE_WKT}, 4326),
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      ) AS inside
    `) as GeofenceRow[];

    const inside = Boolean(rows[0]?.inside);

    return NextResponse.json({
      lat,
      lng,
      inside,
      polygon: GEOFENCE_WKT,
    });
  } catch (error) {
    console.error("[geofence]", error);
    return NextResponse.json(
      {
        error:
          "PostGIS query failed. Ensure PostgreSQL with PostGIS is running (see README).",
      },
      { status: 503 },
    );
  }
}
