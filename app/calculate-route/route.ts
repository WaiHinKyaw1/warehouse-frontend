import type { NextRequest } from "next/server"

// Force dynamic so this handler always runs
export const dynamic = "force-dynamic"

const GOOGLE_API_KEY = "AIzaSyC58JRaLlXPfWGzU2POxSsHJo1lBUSIGCU"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get("start")?.trim() || ""
  const end = searchParams.get("end")?.trim() || ""

  if (!start || !end) {
    return Response.json({ error: "Start and end parameters are required." }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${new URLSearchParams({
        origin: start,
        destination: end,
        alternatives: "true",
        key: GOOGLE_API_KEY,
      })}`,
    )

    const data = await response.json()

    if (data.status !== "OK") {
      console.error("Google Directions API Error:", data)
      return Response.json({ error: "Google Directions API Error", detail: data }, { status: 500 })
    }

    const routes = data.routes.map((route: any) => {
      const leg = route.legs[0]
      const distanceKm = leg.distance.value / 1000
      const costPerKm = 550 // MMK per km
      const charge = Math.round(distanceKm * costPerKm)

      return {
        start: leg.start_address,
        end: leg.end_address,
        distance_km: distanceKm.toFixed(2),
        distance_miles: (distanceKm * 0.621371).toFixed(2),
        duration: leg.duration.text,
        duration_minutes: Math.round(leg.duration.value / 60),
        charge,
        polyline: route.overview_polyline.points,
      }
    })

    return Response.json({ routes })
  } catch (err: any) {
    console.error("Error fetching route from Google:", err.message)
    return Response.json({ error: "Failed to fetch route", detail: err.message }, { status: 500 })
  }
}
