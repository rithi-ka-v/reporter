import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "../lib/leafletSetup";
import API from "../api/axios";
import { categoryLabel } from "../constants/categories";

const DEFAULT_CENTER = [11.0168, 76.9558]; // Coimbatore
// Rough bounding box around Tamil Nadu, used to softly bias search results
// toward the state without excluding results elsewhere in India.
const TN_VIEWBOX = "76.2,13.6,80.4,8.0";

// Wider zoom for large areas (district/taluk), tighter for a street or landmark.
const zoomForPlace = (place) => {
  const type = place.type || place.class;
  if (place.class === "boundary" && type !== "village") return 10;
  if (["city", "town", "county", "state_district"].includes(type)) return 12;
  if (["village", "suburb", "neighbourhood"].includes(type)) return 14;
  return 16; // street, house, POI
};

// Small helper component that lets us imperatively pan/zoom the map
// from outside the MapContainer (react-leaflet requires this pattern).
const FlyTo = ({ position, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 15, { duration: 1 });
    }
  }, [position, zoom, map]);
  return null;
};

const LocationSearch = ({ onFound }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [noResults, setNoResults] = useState(false);
  const debounceRef = useRef(null);

  // Uses OpenStreetMap's free Nominatim geocoding API - no API key required.
  // Biased toward Tamil Nadu (soft bias via viewbox, bounded=0) and India
  // (countrycodes=in) so street / village / taluk / district names resolve
  // to the right place instead of a same-named spot elsewhere in the world.
  // Returns the fetched results so callers (like Enter-to-search) can use
  // them immediately instead of waiting on state to update.
  const runSearch = async (text) => {
    if (!text.trim()) {
      setResults([]);
      setNoResults(false);
      return [];
    }
    setSearching(true);
    setError("");
    setNoResults(false);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1` +
        `&countrycodes=in&viewbox=${TN_VIEWBOX}&bounded=0` +
        `&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data);
      setNoResults(data.length === 0);
      return data;
    } catch (err) {
      setError("Search failed — try again.");
      return [];
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 450);
  };

  const handleSelect = (place) => {
    onFound([parseFloat(place.lat), parseFloat(place.lon)], place.display_name, zoomForPlace(place));
    setQuery(place.display_name);
    setResults([]);
  };

  // Pressing Enter (or tapping the search button) jumps straight to the
  // best match instead of requiring a click on a dropdown suggestion.
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    if (!query.trim()) return;

    if (results.length > 0) {
      handleSelect(results[0]);
      return;
    }
    const fresh = await runSearch(query);
    if (fresh.length > 0) {
      handleSelect(fresh[0]);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onFound([pos.coords.latitude, pos.coords.longitude], "My current location", 16);
        setQuery("My current location");
        setResults([]);
        setSearching(false);
      },
      () => {
        setError("Location permission denied.");
        setSearching(false);
      }
    );
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={handleChange}
            placeholder="Search a street, village, taluk, or district…"
            className="input-field !py-2.5 pr-8"
          />
          {searching && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-steel">…</span>
          )}
        </div>
        <button type="submit" className="btn-primary !px-4 !py-2.5 !text-xs whitespace-nowrap">
          🔍 Search
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          className="btn-secondary !px-4 !py-2.5 !text-xs whitespace-nowrap"
        >
          📍 My location
        </button>
      </form>

      {error && <p className="font-body text-xs text-hazard-dark mt-2">{error}</p>}
      {noResults && !error && (
        <p className="font-body text-xs text-steel mt-2">
          No match for that — try adding "Coimbatore" or the district name.
        </p>
      )}

      {results.length > 0 && (
        <ul className="absolute z-[1000] mt-2 w-full bg-white rounded-2xl shadow-lift border border-ink/8 max-h-72 overflow-y-auto overflow-hidden">
          {results.map((place) => (
            <li key={place.place_id}>
              <button
                type="button"
                onClick={() => handleSelect(place)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-brand-light hover:text-brand-dark border-b border-ink/6 last:border-b-0 transition-colors"
              >
                {place.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const MapView = () => {
  const [issues, setIssues] = useState([]);
  const [searchedPosition, setSearchedPosition] = useState(null);
  const [searchedLabel, setSearchedLabel] = useState("");
  const [searchedZoom, setSearchedZoom] = useState(15);

  useEffect(() => {
    API.get("/issues")
      .then(({ data }) => setIssues(data))
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto w-full px-5 md:px-8 py-6 bg-paper">
        <span className="eyebrow mb-2 block">Live register</span>
        <h1 className="font-display font-semibold text-3xl mb-4">Issues on the map</h1>
        <LocationSearch
          onFound={(pos, label, zoom) => {
            setSearchedPosition(pos);
            setSearchedLabel(label);
            setSearchedZoom(zoom);
          }}
        />
      </div>
      <div className="flex-1 rounded-t-3xl overflow-hidden shadow-lift">
        <MapContainer center={DEFAULT_CENTER} zoom={13} className="w-full h-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <FlyTo position={searchedPosition} zoom={searchedZoom} />

          {searchedPosition && (
            <Marker position={searchedPosition}>
              <Popup>
                <p className="font-body text-xs">{searchedLabel}</p>
              </Popup>
            </Marker>
          )}

          {issues.map((issue) => {
            const [lng, lat] = issue.location.coordinates;
            return (
              <Marker key={issue._id} position={[lat, lng]}>
                <Popup>
                  <div className="font-body">
                    <p className="font-semibold text-sm mb-1">{issue.title}</p>
                    <p className="text-xs text-ink/60 mb-2">
                      {categoryLabel(issue.category)} · {issue.status}
                    </p>
                    <Link to={`/issues/${issue._id}`} className="text-xs underline text-brand-dark">
                      View details →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;
