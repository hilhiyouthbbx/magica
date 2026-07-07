import { NextRequest, NextResponse } from "next/server";

// Hillsboro School District's public "High School Attendance Boundary" ArcGIS feature layer.
// Anonymous querying is enabled by the district (allowAnonymousToQuery: true) — this is the same
// authoritative boundary data behind the district's own "Find My Home School" tool.
const HSD_BOUNDARY_LAYER =
  "https://services5.arcgis.com/bQMB4G4scQKPv0h5/arcgis/rest/services/High_School_Attendance_Boundary/FeatureServer/37/query";

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address || typeof address !== "string" || !address.trim()) {
      return NextResponse.json({ ok: false, error: "Please enter an address." }, { status: 400 });
    }

    // ── Step 1: Geocode the address (OpenStreetMap Nominatim — free, no API key required) ──
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(address)}`,
      { headers: { "User-Agent": "HilhiYouthBasketball-TryoutRegistration/1.0 (info@hilhiyouthbbx.com)" } }
    );
    if (!geoRes.ok) {
      return NextResponse.json({ ok: false, error: "Address lookup service is unavailable right now. Please try again." }, { status: 502 });
    }
    const geoData = await geoRes.json();
    if (!Array.isArray(geoData) || geoData.length === 0) {
      return NextResponse.json({ ok: false, error: "We couldn't find that address. Please double-check it and try again." });
    }
    const { lat, lon, display_name } = geoData[0];

    // ── Step 2: Point-in-polygon query against the district's attendance boundary layer ──
    const queryUrl = `${HSD_BOUNDARY_LAYER}?geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=SchoolName,HIGH_DESC&returnGeometry=false&f=json`;
    const boundaryRes = await fetch(queryUrl);
    if (!boundaryRes.ok) {
      return NextResponse.json({ ok: false, error: "Boundary lookup service is unavailable right now. Please try again." }, { status: 502 });
    }
    const boundaryData = await boundaryRes.json();
    const feature = boundaryData?.features?.[0];
    const schoolName: string | undefined = feature?.attributes?.HIGH_DESC || feature?.attributes?.SchoolName;

    if (!schoolName) {
      return NextResponse.json({
        ok: true,
        formattedAddress: display_name,
        schoolName: null,
        inHillsboro: false,
        message: "That address doesn't appear to fall within a Hillsboro School District high school boundary — it may be outside the district entirely. Please verify with the district if this seems wrong.",
      });
    }

    const inHillsboro = schoolName.toLowerCase().includes("hillsboro");
    return NextResponse.json({
      ok: true,
      formattedAddress: display_name,
      schoolName,
      inHillsboro,
      message: inHillsboro
        ? `✅ This address is in the Hillsboro HS attendance boundary.`
        : `⚠️ This address is zoned for ${schoolName}, not Hillsboro HS.`,
    });
  } catch (err) {
    console.error("check-boundary error:", err);
    return NextResponse.json({ ok: false, error: "Something went wrong checking that address. Please try again." }, { status: 500 });
  }
}
