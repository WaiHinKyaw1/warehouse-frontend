"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, FileText, MapPin, Clock, Package, Loader2, Search, Filter, Building2 } from "lucide-react"
import { supplyRequestAPI, warehouseItemAPI } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

// Google Maps integration
declare global {
  interface Window {
    google: any
    L: any
    initGoogleMaps: () => void
  }
}

// Route calculation utilities
let map: any = null
let routeLayers: any[] = []
let routesData: any[] = []
let startMarker: any = null
let endMarker: any = null

/** * Repeatedly checks for an element until it exists, then runs `cb`. */
function waitForElement(id: string, cb: () => void, tries = 0) {
  const el = document.getElementById(id)
  if (el) {
    cb()
  } else if (tries < 30) {
    setTimeout(() => waitForElement(id, cb, tries + 1), 100)
  } else {
    console.warn(`waitForElement: #${id} not found after ${tries} tries`)
  }
}

function initMap() {
  const container = document.getElementById("route-map")
  if (!container) {
    console.warn("initMap called but #route-map is not in the DOM yet.")
    return
  }
  if (typeof window !== "undefined" && window.L) {
    // Clear existing map if it exists
    if (map) {
      map.remove()
    }
    // Initialize map with faster loading
    map = window.L.map("route-map", {
      preferCanvas: true,
      zoomControl: true,
      attributionControl: true,
    }).setView([16.8409, 96.1735], 11)

    // Add OpenStreetMap tiles
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
      crossOrigin: true,
    }).addTo(map)

    // Force map to render
    setTimeout(() => {
      if (map) {
        map.invalidateSize()
      }
    }, 100)

    console.log("Map initialized successfully")
  }
}

function clearRoutes() {
  if (map && routeLayers.length > 0) {
    routeLayers.forEach((layer) => map.removeLayer(layer))
    routeLayers = []
  }
  // Clear markers
  if (startMarker) {
    map.removeLayer(startMarker)
    startMarker = null
  }
  if (endMarker) {
    map.removeLayer(endMarker)
    endMarker = null
  }
}

// Enhanced route visualization functions
function decodePolyline(encoded: string) {
  if (!encoded) return []
  const poly = []
  let index = 0
  const len = encoded.length
  let lat = 0
  let lng = 0

  while (index < len) {
    let b
    let shift = 0
    let result = 0
    do {
      b = encoded.charAt(index++).charCodeAt(0) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lat += dlat

    shift = 0
    result = 0
    do {
      b = encoded.charAt(index++).charCodeAt(0) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lng += dlng

    poly.push([lat / 1e5, lng / 1e5])
  }
  return poly
}

function displayAllRoutes(routes: any[]) {
  if (!map || !window.L || !routes.length) {
    console.log("Cannot display routes:", {
      map: !!map,
      L: !!window.L,
      routesLength: routes.length,
    })
    return
  }

  console.log("Displaying routes:", routes)
  clearRoutes()

  // Find the shortest distance route
  const shortestDistanceIndex = routes.reduce(
    (minIdx: number, route: any, idx: number, arr: any[]) =>
      Number.parseFloat(route.distance_km) < Number.parseFloat(arr[minIdx].distance_km) ? idx : minIdx,
    0,
  )

  let allBounds: any[] = []
  let routesDisplayed = 0

  routes.forEach((route, idx) => {
    console.log(`Processing route ${idx}:`, route)
    if (route.polyline && route.polyline.length > 0) {
      const latlngs = decodePolyline(route.polyline)
      console.log(`Decoded ${latlngs.length} points for route ${idx}`)

      if (latlngs.length > 0) {
        const isShortestDistance = idx === shortestDistanceIndex

        // Create polyline with Google Maps style colors
        const polylineLayer = window.L.polyline(latlngs, {
          color: isShortestDistance ? "#4285F4" : "#34A853",
          weight: isShortestDistance ? 6 : 4,
          opacity: 0.8,
          smoothFactor: 1.0,
        }).addTo(map)

        // Add click handler to select route
        polylineLayer.on("click", () => {
          console.log(`Route ${idx} clicked`)
          highlightRoute(idx)
        })

        routeLayers.push(polylineLayer)
        allBounds = allBounds.concat(latlngs)
        routesDisplayed++
        console.log(`Route ${idx} added to map successfully`)
      }
    } else {
      console.log(`Route ${idx} has no polyline data`)
    }
  })

  console.log(`Total routes displayed: ${routesDisplayed}`)

  // Add start and end markers
  if (routes.length > 0 && allBounds.length > 0) {
    const firstRoute = routes[0]
    const firstRoutePoints = decodePolyline(firstRoute.polyline)

    if (firstRoutePoints.length > 0) {
      // Start marker (green)
      startMarker = window.L.circleMarker(firstRoutePoints[0], {
        radius: 8,
        fillColor: "#34A853",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map)

      // End marker (red)
      endMarker = window.L.circleMarker(firstRoutePoints[firstRoutePoints.length - 1], {
        radius: 8,
        fillColor: "#EA4335",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map)

      console.log("Start and end markers added")
    }

    // Fit map to show all routes
    if (allBounds.length > 0) {
      const bounds = window.L.latLngBounds(allBounds)
      map.fitBounds(bounds, { padding: [50, 50] })
      console.log("Map bounds fitted to routes")
    }
  }
}

function highlightRoute(index: number) {
  if (!map || !window.L || !routesData[index]) {
    console.log("Cannot highlight route:", {
      map: !!map,
      L: !!window.L,
      routeExists: !!routesData[index],
    })
    return
  }

  console.log(`Highlighting route ${index}`)
  clearRoutes()

  // Find the shortest distance route
  const shortestDistanceIndex = routesData.reduce(
    (minIdx: number, route: any, idx: number, arr: any[]) =>
      Number.parseFloat(route.distance_km) < Number.parseFloat(arr[minIdx].distance_km) ? idx : minIdx,
    0,
  )

  routesData.forEach((route, idx) => {
    if (route.polyline && route.polyline.length > 0) {
      const latlngs = decodePolyline(route.polyline)
      if (latlngs.length > 0) {
        let color, weight, opacity
        if (idx === index) {
          // Currently selected route - make it prominent
          color = idx === shortestDistanceIndex ? "#1565C0" : "#2E7D32"
          weight = 8
          opacity = 1.0
        } else {
          // Non-selected routes - more subtle
          color = idx === shortestDistanceIndex ? "#4285F4" : "#34A853"
          weight = 4
          opacity = 0.5
        }

        const polylineLayer = window.L.polyline(latlngs, {
          color: color,
          weight: weight,
          opacity: opacity,
          smoothFactor: 1.0,
        }).addTo(map)

        // Add click handler
        polylineLayer.on("click", () => {
          highlightRoute(idx)
        })

        routeLayers.push(polylineLayer)
      }
    }
  })

  // Re-add markers for selected route
  const selectedRoute = routesData[index]
  if (selectedRoute && selectedRoute.polyline) {
    const routePoints = decodePolyline(selectedRoute.polyline)
    if (routePoints.length > 0) {
      // Start marker
      startMarker = window.L.circleMarker(routePoints[0], {
        radius: 8,
        fillColor: "#34A853",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map)

      // End marker
      endMarker = window.L.circleMarker(routePoints[routePoints.length - 1], {
        radius: 8,
        fillColor: "#EA4335",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map)

      // Fit bounds to selected route
      const bounds = window.L.latLngBounds(routePoints)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }
}

function showRoutes(routes: any[]) {
  if (!map || !window.L) {
    console.log("Cannot show routes: map or Leaflet not available")
    return
  }

  console.log("showRoutes called with:", routes)

  // Display all routes on the map first
  displayAllRoutes(routes)

  // Force map to refresh
  setTimeout(() => {
    if (map) {
      map.invalidateSize()
      console.log("Map size invalidated")
    }
  }, 100)
}

function durationToMinutes(durationStr: string) {
  let total = 0
  const h = durationStr.match(/(\d+)\s*hour/)
  const m = durationStr.match(/(\d+)\s*min/)
  if (h) total += Number.parseInt(h[1]) * 60
  if (m) total += Number.parseInt(m[1])
  return total
}

const calculateRoute = async (
  routeFormData: any,
  setCalculatingRoute: any,
  setAvailableRoutes: any,
  setSelectedRouteIndex: any,
  setShowRouteResults: any,
  toast: any,
  mapInitialized: any,
) => {
  if (!routeFormData.startLocation || !routeFormData.endLocation) {
    toast({
      title: "Error",
      description: "Please enter both start and end locations.",
      variant: "destructive",
    })
    return
  }

  setCalculatingRoute(true)
  try {
    console.log("Calculating route from", routeFormData.startLocation, "to", routeFormData.endLocation)

    const routes = await fetchRoutes(routeFormData.startLocation, routeFormData.endLocation)

    if (routes && routes.length > 0) {
      console.log("Routes received:", routes)
      console.log("Sample polyline:", routes[0]?.polyline?.substring(0, 100) + "...")

      routesData = routes
      setAvailableRoutes(routes)

      // Find the shortest distance route
      const shortestDistanceIndex = routes.reduce(
        (minIdx: number, route: any, idx: number, arr: any[]) =>
          Number.parseFloat(route.distance_km) < Number.parseFloat(arr[minIdx].distance_km) ? idx : minIdx,
        0,
      )

      setSelectedRouteIndex(shortestDistanceIndex)
      setShowRouteResults(true)

      // Wait a bit for the UI to update, then show routes
      setTimeout(() => {
        if (mapInitialized && map) {
          console.log("Map initialized, showing routes")
          showRoutes(routes)
          highlightRoute(shortestDistanceIndex)
        } else {
          console.log("Map not ready:", { mapInitialized, map: !!map })
        }
      }, 500)

      toast({
        title: "Routes Calculated",
        description: `Found ${routes.length} route options.`,
      })
    } else {
      throw new Error("No routes found")
    }
  } catch (error: any) {
    console.error("Route calculation error:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to calculate route. Please try again.",
      variant: "destructive",
    })
  } finally {
    setCalculatingRoute(false)
  }
}

async function fetchRoutes(start: string, end: string) {
  try {
    const res = await fetch(`/calculate-route?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
    if (!res.ok) throw new Error("Network error")
    const data = await res.json()
    return data.routes
  } catch (err: any) {
    throw new Error("Error fetching routes: " + err.message)
  }
}

interface WarehouseItem {
  id: number
  ngo_id?: number
  ware_house_id: number
  item_id: number
  quantity: number
  ware_house?: { name: string; address: string }
  item?: { name: string; unit: string }
}

interface RouteInfo {
  start: string
  end: string
  distance_km: string
  distance_miles: string
  duration: string
  duration_minutes: number
  charge: number
  polyline?: string
}

interface Delivery {
  id: number
  supply_request_id: number
  delivery_date: string
  status: "pending" | "in_transit" | "delivered" | "cancelled"
  delivery_cost: string
  truck_id: number
  created_at: string
  updated_at: string
}

interface SupplyRequest {
  id: number
  ngo_id: number
  ware_house_id: number
  request_date: string
  status: "pending" | "approved" | "in_transit" | "delivered"
  created_at: string
  ngo: { name: string }
  supply_request_items: Array<{
    id: number
    item_id: number
    quantity: number
    item?: { name: string; unit: string }
    ware_house?: { name: string; address: string }
  }>
  route_infos: RouteInfo[]
  deliveries: Delivery[]
  warehouse: { name: string; address: string }
}

interface NGORequestsManagementProps {
  user: any
}

// Location Autocomplete Component
interface LocationAutocompleteProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}

function LocationAutocomplete({ id, value, onChange, placeholder, label }: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const debounceTimeoutRef = useRef<any>(null)
  const autocompleteServiceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)

  useEffect(() => {
    // Initialize Google Places services when available
    if (typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
      placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement("div"))
    }
  }, [])

  const getPredictions = (input: string) => {
    if (!autocompleteServiceRef.current || input.length < 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    const request = {
      input: input,
      componentRestrictions: { country: "mm" }, // Myanmar
      types: ["geocode", "establishment"],
    }

    autocompleteServiceRef.current.getPlacePredictions(request, (predictions: any[], status: any) => {
      setLoading(false)
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions)
        setShowSuggestions(true)
        setSelectedIndex(-1)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    })
  }

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue)

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Debounce the API call
    debounceTimeoutRef.current = setTimeout(() => {
      getPredictions(inputValue)
    }, 300)
  }

  const handleSuggestionSelect = (suggestion: any) => {
    onChange(suggestion.description)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      const newIndex = selectedIndex < suggestions.length - 1 ? selectedIndex + 1 : 0
      setSelectedIndex(newIndex)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : suggestions.length - 1
      setSelectedIndex(newIndex)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSuggestionSelect(suggestions[selectedIndex])
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="space-y-2 relative">
      <Label htmlFor={id}>{label}:</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          onBlur={() => {
            // Delay hiding to allow click on suggestions
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? "bg-blue-50 border-blue-200" : ""
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-start gap-3">
                {suggestion.types?.includes("establishment") ? (
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.structured_formatting?.secondary_text || ""}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function NGORequestsManagement({ user }: NGORequestsManagementProps) {
  const [requests, setRequests] = useState<SupplyRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<SupplyRequest[]>([])
  const [availableItems, setAvailableItems] = useState<WarehouseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<
    Array<{
      item_id: number
      quantity: number
      max_quantity: number
      ware_house_id: number
    }>
  >([])
  const [calculatingRoute, setCalculatingRoute] = useState(false)
  const [availableRoutes, setAvailableRoutes] = useState<RouteInfo[]>([])
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [mapInitialized, setMapInitialized] = useState(false)
  const [showRouteResults, setShowRouteResults] = useState(false)
  const [routeFormData, setRouteFormData] = useState({
    startLocation: "",
    endLocation: "",
  })

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)
      const [requestsResponse, itemsResponse] = await Promise.all([
        supplyRequestAPI.getAll().catch(() => ({ data: [] })),
        warehouseItemAPI.getAll().catch(() => ({ data: [] })),
      ])

      const allRequests = requestsResponse.data || requestsResponse || []
      const userRequests = allRequests.filter((req: SupplyRequest) => req.ngo_id === user.ngo_id)

      setRequests(userRequests)
      setFilteredRequests(userRequests) // Initialize filtered requests

      const allItems = itemsResponse.data || itemsResponse || []
      const ngoItems = allItems.filter((item: WarehouseItem) => item.ngo_id === user.ngo_id && item.quantity > 0)

      setAvailableItems(ngoItems)
      const warehouses: number[] = Array.from(new Set(ngoItems.map((i: WarehouseItem) => i.ware_house_id)))
    if (warehouses.length > 0) {
      setWarehouseFilter(warehouses[0].toString())
    }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter requests based on status
useEffect(() => {
  if (statusFilter === "all") {
    setFilteredRequests(requests)
  } else {
    setFilteredRequests(requests.filter((req) => req.status === statusFilter))
  }
}, [requests, statusFilter])

const uniqueWarehouses = useMemo(() => {
  const warehouses = availableItems
    .filter((item) => item.ware_house)
    .map((item) => ({
      id: item.ware_house_id,
      name: item.ware_house!.name,
      address: item.ware_house!.address,
    }))

  // Remove duplicates based on warehouse id
  const unique = warehouses.filter((warehouse, index, self) => index === self.findIndex((w) => w.id === warehouse.id))

  return unique
}, [availableItems])

const [warehouseFilter, setWarehouseFilter] = useState<string>(
  uniqueWarehouses.length > 0 ? uniqueWarehouses[0].id.toString() : ""
)


const filteredAvailableItems = useMemo(() => {
  if (!warehouseFilter) return []
  return availableItems.filter(
    (item) => item.ware_house_id === Number.parseInt(warehouseFilter)
  )
}, [availableItems, warehouseFilter])

  useEffect(() => {
    fetchData()
  }, [user.ngo_id])

  useEffect(() => {
    if (isDialogOpen && !mapInitialized) {
      const loadScripts = async () => {
        try {
          console.log("Starting map initialization...")

          // Load Leaflet CSS first
          if (!document.querySelector('link[href*="leaflet"]')) {
            const leafletCSS = document.createElement("link")
            leafletCSS.rel = "stylesheet"
            leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            leafletCSS.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            leafletCSS.crossOrigin = ""
            document.head.appendChild(leafletCSS)

            // Wait for CSS to load
            await new Promise((resolve) => {
              leafletCSS.onload = resolve
              setTimeout(resolve, 500) // Fallback timeout
            })
          }

          // Load Leaflet JS
          if (!window.L) {
            await new Promise((resolve, reject) => {
              const leafletJS = document.createElement("script")
              leafletJS.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
              leafletJS.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
              leafletJS.crossOrigin = ""
              leafletJS.onload = () => {
                console.log("Leaflet loaded successfully")
                resolve(true)
              }
              leafletJS.onerror = (error) => {
                console.error("Failed to load Leaflet:", error)
                reject(error)
              }
              document.head.appendChild(leafletJS)
            })
          }

          // Load Google Maps API
          if (!window.google) {
            await new Promise((resolve, reject) => {
              window.initGoogleMaps = () => {
                console.log("Google Maps API loaded successfully")
                resolve(true)
              }

              const googleMapsJS = document.createElement("script")
              googleMapsJS.src =
                "https://maps.googleapis.com/maps/api/js?key=AIzaSyC58JRaLlXPfWGzU2POxSsHJo1lBUSIGCU&libraries=places&callback=initGoogleMaps"
              googleMapsJS.onerror = (error) => {
                console.error("Failed to load Google Maps:", error)
                reject(error)
              }
              document.head.appendChild(googleMapsJS)
            })
          }

          // Wait for DOM element and initialize map
          console.log("Waiting for map element...")
          await new Promise((resolve) => {
            const checkElement = () => {
              const mapElement = document.getElementById("route-map")
              if (mapElement && window.L) {
                console.log("Map element found, initializing...")

                // Clear any existing map
                if (map) {
                  map.remove()
                  map = null
                }

                // Initialize map with explicit options
                map = window.L.map("route-map", {
                  center: [16.8409, 96.1735],
                  zoom: 11,
                  preferCanvas: false,
                  zoomControl: true,
                  attributionControl: true,
                })

                // Add tile layer with error handling
                const tileLayer = window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                  maxZoom: 19,
                  attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
                  crossOrigin: true,
                })

                tileLayer.on("loading", () => {
                  console.log("Tiles loading...")
                })

                tileLayer.on("load", () => {
                  console.log("Tiles loaded successfully")
                })

                tileLayer.on("tileerror", (error: unknown) => {
                  console.error("Tile loading error:", error)
                })

                tileLayer.addTo(map)

                // Force map to render
                setTimeout(() => {
                  if (map) {
                    map.invalidateSize()
                    console.log("Map size invalidated and should be visible")
                  }
                }, 100)

                setMapInitialized(true)
                console.log("Map initialization completed successfully")
                resolve(true)
              } else {
                console.log("Map element or Leaflet not ready, retrying...")
                setTimeout(checkElement, 100)
              }
            }
            checkElement()
          })
        } catch (error) {
          console.error("Error during map initialization:", error)
          toast({
            title: "Map Loading Error",
            description: "Failed to load map. Please refresh and try again.",
            variant: "destructive",
          })
        }
      }

      loadScripts()
    }
  }, [isDialogOpen, mapInitialized, toast])

  const selectRoute = (index: number) => {
    setSelectedRouteIndex(index)
    if (mapInitialized) {
      highlightRoute(index)
    }
  }

  const handleItemSelection = (warehouseItem: WarehouseItem, checked: boolean) => {
    if (checked) {
      setSelectedItems([
        ...selectedItems,
        {
          item_id: warehouseItem.item_id,
          quantity: 1,
          max_quantity: warehouseItem.quantity,
          ware_house_id: warehouseItem.ware_house_id,
        },
      ])
    } else {
      setSelectedItems(selectedItems.filter((item) => item.item_id !== warehouseItem.item_id))
    }

    setShowRouteResults(false)
    setAvailableRoutes([])
  }

  const updateItemQuantity = (itemId: number, quantity: number) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.item_id === itemId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(quantity, item.max_quantity)),
            }
          : item,
      ),
    )
  }

  const handleSubmit = async () => {
    if (selectedItems.length === 0 || !showRouteResults) {
      toast({
        title: "Error",
        description: "Please select items and calculate route.",
        variant: "destructive",
      })
      return
    }

    const selectedRoute = availableRoutes[selectedRouteIndex]
    const warehouseId = selectedItems[0].ware_house_id

    setSubmitting(true)
    try {
      const requestData = {
        ngo_id: user.ngo_id,
        ware_house_id: warehouseId,
        items: selectedItems.map((item) => ({
          ware_house_id: item.ware_house_id,
          item_id: item.item_id,
          quantity: item.quantity,
        })),
        start: selectedRoute.start,
        end: selectedRoute.end,
        distance_km: selectedRoute.distance_km,
        distance_miles: selectedRoute.distance_miles,
        duration: selectedRoute.duration,
        duration_minutes: selectedRoute.duration_minutes,
        charge: selectedRoute.charge,
        polyline: selectedRoute.polyline || "",
      }

      await supplyRequestAPI.create(requestData)

      toast({
        title: "Success",
        description: "Supply request created successfully.",
        variant: "success",
      })

      await fetchData()
      setIsDialogOpen(false)
      setSelectedItems([])
      setShowRouteResults(false)
      setAvailableRoutes([])
      setRouteFormData({ startLocation: "", endLocation: "" })
      setMapInitialized(false)
    } catch (error: any) {
      console.error("Failed to create request:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "in_transit":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDuration = (duration: string | number) => {
    if (typeof duration === "number") {
      const minutes = duration
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
      }
      return `${minutes}m`
    }
    return duration
  }

  const getDeliveryStatus = (deliveries: Delivery[]) => {
    if (!deliveries || deliveries.length === 0) {
      return "-"
    }
    // Get the latest delivery status
    const latestDelivery = deliveries[deliveries.length - 1]
    return latestDelivery.status.replace("_", " ")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading requests...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Supply Requests</h2>
          <p className="text-muted-foreground">Create and track your supply requests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Supply Request</DialogTitle>
              <DialogDescription>Select items and calculate route for your request.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Available Items Selection */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Select Available Items</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  {filteredAvailableItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items available for your NGO.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Building2 className="h-4 w-4" />
                        <Label className="text-sm font-medium">Select Warehouse:</Label>
                        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* REMOVE this: */}
                            {/* <SelectItem value="all">All Warehouses</SelectItem> */}
                            {uniqueWarehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                {warehouse.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {filteredAvailableItems.map((warehouseItem) => {
                        const isSelected = selectedItems.some((item) => item.item_id === warehouseItem.item_id)
                        const selectedItem = selectedItems.find((item) => item.item_id === warehouseItem.item_id)

                        return (
                          <div key={warehouseItem.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`item-${warehouseItem.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => handleItemSelection(warehouseItem, checked as boolean)}
                              />
                              <div>
                                <Label htmlFor={`item-${warehouseItem.id}`} className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  <span className="font-medium">{warehouseItem.item?.name}</span>
                                  <span className="text-sm text-muted-foreground">({warehouseItem.item?.unit})</span>
                                </Label>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Warehouse: {warehouseItem.ware_house?.name} | Available: {warehouseItem.quantity}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <Label className="text-xs">Qty:</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max={warehouseItem.quantity}
                                  value={selectedItem?.quantity || 1}
                                  onChange={(e) =>
                                    updateItemQuantity(warehouseItem.item_id, Number.parseInt(e.target.value) || 1)
                                  }
                                  className="w-20"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Route Calculation */}
              {selectedItems.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Route Calculation</Label>

                  {/* Route Input Form with Google-style Autocomplete */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <LocationAutocomplete
                        id="start-location-input"
                        value={routeFormData.startLocation}
                        onChange={(value) =>
                          setRouteFormData({
                            ...routeFormData,
                            startLocation: value,
                          })
                        }
                        placeholder="Search for start location..."
                        label="Start Location"
                      />

                      <LocationAutocomplete
                        id="end-location-input"
                        value={routeFormData.endLocation}
                        onChange={(value) =>
                          setRouteFormData({
                            ...routeFormData,
                            endLocation: value,
                          })
                        }
                        placeholder="Search for end location..."
                        label="End Location"
                      />
                    </div>

                    <Button
                      onClick={() =>
                        calculateRoute(
                          routeFormData,
                          setCalculatingRoute,
                          setAvailableRoutes,
                          setSelectedRouteIndex,
                          setShowRouteResults,
                          toast,
                          mapInitialized,
                        )
                      }
                      disabled={calculatingRoute || !routeFormData.startLocation || !routeFormData.endLocation}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {calculatingRoute && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Calculate Route
                    </Button>
                  </div>

                  {/* Route Results */}
                  {showRouteResults && availableRoutes.length > 0 && (
                    <div className="space-y-4">
                      {/* Selected Route Summary */}
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-2">
                          <div className="font-medium">
                            <strong>Route:</strong> {availableRoutes[selectedRouteIndex].start} →{" "}
                            {availableRoutes[selectedRouteIndex].end}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <strong>Distance:</strong> {availableRoutes[selectedRouteIndex].distance_km} km
                            </div>
                            <div>
                              <strong>Duration:</strong> {availableRoutes[selectedRouteIndex].duration}
                            </div>
                            <div>
                              <strong>Charge:</strong> {availableRoutes[selectedRouteIndex].charge} MMK
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Route Selection Panel */}
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Select a route:</h4>
                        <div className="grid gap-2 max-h-48 overflow-y-auto">
                          {availableRoutes.map((route, index) => (
                            <div
                              key={index}
                              className={`p-3 border rounded cursor-pointer transition-colors text-sm ${
                                selectedRouteIndex === index
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => selectRoute(index)}
                            >
                              <div className="space-y-1">
                                <div className="font-medium text-blue-600">
                                  {route.start} → {route.end}
                                </div>
                                <div className="text-xs space-y-1">
                                  <div>
                                    <strong>Distance:</strong> {route.distance_km} km, <strong>Duration:</strong>{" "}
                                    {route.duration}
                                  </div>
                                  <div>
                                    <strong>Charge:</strong> {route.charge.toLocaleString()} MMK
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">Click on a route to highlight it on the map.</div>
                      </div>

                      {/* Map Container */}
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Route Map</h4>
                        <div
                          id="route-map"
                          className="h-80 border rounded-lg"
                          style={{
                            minHeight: "320px",
                            width: "100%",
                            position: "relative",
                            zIndex: 1,
                          }}
                        />
                        {!mapInitialized && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Loading map...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleSubmit} disabled={submitting || selectedItems.length === 0 || !showRouteResults}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Request ({selectedItems.length} items)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Requests ({filteredRequests.length})
              </CardTitle>
              <CardDescription>Supply requests and status</CardDescription>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Warehouse Filter */}
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {statusFilter === "all"
                  ? "No requests found. Create your first request to get started."
                  : `No ${statusFilter} requests found.`}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Delivery Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request, index) => {
                  const route = request.route_infos[0]
                  const deliveryStatus = getDeliveryStatus(request.deliveries)

                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        {[
                          ...new Set(
                            request.supply_request_items?.map((item) => item.ware_house?.name).filter(Boolean),
                          ),
                        ].join(", ")}
                      </TableCell>
                      <TableCell>
                        {route ? (
                          <div className="flex items-center gap-1 text-sm">
                            {route.start} → {route.end}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{route ? `${route.distance_km} km` : "-"}</TableCell>
                      <TableCell>
                        {route ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDuration(route.duration_minutes)}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {route ? (
                          <div className="flex items-center gap-1">{route.charge.toLocaleString()} MMK</div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className="text-sm">
                            Total: {request.supply_request_items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                            <div className="text-xs text-muted-foreground">
                              {request.supply_request_items
                                .map((item) => `${item.item?.name ?? `Item ${item.item_id}`} (${item.quantity})`)
                                .join(", ")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            request.status,
                          )}`}
                        >
                          {request.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {deliveryStatus === "-" ? (
                          <span className="text-gray-500">-</span>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              deliveryStatus,
                            )}`}
                          >
                            {deliveryStatus}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
