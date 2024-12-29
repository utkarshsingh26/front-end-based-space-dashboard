import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function Map({ markers = [] }) { // Default to an empty array if markers is undefined
    const position = [51.505, -0.09]; // Default map position

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
                {markers.length > 0 ? (
                    markers.map((marker, index) => (
                        <Marker key={index} position={[marker.lat, marker.long]}>
                            <Popup>
                                Latitude: {marker.lat}, Longitude: {marker.long}
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
