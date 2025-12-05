import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, ImageOverlay, useMapEvents, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Capacitor } from '@capacitor/core';

// --- LEAFLET ICON FIX ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// --- REGISTER CHART COMPONENTS ---
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// --- 25 GLOBAL LOCATIONS ---
const COASTAL_POINTS = [
  // INDIA
  { name: "Puri Beach, Odisha", lat: 19.798, lon: 85.824, type: "Erosion Risk" },
  { name: "Marine Drive, Mumbai", lat: 18.944, lon: 72.823, type: "Urban Coast" },
  { name: "Marina Beach, Chennai", lat: 13.050, lon: 80.282, type: "Sandy" },
  { name: "Varkala, Kerala", lat: 8.737, lon: 76.716, type: "Cliff" },
  { name: "Visakhapatnam", lat: 17.704, lon: 83.332, type: "Port City" },
  { name: "Lakshadweep", lat: 10.566, lon: 72.641, type: "Atoll" },
  { name: "Digha, WB", lat: 21.626, lon: 87.507, type: "Deltaic" },
  { name: "Rameswaram", lat: 9.287, lon: 79.312, type: "Coral" },
  { name: "Andaman Islands", lat: 11.976, lon: 92.987, type: "Mangrove" },
  { name: "Calangute, Goa", lat: 15.549, lon: 73.753, type: "Recreational" },
  
  // GLOBAL
  { name: "Gold Coast, Australia", lat: -28.016, lon: 153.400, type: "High Energy" },
  { name: "Miami Beach, USA", lat: 25.790, lon: -80.130, type: "Flood Risk" },
  { name: "Maldives", lat: 3.202, lon: 73.220, type: "Critical Level" },
  { name: "Dubai, UAE", lat: 25.204, lon: 55.270, type: "Artificial" },
  { name: "Cancun, Mexico", lat: 21.161, lon: -86.851, type: "Tourism" },
  { name: "Copacabana, Brazil", lat: -22.969, lon: -43.182, type: "Urban" },
  { name: "Nice, France", lat: 43.696, lon: 7.265, type: "Pebble" },
  { name: "Phuket, Thailand", lat: 7.880, lon: 98.392, type: "Tropical" },
  { name: "Bali, Indonesia", lat: -8.409, lon: 115.188, type: "Volcanic" },
  { name: "Cape Town, SA", lat: -33.924, lon: 18.424, type: "Rocky" },
  { name: "Santorini, Greece", lat: 36.393, lon: 25.461, type: "Caldera" },
  { name: "Bora Bora", lat: -16.500, lon: -151.741, type: "Lagoon" },
  { name: "Bondi Beach, Aus", lat: -33.891, lon: 151.277, type: "Bay" },
  { name: "Outer Banks, USA", lat: 35.558, lon: -75.466, type: "Barrier" },
  { name: "Cornwall, UK", lat: 50.266, lon: -5.052, type: "Rugged" }
];

const styles = {
    appShell: {
        position: 'relative',
        minHeight: '100vh',
        background: '#050505',
        color: '#f4f4f4',
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        overflow: 'hidden'
    },
    gradientBackdrop: {
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at 20% 20%, rgba(255,0,150,0.25), transparent 60%), radial-gradient(circle at 80% 0%, rgba(0,200,255,0.2), transparent 55%), linear-gradient(120deg, #05060a, #090014)',
        zIndex: 0
    },
    neonNoise: {
        position: 'fixed',
        inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\' viewBox=\'0 0 160 160\'%3E%3Cpath fill=\'%23555\' fill-opacity=\'0.05\' d=\'M0 0h20v20H0z\'/%3E%3C/svg%3E")',
        mixBlendMode: 'soft-light',
        opacity: 0.4,
        pointerEvents: 'none'
    },
    header: {
        padding: '20px 30px',
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    glassPanel: {
        background: 'rgba(10,10,15,0.7)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.45)'
    },
    controlPanel: {
        flex: 1,
        padding: '25px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
    },
    mapShell: {
        flex: 3,
        padding: '25px',
        minHeight: 0
    },
    mapCard: {
        borderRadius: '32px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.55)',
        position: 'relative'
    },
    glassButton: {
        width: '100%',
        padding: '14px 18px',
        borderRadius: '50px',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.08)',
        color: '#f5f5f5',
        cursor: 'pointer',
        fontWeight: 600,
        letterSpacing: '0.03em',
        backdropFilter: 'blur(10px)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    },
    aiButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '15px 22px',
        borderRadius: '48px',
        border: '1px solid rgba(22,220,255,0.4)',
        background: 'linear-gradient(120deg, #00c6ff 0%, #7a00ff 70%, #b300ff 100%)',
        boxShadow: '0 18px 40px rgba(79,0,255,0.45)',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: 600,
        letterSpacing: '0.04em'
    },
    aiButtonIcon: {
        width: '42px',
        height: '42px',
        borderRadius: '999px',
        background: 'rgba(0,0,0,0.25)',
        display: 'grid',
        placeItems: 'center',
        marginRight: '16px'
    },
    aiButtonArrow: {
        width: 0,
        height: 0,
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderBottom: '18px solid #00f5ff',
        transform: 'rotate(90deg)'
    }
};

const getDefaultGuardianPos = () => ({
    x: 30,
    y: typeof window !== 'undefined' ? window.innerHeight - 230 : 520
});

const resolveApiBaseUrl = () => {
    // Use production URL for native apps, localhost for web dev
    if (Capacitor?.isNativePlatform?.()) {
        return 'https://coaspire-server.onrender.com';  // Replace with your actual Render URL
    }
    return process.env.REACT_APP_API_BASE || 'http://localhost:3000';
};

const API_BASE_URL = resolveApiBaseUrl();

function MapController({ onBoundsChange, targetLocation }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
  });
  React.useEffect(() => {
    if (targetLocation) {
      map.flyTo([targetLocation.lat, targetLocation.lon], 13, { animate: true, duration: 1.5 });
    }
  }, [targetLocation, map]);
  return null;
}

const ReportModal = ({ data, location, onClose }) => {
    if (!data) return null;
    return (
        <div style={{
            position:'fixed', top:0, left:0, width:'100%', height:'100%', 
            background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', 
            justifyContent:'center', alignItems:'center', backdropFilter:'blur(5px)'
        }}>
            <div style={{
                width:'700px', background:'#111', border:'2px solid #00d2ff', 
                borderRadius:'10px', padding:'30px', position:'relative',
                boxShadow:'0 0 30px rgba(0, 210, 255, 0.3)', color: 'white'
            }}>
                <button onClick={onClose} style={{position:'absolute', top:'15px', right:'20px', background:'none', border:'none', color:'white', fontSize:'20px', cursor:'pointer'}}>✖</button>
                <h2 style={{color:'#00d2ff', borderBottom:'1px solid #333', paddingBottom:'10px', marginTop: 0}}>📄 STRATEGIC COASTAL REPORT</h2>
                <h4 style={{color:'white', marginTop:'5px'}}>Target Zone: {location?.name || "Unknown Region"}</h4>
                <div style={{background:'#1a1a1a', padding:'15px', borderRadius:'5px', marginBottom:'20px', borderLeft:'4px solid #00d2ff'}}>
                    <strong style={{color:'#00d2ff'}}>AI STRATEGY:</strong><br/>
                    <span style={{color:'#ddd', fontSize:'0.9em'}}>{data.ai_recommendation}</span>
                </div>
                <table style={{width:'100%', borderCollapse:'collapse', color:'#ccc', fontSize:'0.9em'}}>
                    <thead>
                        <tr style={{borderBottom:'1px solid #444', textAlign:'left'}}>
                            <th style={{padding:'10px'}}>Timeline</th>
                            <th>Vegetation (%)</th>
                            <th>Erosion Index</th>
                            <th>Recovery Potential</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.timeline_data.map((row, idx) => (
                            <tr key={idx} style={{borderBottom:'1px solid #222'}}>
                                <td style={{padding:'10px', color:'white'}}>{row.year}</td>
                                <td style={{color: row.vegetation < 50 ? '#ff0055' : '#00ffcc'}}>{row.vegetation}%</td>
                                <td>{row.erosion_risk}</td>
                                <td style={{color:'#00d2ff'}}>{row.restoration_potential}</td>
                                <td style={{fontWeight:'bold', color: row.status === 'CRITICAL' ? '#ff0055' : row.status === 'WARNING' ? '#ffcc00' : '#00ffcc'}}>{row.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{marginTop:'25px', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                    <button onClick={() => window.print()} style={{padding:'10px 20px', background:'#333', color:'white', border:'1px solid #555', cursor:'pointer', borderRadius:'4px'}}>Print PDF</button>
                    <button onClick={onClose} style={{padding:'10px 20px', background:'#00d2ff', color:'black', fontWeight:'bold', border:'none', cursor:'pointer', borderRadius:'4px'}}>Close Report</button>
                </div>
            </div>
        </div>
    );
};

const PredictorModal = ({ data, onClose }) => {
    if (!data) return null;
    const chartData = {
        labels: data.visit_points.map((_, idx) => `Point ${idx + 1}`),
        datasets: [{
            label: 'Optimistic Data Values',
            data: data.graph_data,
            backgroundColor: 'rgba(0, 210, 255, 0.6)',
            borderColor: '#00d2ff',
            borderWidth: 1
        }]
    };
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#ccc' } },
            title: { display: true, text: 'Visit Points Analysis', color: '#00d2ff' }
        },
        scales: {
            x: { ticks: { color: '#888' }, grid: { color: '#333' } },
            y: { ticks: { color: '#888' }, grid: { color: '#333' } }
        }
    };
    return (
        <div style={{
            position:'fixed', top:0, left:0, width:'100%', height:'100%', 
            background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', 
            justifyContent:'center', alignItems:'center', backdropFilter:'blur(5px)'
        }}>
            <div style={{
                width:'800px', maxHeight:'90vh', overflowY:'auto', background:'#111', border:'2px solid #00d2ff', 
                borderRadius:'10px', padding:'30px', position:'relative',
                boxShadow:'0 0 30px rgba(0, 210, 255, 0.3)', color: 'white'
            }}>
                <button onClick={onClose} style={{position:'absolute', top:'15px', right:'20px', background:'none', border:'none', color:'white', fontSize:'20px', cursor:'pointer'}}>✖</button>
                <h2 style={{color:'#00d2ff', borderBottom:'1px solid #333', paddingBottom:'10px', marginTop: 0}}>🤖 AI PREDICTOR RESULTS</h2>
                <div style={{marginBottom:'20px'}}>
                    <h4>Graph Plot:</h4>
                    <div style={{height:'300px'}}>
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                </div>
                <div style={{marginBottom:'20px'}}>
                    <h4>Numerical Values:</h4>
                    <table style={{width:'100%', borderCollapse:'collapse', color:'#ccc', fontSize:'0.9em'}}>
                        <thead>
                            <tr style={{borderBottom:'1px solid #444'}}>
                                <th style={{padding:'10px'}}>Point</th>
                                <th>Lat</th>
                                <th>Lon</th>
                                <th>Data Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.visit_points.map((point, idx) => (
                                <tr key={idx} style={{borderBottom:'1px solid #222'}}>
                                    <td style={{padding:'10px'}}>{idx + 1}</td>
                                    <td>{point.lat.toFixed(4)}</td>
                                    <td>{point.lon.toFixed(4)}</td>
                                    <td>{data.graph_data[idx]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{marginBottom:'20px'}}>
                    <h4>Classification:</h4>
                    <p style={{color:'#ddd'}}>{data.summary.classification}</p>
                </div>
                <div style={{marginBottom:'20px'}}>
                    <h4>GIS Picture:</h4>
                    <img src={`data:image/png;base64,${data.gis_image}`} alt="GIS" style={{maxWidth:'100%', border:'1px solid #333'}} />
                </div>
                <div style={{display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                    <button onClick={() => window.print()} style={{padding:'10px 20px', background:'#333', color:'white', border:'1px solid #555', cursor:'pointer', borderRadius:'4px'}}>Print</button>
                    <button onClick={onClose} style={{padding:'10px 20px', background:'#00d2ff', color:'black', fontWeight:'bold', border:'none', cursor:'pointer', borderRadius:'4px'}}>Close</button>
                </div>
            </div>
        </div>
    );
};

const AnimatedTransectsOverlay = ({ active }) => {
    if (!active) return null;
    const wrapperStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
    };
    const sweepStyle = {
        width: '100%',
        height: '100%',
        backgroundImage: 'repeating-linear-gradient( 90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 18px)',
        animation: 'transectSweep 4s linear infinite',
        mixBlendMode: 'screen',
        opacity: 0.45,
        backdropFilter: 'blur(0.5px)'
    };
    return (
        <div style={wrapperStyle}>
            <div style={sweepStyle} />
        </div>
    );
};

const LiveIntelWidget = ({ visData, onDeepScan, scanLog, visible, position, onDragStart }) => {
    if (!visible) return null;
    const veg = visData?.metrics?.vegetation_coverage ?? 62;
    const erosion = visData?.metrics?.erosion_risk_index ?? 38;
    const healthScore = Math.max(0, Math.min(100, Math.round(veg - erosion / 3)));

    return (
        <div
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: '260px',
                padding: '18px',
                borderRadius: '24px',
                background: 'rgba(8,8,20,0.85)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.45)',
                backdropFilter: 'blur(14px)',
                color: '#e8e8ff',
                zIndex: 5,
                cursor: 'grab'
            }}
            onMouseDown={onDragStart}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '0.75em', letterSpacing: '0.2em', color: '#8f9aff' }}>SPECTRAL NODE</div>
                    <strong style={{ fontSize: '1.1em' }}>Guardian Watch</strong>
                </div>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#32ffd2', boxShadow: '0 0 8px #32ffd2' }} />
            </div>
            <div style={{ margin: '18px 0 10px' }}>
                <div style={{ fontSize: '0.75em', color: '#b7b7d3', marginBottom: '6px' }}>Bio-Shield Integrity</div>
                <div style={{ height: '12px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${healthScore}%`, height: '100%', background: 'linear-gradient(90deg,#00ffc6,#7d34ff)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75em', color: '#9a9ab9', marginTop: '4px' }}>
                    <span>{healthScore}%</span>
                    <span>Stability</span>
                </div>
            </div>
            <div style={{ fontSize: '0.75em', color: '#b4b4d6', minHeight: '34px' }}>{scanLog || 'Awaiting deep scan command.'}</div>
            <button onClick={(e) => { e.stopPropagation(); onDeepScan(); }} style={{
                marginTop: '10px',
                width: '100%',
                padding: '10px 0',
                borderRadius: '999px',
                border: '1px solid rgba(0,255,214,0.6)',
                background: 'rgba(0,0,0,0.35)',
                color: '#f5f5ff',
                fontWeight: 600,
                cursor: 'pointer'
            }}>
                Deploy Deep Scan
            </button>
        </div>
    );
};

// --- MAIN APPLICATION ---
function App() {
  const [currentBounds, setCurrentBounds] = useState(null);
  const [visData, setVisData] = useState(null); 
  const [reportData, setReportData] = useState(null); 
  const [showReport, setShowReport] = useState(false);
  const [showGraph, setShowGraph] = useState(false); // GRAPH VISIBILITY STATE
  const [loading, setLoading] = useState(false);
  const [targetLocation, setTargetLocation] = useState(null);
  const [futureYear, setFutureYear] = useState(0);
  const [predictorData, setPredictorData] = useState(null);
  const [showPredictor, setShowPredictor] = useState(false);
    const [guardianLog, setGuardianLog] = useState('');
    const [showGuardian, setShowGuardian] = useState(true);
    const [guardianPos, setGuardianPos] = useState(getDefaultGuardianPos);
    const [guardianDrag, setGuardianDrag] = useState({ active: false, offsetX: 0, offsetY: 0 });

  // 1. RUN SIMULATION
  const handleAnalyze = async () => {
    if (!currentBounds) return;
    setLoading(true);
    // Reset graph on new run
    setShowGraph(false);
    
    const bbox = [currentBounds.getSouth(), currentBounds.getWest(), currentBounds.getNorth(), currentBounds.getEast()];
    
    try {
    const res = await axios.post(`${API_BASE_URL}/api/coastal-analysis`, {
        bbox, future_year: futureYear, show_transects: true
      });
      setVisData(res.data);
    } catch (err) { 
        console.error(err); 
        alert("Connection Error: Ensure Node (3000) and Python (5000) are running.");
    }
    setLoading(false);
  };

  // 2. GENERATE REPORT
  const handleGenerateReport = async () => {
    setLoading(true);
    try {
        const res = await axios.post(`${API_BASE_URL}/api/generate-report`, {});
        setReportData(res.data);
        setShowReport(true);
    } catch (err) { alert("Failed to generate report."); }
    setLoading(false);
  };

  // 3. AI PREDICTOR
  const handleAIPredictor = async () => {
    setLoading(true);
    try {
        const res = await axios.post(`${API_BASE_URL}/api/ai-predictor`, {});
        setPredictorData(res.data);
        setShowPredictor(true);
    } catch (err) { alert("Failed to run AI Predictor."); }
    setLoading(false);
  };

    const handleGuardianScan = () => {
        const statusBank = [
                'Ionizing coastal drift... residual surge dampened.',
                'Mangrove lattice shows regenerative pulse.',
                'Infra-spectral sweep detected latent erosion pockets.',
                'Turbulence barrier calibrated to +3.2 resilience index.'
        ];
        const risk = visData?.metrics?.erosion_risk_index ?? 42;
        const pick = statusBank[Math.floor(Math.random() * statusBank.length)];
        setGuardianLog(`${pick} Risk vector ${risk.toFixed(1)}.`);
    };

    const handleGuardianToggle = () => setShowGuardian(prev => !prev);

    const handleGuardianDragStart = (e) => {
        e.preventDefault();
        setGuardianDrag({ active: true, offsetX: e.clientX - guardianPos.x, offsetY: e.clientY - guardianPos.y });
    };

    useEffect(() => {
        if (!guardianDrag.active) return;
        const handleMove = (event) => {
            setGuardianPos(prev => {
                const newX = Math.min(Math.max(10, event.clientX - guardianDrag.offsetX), window.innerWidth - 280);
                const newY = Math.min(Math.max(10, event.clientY - guardianDrag.offsetY), window.innerHeight - 190);
                return { x: newX, y: newY };
            });
        };
        const handleUp = () => setGuardianDrag(prev => ({ ...prev, active: false }));
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [guardianDrag]);

    useEffect(() => {
        const handleResize = () => {
            setGuardianPos(prev => ({
                x: Math.min(prev.x, window.innerWidth - 280),
                y: Math.min(prev.y, window.innerHeight - 190)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

  // 3. TOGGLE GRAPH HANDLER
  const toggleGraph = () => {
      if (!visData) {
          alert("Please click 'Run Twin Simulation' first to generate data!");
          return;
      }
      setShowGraph(!showGraph);
  };

  // --- CHART CONFIG ---
    const getChartData = () => {
        const sliderLabel = futureYear > 0 ? `Year +${futureYear}` : 'Year +50';
        const labels = ['Year 0', 'Year 10', 'Year 20', 'Year 30', 'Year 40', sliderLabel];
        const sliderInfluence = futureYear / 5; // smooth response for all series

        const vegetationSeries = [80, 75, 70, 65, 60, 55].map((value, idx) => {
                const adjusted = value - sliderInfluence * idx;
                return Math.max(20, Number(adjusted.toFixed(2)));
        });

        const erosionSeries = [20, 25, 30, 40, 55, 60].map((value, idx) => {
                const adjusted = value + sliderInfluence * (idx + 1);
                return Math.min(95, Number(adjusted.toFixed(2)));
        });

        const shorelineSeries = [5, 10, 15, 25, 35, 45].map((value, idx) => {
                const adjusted = value + (sliderInfluence * idx) / 2;
                return Number(adjusted.toFixed(2));
        });

        if (visData) {
                vegetationSeries[vegetationSeries.length - 1] = visData.metrics.vegetation_coverage;
                erosionSeries[erosionSeries.length - 1] = visData.metrics.erosion_risk_index;
        }

        return {
            labels,
            datasets: [
                {
                    label: 'Vegetation Edge',
                    data: vegetationSeries,
                    borderColor: '#00ffcc',
                    backgroundColor: 'rgba(0, 255, 204, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Coastal Erosion',
                    data: erosionSeries,
                    borderColor: '#ff0055',
                    backgroundColor: 'rgba(255, 0, 85, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Water Shorelines',
                    data: shorelineSeries,
                    borderColor: '#00d2ff',
                    borderDash: [5, 5],
                    tension: 0.4
                }
            ]
        };
    };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#ccc', boxWidth: 10, font: { size: 10 } } },
        title: { display: false }
    },
    scales: {
        x: { grid: { color: '#333' }, ticks: { color: '#888', font: { size: 9 } } },
        y: { grid: { color: '#333' }, ticks: { color: '#888', font: { size: 9 } } }
    }
  };

    return (
        <div style={styles.appShell}>
            <div style={styles.gradientBackdrop} />
            <div style={styles.neonNoise} />

            {showReport && <ReportModal data={reportData} location={targetLocation} onClose={() => setShowReport(false)} />}
            {showPredictor && <PredictorModal data={predictorData} onClose={() => setShowPredictor(false)} />}

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <header className="neon-header" style={styles.header}>
                    <div style={{ ...styles.glassPanel, padding: '18px 24px', flex: 1, marginRight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                        <div>
                            <h2 style={{ margin: 0, color: '#fefefe', letterSpacing: '0.08em' }}>COASPIRE <span style={{ color: '#7f6bff' }}>NEXUS</span></h2>
                            <small style={{ color: '#a6a6c9', fontSize: '0.8em' }}>Hyper-vision Coastal Digital Twin</small>
                        </div>
                        <button onClick={handleGuardianToggle} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 16px',
                            borderRadius: '999px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: showGuardian ? 'rgba(0, 255, 214, 0.18)' : 'rgba(255,255,255,0.05)',
                            color: '#f5f5ff',
                            cursor: 'pointer',
                            fontWeight: 600,
                            letterSpacing: '0.06em'
                        }}>
                            <span style={{ fontSize: '1.2em' }}>🛰️</span>
                            Guardian {showGuardian ? 'Docked' : 'Hidden'}
                        </button>
                    </div>
                    <div style={{ ...styles.glassPanel, padding: '10px 18px' }}>
                        <select
                            onChange={(e) => { const loc = COASTAL_POINTS.find(p => p.name === e.target.value); setTargetLocation(loc); setVisData(null); setShowGraph(false); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f8f8ff',
                                fontWeight: 500,
                                minWidth: '220px',
                                outline: 'none'
                            }}
                        >
                            <option>Select Target Zone...</option>
                            {COASTAL_POINTS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                </header>

                <div style={{ display: 'flex', flex: 1, gap: '25px', padding: '0 25px 35px', flexWrap: 'wrap' }}>
                    {/* MAP */}
                    <div style={{ ...styles.mapShell, width: 'min(100%, 1000px)', flexGrow: 999 }}>
                        <div style={styles.mapCard}>
                            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', minHeight: '520px', width: '100%', background: '#000' }}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                                {COASTAL_POINTS.map((point, idx) => (
                                    <Marker key={idx} position={[point.lat, point.lon]}>
                                        <Popup style={{ background: '#000' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <strong>{point.name}</strong><br />
                                                <span style={{ color: '#00d2ff', fontSize: '0.9em' }}>{point.type}</span><br />
                                                <button onClick={() => setTargetLocation(point)} style={{ cursor: 'pointer', marginTop: '8px', background: '#333', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '3px' }}>Zoom Here</button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                                {visData && currentBounds && (<ImageOverlay url={visData.mask_image} bounds={currentBounds} opacity={0.8} />)}
                                <MapController onBoundsChange={setCurrentBounds} targetLocation={targetLocation} />
                            </MapContainer>
                            <AnimatedTransectsOverlay active={!!visData} />
                        </div>
                    </div>

                    {/* CONTROL CENTER */}
                      <div className="control-stack" style={{ ...styles.glassPanel, ...styles.controlPanel, minWidth: '320px', flex: '1 1 320px' }}>
                        <div>
                            <h4 style={{ margin: 0, color: '#fefefe', letterSpacing: '0.1em' }}>CONTROL DECK</h4>
                            <small style={{ color: '#b6b6d8' }}>Adaptive intelligence suite</small>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', color: '#d6d6fb', fontWeight: 600 }}>
                                Predictive Model
                                <span style={{ color: '#ff6adf' }}>+{futureYear} yrs</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                step="5"
                                value={futureYear}
                                onChange={(e) => setFutureYear(Number(e.target.value))}
                                style={{ width: '100%', accentColor: '#b700ff', height: '6px', marginTop: '12px' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75em', color: '#7c7ca0' }}>
                                <span>Now</span><span>+25</span><span>+50</span>
                            </div>
                        </div>

                        <button onClick={handleAnalyze} disabled={loading} style={{ ...styles.glassButton, borderColor: 'rgba(0,210,255,0.6)', color: '#00eaff', boxShadow: '0 12px 30px rgba(0, 200, 255, 0.2)' }}>
                            {loading ? 'Processing...' : 'Run Twin Simulation'}
                        </button>

                        <button onClick={handleGenerateReport} disabled={loading} style={{ ...styles.glassButton, background: 'linear-gradient(120deg, rgba(0,210,255,0.25), rgba(126,0,255,0.3))', color: '#fff', boxShadow: '0 12px 30px rgba(126,0,255,0.35)' }}>
                            Generate Strategic Report
                        </button>

                        <button onClick={handleAIPredictor} disabled={loading} style={{ ...styles.aiButton, opacity: loading ? 0.6 : 1 }}>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={styles.aiButtonIcon}><span style={styles.aiButtonArrow} /></span>
                                AI Predictor Terminal
                            </span>
                            <span style={{ fontSize: '0.85em', letterSpacing: '0.15em' }}>LIVE</span>
                        </button>

                        <button onClick={toggleGraph} style={{ ...styles.glassButton, background: showGraph ? 'rgba(0,0,0,0.35)' : 'rgba(255, 0, 125, 0.3)', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                            {showGraph ? 'Hide Graph Output' : 'Show Real Time Graph 📊'}
                        </button>

                        {showGraph && visData && (
                            <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '15px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <h5 style={{ margin: '0 0 10px 0', color: '#c6c6ff' }}>Real-time Telemetry</h5>
                                <div style={{ minHeight: '220px' }}>
                                    <Line data={getChartData()} options={chartOptions} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#d1d1ff', marginTop: '8px' }}>
                                    <span>Veg: {visData.metrics.vegetation_coverage}%</span>
                                    <span>Risk: {visData.metrics.erosion_risk_index}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes transectSweep {
                        from { background-position: 0 0; }
                        to { background-position: 320px 0; }
                    }
                    @media (max-width: 1100px) {
                        .neon-header {
                            flex-direction: column;
                            gap: 15px;
                        }
                    }
                    @media (max-width: 900px) {
                        .control-stack {
                            width: 100%;
                        }
                    }
                `}</style>
            </div>
            <LiveIntelWidget
                visData={visData}
                onDeepScan={handleGuardianScan}
                scanLog={guardianLog}
                visible={showGuardian}
                position={guardianPos}
                onDragStart={handleGuardianDragStart}
            />
        </div>
    );
}

export default App;