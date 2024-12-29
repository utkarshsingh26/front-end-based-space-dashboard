import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat'; 
import "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/images/marker-icon-2x.png";

function Map({ markers = [] }) {
    const position = [51.505, -0.09]; // Default map position


    const heatmapData = markers.map(marker => [marker.lat, marker.long]);

    function AddHeatmapLayer() {
        const map = useMap();
        useEffect(() => {
            if (heatmapData.length > 0) {

                L.heatLayer(heatmapData, { radius: 25 }).addTo(map);
            }
        }, [map, heatmapData]); 

        return null;
    }

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
                
                <AddHeatmapLayer />

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
}

export default Map;
