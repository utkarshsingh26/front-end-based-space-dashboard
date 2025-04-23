import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/images/marker-icon-2x.png";

L.Icon.Default.mergeOptions({
    iconUrl: 'marker-icon-2x.png',
    shadowUrl: 'marker-shadow.png',
});

// Component to handle map operations
function MapController({ selectedLocation, onMapReady }) {
    const map = useMap();
    
    // Effect to handle when a location is selected
    useEffect(() => {
        if (selectedLocation) {
            // Fly to the selected location with animation
            map.flyTo(
                [selectedLocation.lat, selectedLocation.long], 
                10, // zoom level
                {
                    animate: true,
                    duration: 1.5 // seconds
                }
            );
            
            // Create a temporary marker with a popup that automatically opens
            const marker = L.marker([selectedLocation.lat, selectedLocation.long])
                .addTo(map)
                .bindPopup(
                    `<div>
                        <strong>${selectedLocation.title}</strong><br/>
                        <p>${selectedLocation.summary}</p>
                        ${selectedLocation.url ? `<a href="${selectedLocation.url}" target="_blank">Read more</a>` : ''}
                    </div>`
                )
                .openPopup();
                
            // Remove the marker after a delay (when navigating to next location)
            return () => {
                map.removeLayer(marker);
            };
        }
    }, [map, selectedLocation]);
    
    // Notify parent when map is ready
    useEffect(() => {
        if (onMapReady) {
            onMapReady(map);
        }
    }, [map, onMapReady]);
    
    return null;
}

// Component to add heatmap layer
function AddHeatmapLayer({ heatmapData }) {
    const map = useMap();
    const heatmapLayerRef = useRef(null); 

    useEffect(() => {
        if (heatmapLayerRef.current) {
            map.removeLayer(heatmapLayerRef.current);
        }

        if (heatmapData.length > 0) {
            const heatmapLayer = L.heatLayer(heatmapData, { radius: 25 }).addTo(map);
            heatmapLayerRef.current = heatmapLayer;
        }

        return () => {
            if (heatmapLayerRef.current) {
                map.removeLayer(heatmapLayerRef.current);
            }
        };
    }, [map, heatmapData]);

    return null;
}

const Map = forwardRef(({ markers = [], selectedLocation, onMapReady }, ref) => {
    const position = [51.505, -0.09]; // Default map position
    const heatmapData = markers.map(marker => [marker.lat, marker.long]);
    const mapRef = useRef(null);
    
    // Expose map methods to parent components
    useImperativeHandle(ref, () => ({
        flyTo: (lat, lng, zoom = 10) => {
            if (mapRef.current) {
                mapRef.current.flyTo([lat, lng], zoom, {
                    animate: true,
                    duration: 1.5
                });
            }
        },
        getMap: () => mapRef.current
    }));

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <MapContainer
                center={position}
                zoom={4}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <AddHeatmapLayer heatmapData={heatmapData} />
                
                <MapController 
                    selectedLocation={selectedLocation} 
                    onMapReady={(map) => {
                        mapRef.current = map;
                        if (onMapReady) onMapReady(map);
                    }}
                />

                {markers.length > 0 ? (
                    markers.map((marker, index) => (
                        <Marker key={index} position={[marker.lat, marker.long]}>
                            <Popup>
                                <div>
                                    <strong>Title:</strong> {marker.title} <br />
                                    <strong>Summary:</strong> {marker.summary} <br />
                                    <strong>URL:</strong> <a href={marker.url} target="_blank" rel="noopener noreferrer">{marker.url}</a>
                                </div>
                            </Popup>
                        </Marker>
                    ))
                ) : (
                    <Popup position={position}>
                        No markers to display.
                    </Popup>
                )}
            </MapContainer>
        </div>
    );
});

export default Map;
