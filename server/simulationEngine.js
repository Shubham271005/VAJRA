// 3 Deterministic simulation states that accurately mimic convective lifecycle in the Himalayas
const SCENARIOS = [
  {
    id: 'stage-1-approaching',
    name: 'Convective Initiation & Pre-Burst Convergence',
    simulatedTimestamp: '06 SEP 2026 • 18:30 IST',
    forecast: [
      { hour: 0, label: 'NOW', cloudburst: 52, flood: 43, storm: 68 },
      { hour: 1, label: '+1 HR', cloudburst: 61, flood: 51, storm: 77 },
      { hour: 2, label: '+2 HR', cloudburst: 74, flood: 62, storm: 87 },
      { hour: 3, label: '+3 HR', cloudburst: 82, flood: 67, storm: 91 },
      { hour: 4, label: '+4 HR', cloudburst: 77, flood: 64, storm: 84 },
      { hour: 5, label: '+5 HR', cloudburst: 63, flood: 55, storm: 72 },
      { hour: 6, label: '+6 HR', cloudburst: 48, flood: 44, storm: 58 }
    ],
    signals: [
      { key: 'IWV', name: 'Integrated Water Vapour', value: 42.8, unit: 'kg/m²', trend: '+34%', status: 'RISING', series: [34, 35, 36, 37, 39, 41, 42.8] },
      { key: 'CAPE', name: 'Convective Available Potential Energy', value: 2140, unit: 'J/kg', trend: '+18%', status: 'HIGH', series: [1680, 1750, 1810, 1900, 1990, 2070, 2140] },
      { key: 'CIN', name: 'Convective Inhibition', value: 34, unit: 'J/kg', trend: '-29%', status: 'DECREASING', series: [55, 51, 48, 44, 41, 37, 34] },
      { key: 'WCONV', name: 'Low-level Wind Convergence', value: 8.7, unit: '10⁻⁴ s⁻¹', trend: '+21%', status: 'HIGH', series: [5.5, 6.1, 6.4, 7.0, 7.5, 8.2, 8.7] },
      { key: 'VWS', name: 'Vertical Wind Shear', value: 19.4, unit: 'm/s', trend: '+11%', status: 'ELEVATED', series: [15, 15.7, 16.3, 17.2, 18.1, 18.7, 19.4] },
      { key: 'CTT', name: 'Cloud Top Temperature', value: -52, unit: '°C', trend: '-8°C', status: 'COOLING', series: [-37, -39, -41, -43, -46, -49, -52] }
    ],
    places: [
      { id: 'kedarnath', name: 'Kedarnath / Chorabari Sector', lat: 30.735, long: 79.067, hazard: 'Cloudburst', prob: 88, level: 'HIGH', lead: '1 hr', signals: 'Glaciated CTT -43°C + Peak Rain 45.7 mm/hr' },
      { id: 'gaurikund', name: 'Rambara - Gaurikund Gorge', lat: 30.652, long: 79.043, hazard: 'Flash Flood', prob: 88, level: 'HIGH', lead: '2 hrs', signals: 'Peak Rain 67.2 mm/hr + Steep Slopes (38°)' },
      { id: 'guptkashi', name: 'Guptkashi - Phata Ridge', lat: 30.523, long: 79.077, hazard: 'Thunderstorm', prob: 84, level: 'HIGH', lead: '1 hr', signals: 'Thermodynamic CAPE 2480 J/kg + Strong Shear' },
      { id: 'rudraprayag', name: 'Rudraprayag Control Zone', lat: 30.285, long: 78.981, hazard: 'Flash Flood', prob: 82, level: 'HIGH', lead: '4 hrs', signals: 'Hydrologic Flood Routing Surge Wave' }
    ],
    centers: [
      { lat: 30.735, long: 79.067, r: 0.045, level: 'HIGH', hazard: 'Cloudburst' },
      { lat: 30.652, long: 79.043, r: 0.040, level: 'HIGH', hazard: 'Flash Flood' },
      { lat: 30.523, long: 79.077, r: 0.035, level: 'HIGH', hazard: 'Thunderstorm' },
      { lat: 30.285, long: 78.981, r: 0.030, level: 'HIGH', hazard: 'Flash Flood' }
    ],
    alerts: [
      { id: 1, severity: 'HIGH', event: 'Cloudburst', location: 'Kedarnath / Chorabari Sector', prob: 88, lead: '1 hr', trigger: 'Glaciated CTT -43°C + Peak Rain 45.7 mm/hr', status: 'ACTIVE', actionRecommended: 'IMMEDIATE EVACUATION: Move pilgrims above Mandakini flood plain to high ground behind shrine sanctuary' },
      { id: 2, severity: 'HIGH', event: 'Flash Flood', location: 'Rambara - Gaurikund Gorge', prob: 88, lead: '2 hrs', trigger: 'Peak Rain 67.2 mm/hr + Steep Slopes (38°)', status: 'ACTIVE', actionRecommended: 'HALT ALL TRANSIT: Close Gaurikund-Kedarnath trek corridor and clear Rambara bridge settlements' },
      { id: 3, severity: 'HIGH', event: 'Thunderstorm', location: 'Guptkashi - Phata Ridge', prob: 84, lead: '1 hr', trigger: 'CAPE 2480 J/kg + High Shear', status: 'ACTIVE', actionRecommended: 'GROUND HELICOPTER FLIGHTS: Ground shuttle operations and secure hilltop communication arrays' },
      { id: 4, severity: 'HIGH', event: 'Flash Flood', location: 'Rudraprayag Control Zone', prob: 82, lead: '4 hrs', trigger: 'Hydrologic Flood Routing Surge Wave', status: 'ACTIVE', actionRecommended: 'RIVERFRONT CLEARANCE: Clear Alaknanda-Mandakini confluence ghats and alert downstream barrages' }
    ],
    explainability: {
      summary: 'Deep convective cell approaching Rudraprayag district with severe moisture pooling and rapid cloud top glaciation.',
      xaiMethod: 'Gradient × Input (Integrated Saliency Attribution)',
      modelName: 'VajraNowcastNet (ConvLSTM + Dual-Head)',
      checkpointEpoch: 7,
      xaiAttributions: [
        { key: 'VWS', name: 'Vertical Wind Shear (0–6 km)', category: 'Kinematic Shear', value: '34.7 m/s', score: 38.4, mechanism: 'Strong vertical shear tilts convective updrafts, preventing premature collapse and organizing storm cells.', impact: 'CRITICAL DRIVER', impactColor: '#ef4444' },
        { key: 'DEM_ELEV', name: 'Orographic Elevation Barrier', category: 'Topography / DEM', value: '3096 m', score: 12.7, mechanism: 'Massive 3,900m Kedarnath massifs force mechanical uplift of incoming monsoon air.', impact: 'STRONG DRIVER', impactColor: '#f97316' },
        { key: 'WCONV', name: 'Low-Level Wind Convergence', category: 'Kinematic Forcing', value: '7.6 × 10⁻⁴ s⁻¹', score: 12.4, mechanism: 'Orographic wind convergence channelling air masses rapidly up the Mandakini gorge.', impact: 'STRONG DRIVER', impactColor: '#f97316' },
        { key: 'CAPE', name: 'Convective Instability (CAPE)', category: 'Thermodynamics', value: '1445 J/kg', score: 10.0, mechanism: 'Intense atmospheric convective potential energy fueling explosive cloud vertical growth.', impact: 'MODERATE CONTRIBUTOR', impactColor: '#0284c7' },
        { key: 'IWV', name: 'Integrated Water Vapour (IWV)', category: 'Moisture Pooling', value: '49.9 kg/m²', score: 9.7, mechanism: 'Precipitable moisture pool trapped between enclosing Himalayan ridges.', impact: 'MODERATE CONTRIBUTOR', impactColor: '#0284c7' },
        { key: 'CIN', name: 'Convective Inhibition (CIN)', category: 'Thermodynamics', value: '61 J/kg', score: 8.1, mechanism: 'Weakening inversion cap allows trapped moisture to erupt into convective cloudburst.', impact: 'MODERATE CONTRIBUTOR', impactColor: '#0284c7' },
        { key: 'CTT', name: 'Cloud Top Glaciation (TIR CTT)', category: 'Satellite Infrared', value: '-42.9 °C', score: 6.8, mechanism: 'Rapid cooling below -50°C indicates towering cumulonimbus clouds with intense glaciation.', impact: 'SECONDARY', impactColor: '#64748b' },
        { key: 'DEM_SLOPE', name: 'Terrain Slope Gradient', category: 'Topography / DEM', value: '6.8°', score: 1.9, mechanism: 'Steep 30m mountain flanks accelerate surface runoff directly toward the river bed.', impact: 'SECONDARY', impactColor: '#64748b' }
      ],
      rows: [
        ['Vertical Wind Shear (0–6 km)', 'Val: 34.7 m/s • Contrib: 38.4%', 'CRITICAL DRIVER'],
        ['Orographic Elevation Barrier', 'Val: 3096 m • Contrib: 12.7%', 'STRONG DRIVER'],
        ['Low-Level Wind Convergence', 'Val: 7.6 × 10⁻⁴ s⁻¹ • Contrib: 12.4%', 'STRONG DRIVER'],
        ['Convective Instability (CAPE)', 'Val: 1445 J/kg • Contrib: 10.0%', 'MODERATE CONTRIBUTOR'],
        ['Integrated Water Vapour (IWV)', 'Val: 49.9 kg/m² • Contrib: 9.7%', 'MODERATE CONTRIBUTOR']
      ],
      overallConfidence: 'HIGH',
      confidenceScore: 92,
      hazardSplit: {
        cloudburst: 'HIGH (82%)',
        flood: 'MODERATE-HIGH (67%)',
        storm: 'HIGH (91%)'
      }
    }
  },
  {
    id: 'stage-2-intensifying',
    name: 'Peak Orographic Burst & Severe Convection',
    simulatedTimestamp: '06 SEP 2026 • 19:15 IST',
    forecast: [
      { hour: 0, label: 'NOW', cloudburst: 76, flood: 58, storm: 88 },
      { hour: 1, label: '+1 HR', cloudburst: 89, flood: 74, storm: 95 },
      { hour: 2, label: '+2 HR', cloudburst: 93, flood: 85, storm: 92 },
      { hour: 3, label: '+3 HR', cloudburst: 86, flood: 89, storm: 79 },
      { hour: 4, label: '+4 HR', cloudburst: 71, flood: 82, storm: 66 },
      { hour: 5, label: '+5 HR', cloudburst: 55, flood: 70, storm: 51 },
      { hour: 6, label: '+6 HR', cloudburst: 39, flood: 56, storm: 40 }
    ],
    signals: [
      { key: 'IWV', name: 'Integrated Water Vapour', value: 47.4, unit: 'kg/m²', trend: '+45%', status: 'RISING', series: [36, 38, 40, 42, 44, 46, 47.4] },
      { key: 'CAPE', name: 'Convective Available Potential Energy', value: 2480, unit: 'J/kg', trend: '+32%', status: 'HIGH', series: [1800, 1920, 2050, 2180, 2300, 2410, 2480] },
      { key: 'CIN', name: 'Convective Inhibition', value: 18, unit: 'J/kg', trend: '-58%', status: 'DECREASING', series: [48, 42, 36, 30, 25, 21, 18] },
      { key: 'WCONV', name: 'Low-level Wind Convergence', value: 11.4, unit: '10⁻⁴ s⁻¹', trend: '+42%', status: 'HIGH', series: [6.8, 7.5, 8.4, 9.2, 10.1, 10.8, 11.4] },
      { key: 'VWS', name: 'Vertical Wind Shear', value: 22.8, unit: 'm/s', trend: '+24%', status: 'ELEVATED', series: [16.5, 17.4, 18.6, 19.8, 21.0, 21.9, 22.8] },
      { key: 'CTT', name: 'Cloud Top Temperature', value: -64, unit: '°C', trend: '-16°C', status: 'COOLING', series: [-42, -46, -50, -54, -58, -61, -64] }
    ],
    places: [
      { id: 'kedarnath', name: 'Kedarnath / Chorabari Sector', lat: 30.735, long: 79.067, hazard: 'Cloudburst', prob: 96, level: 'HIGH', lead: '30 mins', signals: 'Severe CTT cooling (-64°C) + IWV 47.4' },
      { id: 'gaurikund', name: 'Rambara - Gaurikund Gorge', lat: 30.652, long: 79.043, hazard: 'Flash Flood', prob: 92, level: 'HIGH', lead: '1 hr', signals: 'Steep slope convergence + extreme rainfall' },
      { id: 'guptkashi', name: 'Guptkashi - Phata Ridge', lat: 30.523, long: 79.077, hazard: 'Thunderstorm', prob: 88, level: 'HIGH', lead: '1 hr', signals: 'High CAPE + extreme lightning signature' },
      { id: 'rudraprayag', name: 'Rudraprayag Control Zone', lat: 30.285, long: 78.981, hazard: 'Flash Flood', prob: 84, level: 'HIGH', lead: '3 hrs', signals: 'Moisture pooling + downstream flood surge' }
    ],
    centers: [
      { lat: 30.735, long: 79.067, r: 0.058, level: 'HIGH', hazard: 'Cloudburst' },
      { lat: 30.652, long: 79.043, r: 0.048, level: 'HIGH', hazard: 'Flash Flood' },
      { lat: 30.523, long: 79.077, r: 0.042, level: 'HIGH', hazard: 'Thunderstorm' },
      { lat: 30.285, long: 78.981, r: 0.038, level: 'HIGH', hazard: 'Flash Flood' }
    ],
    alerts: [
      { id: 1, severity: 'HIGH', event: 'Cloudburst', location: 'Kedarnath / Chorabari Sector', prob: 96, lead: '30 mins', trigger: 'Extreme CTT + IWV Surge', status: 'ACTIVE', actionRecommended: 'Issue immediate red alert and trigger shrine evacuation protocol' },
      { id: 2, severity: 'HIGH', event: 'Flash Flood', location: 'Rambara - Gaurikund Gorge', prob: 92, lead: '1 hr', trigger: 'Saturated Soil + Torrential Runoff', status: 'ACTIVE', actionRecommended: 'Immediately close Mandakini riverside pilgrim camps' },
      { id: 3, severity: 'HIGH', event: 'Thunderstorm', location: 'Guptkashi - Phata Ridge', prob: 88, lead: '1 hr', trigger: 'CAPE 2480 J/kg + Strong Shear', status: 'ACTIVE', actionRecommended: 'Warn power transmission grids and high-altitude shelters' },
      { id: 4, severity: 'HIGH', event: 'Flash Flood', location: 'Rudraprayag Control Zone', prob: 84, lead: '3 hrs', trigger: 'Hydro-routed upstream surge', status: 'ACTIVE', actionRecommended: 'Clear riverside ghats and low-lying market stalls' }
    ],
    explainability: {
      summary: 'Atmospheric instability reached peak threshold. Severe convective cell locked into Mandakini valley orographic chimney.',
      xaiMethod: 'Gradient × Input (Integrated Saliency Attribution)',
      modelName: 'VajraNowcastNet (ConvLSTM + Dual-Head)',
      checkpointEpoch: 7,
      xaiAttributions: [
        { key: 'CTT', name: 'Cloud Top Glaciation (TIR CTT)', category: 'Satellite Infrared', value: '-64.0 °C', score: 32.5, mechanism: 'Extreme overshooting cloud tops colder than -60°C signal catastrophic convective updraft vigor.', impact: 'CRITICAL DRIVER', impactColor: '#ef4444' },
        { key: 'WCONV', name: 'Low-Level Wind Convergence', category: 'Kinematic Forcing', value: '11.4 × 10⁻⁴ s⁻¹', score: 24.8, mechanism: 'Extreme orographic wind funneling slamming saturated monsoon air into ridge faces.', impact: 'CRITICAL DRIVER', impactColor: '#ef4444' },
        { key: 'CAPE', name: 'Convective Instability (CAPE)', category: 'Thermodynamics', value: '2480 J/kg', score: 18.2, mechanism: 'Extreme thermodynamic buoyancy driving rapid vertical mass transport into freezing levels.', impact: 'CRITICAL DRIVER', impactColor: '#ef4444' },
        { key: 'IWV', name: 'Integrated Water Vapour (IWV)', category: 'Moisture Pooling', value: '47.4 kg/m²', score: 11.4, mechanism: 'Saturated atmospheric column delivering continuous high moisture feeding rates.', impact: 'STRONG DRIVER', impactColor: '#f97316' },
        { key: 'DEM_SLOPE', name: 'Terrain Slope Gradient', category: 'Topography / DEM', value: '38.5°', score: 8.5, mechanism: 'Precipitous mountain walls instantly transition aerial rainfall into devastating flash floods.', impact: 'MODERATE CONTRIBUTOR', impactColor: '#0284c7' },
        { key: 'VWS', name: 'Vertical Wind Shear (0–6 km)', category: 'Kinematic Shear', value: '22.8 m/s', score: 4.6, mechanism: 'Organizes storm multicellular supercell rotation without shearing cloud tops apart.', impact: 'SECONDARY', impactColor: '#64748b' }
      ],
      rows: [
        ['Extreme CTT glaciation', 'Overshooting tops detected at -64°C by INSAT TIR1', 'CRITICAL DRIVER'],
        ['Moisture convergence maximum', 'Low-level convergence spiked to 11.4 x 10⁻⁴ s⁻¹', 'CRITICAL DRIVER'],
        ['CAPE super-instability', 'CAPE exceeds 2,400 J/kg with complete CIN erosion', 'CRITICAL DRIVER'],
        ['Steep DEM runoff amplification', 'SRTM slope > 35° accelerates flash flood transition', 'STRONG DRIVER'],
        ['VWS maintenance', 'Shear maintains organized multicellular storm structure', 'MODERATE CONTRIBUTOR']
      ],
      overallConfidence: 'VERY HIGH',
      confidenceScore: 96,
      hazardSplit: {
        cloudburst: 'CRITICAL (93%)',
        flood: 'HIGH (85%)',
        storm: 'VERY HIGH (95%)'
      }
    }
  },
  {
    id: 'stage-3-drainage',
    name: 'Post-Burst Runoff & Hydrological Routing Phase',
    simulatedTimestamp: '06 SEP 2026 • 20:00 IST',
    forecast: [
      { hour: 0, label: 'NOW', cloudburst: 65, flood: 86, storm: 62 },
      { hour: 1, label: '+1 HR', cloudburst: 51, flood: 91, storm: 49 },
      { hour: 2, label: '+2 HR', cloudburst: 42, flood: 88, storm: 38 },
      { hour: 3, label: '+3 HR', cloudburst: 34, flood: 79, storm: 30 },
      { hour: 4, label: '+4 HR', cloudburst: 28, flood: 68, storm: 24 },
      { hour: 5, label: '+5 HR', cloudburst: 22, flood: 54, storm: 19 },
      { hour: 6, label: '+6 HR', cloudburst: 18, flood: 41, storm: 15 }
    ],
    signals: [
      { key: 'IWV', name: 'Integrated Water Vapour', value: 39.2, unit: 'kg/m²', trend: '-12%', status: 'DECREASING', series: [47, 46, 44, 43, 41, 40, 39.2] },
      { key: 'CAPE', name: 'Convective Available Potential Energy', value: 1620, unit: 'J/kg', trend: '-28%', status: 'DECREASING', series: [2400, 2250, 2100, 1950, 1800, 1710, 1620] },
      { key: 'CIN', name: 'Convective Inhibition', value: 62, unit: 'J/kg', trend: '+45%', status: 'RISING', series: [20, 26, 33, 41, 49, 56, 62] },
      { key: 'WCONV', name: 'Low-level Wind Convergence', value: 5.2, unit: '10⁻⁴ s⁻¹', trend: '-38%', status: 'DECREASING', series: [11.0, 9.8, 8.7, 7.6, 6.7, 5.9, 5.2] },
      { key: 'VWS', name: 'Vertical Wind Shear', value: 17.1, unit: 'm/s', trend: '-14%', status: 'ELEVATED', series: [22, 21.2, 20.3, 19.4, 18.5, 17.8, 17.1] },
      { key: 'CTT', name: 'Cloud Top Temperature', value: -41, unit: '°C', trend: '+14°C', status: 'WARMING', series: [-62, -58, -53, -49, -46, -43, -41] }
    ],
    places: [
      { id: 'kedarnath', name: 'Kedarnath / Chorabari Sector', lat: 30.735, long: 79.067, hazard: 'Flash Flood', prob: 78, level: 'MODERATE', lead: '1 hr', signals: 'Glacial runoff draining to gorge' },
      { id: 'gaurikund', name: 'Rambara - Gaurikund Gorge', lat: 30.652, long: 79.043, hazard: 'Flash Flood', prob: 94, level: 'HIGH', lead: '1 hr', signals: 'Peak river channel swelling + debris flow' },
      { id: 'guptkashi', name: 'Guptkashi - Phata Ridge', lat: 30.523, long: 79.077, hazard: 'Thunderstorm', prob: 46, level: 'WATCH', lead: '2 hrs', signals: 'Cell decaying, stratiform rain' },
      { id: 'rudraprayag', name: 'Rudraprayag Control Zone', lat: 30.285, long: 78.981, hazard: 'Flash Flood', prob: 90, level: 'HIGH', lead: '2 hrs', signals: 'Mandakini surge reaching confluence' }
    ],
    centers: [
      { lat: 30.652, long: 79.043, r: 0.060, level: 'HIGH', hazard: 'Flash Flood' },
      { lat: 30.285, long: 78.981, r: 0.052, level: 'HIGH', hazard: 'Flash Flood' },
      { lat: 30.735, long: 79.067, r: 0.038, level: 'MODERATE', hazard: 'Cloudburst' },
      { lat: 30.523, long: 79.077, r: 0.024, level: 'WATCH', hazard: 'Thunderstorm' }
    ],
    alerts: [
      { id: 2, severity: 'HIGH', event: 'Flash Flood', location: 'Rambara - Gaurikund Gorge', prob: 94, lead: '1 hr', trigger: 'Channel Swell + Debris Flow', status: 'ACTIVE', actionRecommended: 'Maintain total vehicular closure and initiate bank reinforcements' },
      { id: 4, severity: 'HIGH', event: 'Flash Flood', location: 'Rudraprayag Control Zone', prob: 90, lead: '2 hrs', trigger: 'Hydro-routed upstream surge', status: 'ACTIVE', actionRecommended: 'Sound siren at confluence ghats and enforce riverfront buffer zone' },
      { id: 1, severity: 'MODERATE', event: 'Cloudburst', location: 'Kedarnath / Chorabari Sector', prob: 51, lead: '2 hrs', trigger: 'Stratiform transition', status: 'MONITOR', actionRecommended: 'Assess ridge slope stabilization and cleared drainage paths' },
      { id: 3, severity: 'WATCH', event: 'Thunderstorm', location: 'Guptkashi - Phata Ridge', prob: 38, lead: '3 hrs', trigger: 'Dissipating storm cell', status: 'WATCH', actionRecommended: 'Resume normal vigilance standby' }
    ],
    explainability: {
      summary: 'Atmospheric convective engine is relaxing as instability is exhausted. Threat shifts heavily to DEM-directed hydrological flood routing.',
      xaiMethod: 'Gradient × Input (Integrated Saliency Attribution)',
      modelName: 'VajraNowcastNet (ConvLSTM + Dual-Head)',
      checkpointEpoch: 7,
      xaiAttributions: [
        { key: 'DEM_SLOPE', name: 'Terrain Slope Gradient', category: 'Topography / DEM', value: '42.1°', score: 36.8, mechanism: 'Steep 30m mountain flanks accelerate surface runoff directly toward the river bed.', impact: 'CRITICAL DRIVER', impactColor: '#ef4444' },
        { key: 'DEM_ELEV', name: 'Orographic Elevation Barrier', category: 'Topography / DEM', value: '2840 m', score: 26.2, mechanism: 'Valley depression funnels high altitude runoff into narrow gorges creating hydraulic surge head.', impact: 'CRITICAL DRIVER', impactColor: '#ef4444' },
        { key: 'IWV', name: 'Integrated Water Vapour (IWV)', category: 'Moisture Pooling', value: '39.2 kg/m²', score: 14.5, mechanism: 'Residual precipitable moisture continues delivering heavy stratiform rainfall.', impact: 'STRONG DRIVER', impactColor: '#f97316' },
        { key: 'CIN', name: 'Convective Inhibition (CIN)', category: 'Thermodynamics', value: '62 J/kg', score: 12.0, mechanism: 'Rebuilding convective cap stabilizes atmosphere against secondary cloudburst eruptions.', impact: 'STRONG DRIVER', impactColor: '#f97316' },
        { key: 'CTT', name: 'Cloud Top Glaciation (TIR CTT)', category: 'Satellite Infrared', value: '-41.0 °C', score: 6.5, mechanism: 'Warming cloud tops indicate dissipating convective anvil structure.', impact: 'SECONDARY', impactColor: '#64748b' },
        { key: 'WCONV', name: 'Low-Level Wind Convergence', category: 'Kinematic Forcing', value: '5.2 × 10⁻⁴ s⁻¹', score: 4.0, mechanism: 'Decaying valley convergence wind field.', impact: 'SECONDARY', impactColor: '#64748b' }
      ],
      rows: [
        ['Hydrological lag in effect', 'Precipitation volume routing through Mandakini riverbed', 'CRITICAL DRIVER'],
        ['DEM slope flow accumulation', 'Steep topography (SRTM 30m) channels mountain runoff downstream', 'CRITICAL DRIVER'],
        ['Atmospheric CIN rebuilding', 'Convective inhibition rose to 62 J/kg, suppressing new cells', 'STRONG DRIVER'],
        ['Cloud Top Warming', 'CTT warmed to -41°C, indicating anvil dissipation', 'MODERATE CONTRIBUTOR'],
        ['Soil moisture saturation', 'Antecedent moisture index remains at 94%, preventing absorption', 'STRONG DRIVER']
      ],
      overallConfidence: 'HIGH',
      confidenceScore: 91,
      hazardSplit: {
        cloudburst: 'DECREASING (51%)',
        flood: 'CRITICAL (91%)',
        storm: 'LOW-MODERATE (38%)'
      }
    }
  }
];

export const DISTRICT_LOCATIONS = [
  // --- RUDRAPRAYAG DISTRICT ---
  {
    id: 'kedarnath',
    name: 'Kedarnath / Chorabari Sector',
    district: 'Rudraprayag',
    lat: 30.735,
    long: 79.067,
    elevation: '3,584 m',
    type: 'Glacial Catchment & Shrine Sanctuary',
    description: 'Upper Mandakini headwaters & Chorabari moraine lake; primary ground-zero cloudburst trigger zone.',
    hazard: 'Cloudburst',
    leadHours: 1,
    isMajor: true
  },
  {
    id: 'gaurikund',
    name: 'Rambara - Gaurikund Gorge',
    district: 'Rudraprayag',
    lat: 30.652,
    long: 79.043,
    elevation: '1,980 m',
    type: 'Steep Gorge Transit Corridor',
    description: 'Narrow mountain gorge with severe hydraulic channelling, tributary confluence & debris torrent vulnerability.',
    hazard: 'Flash Flood',
    leadHours: 2,
    isMajor: true
  },
  {
    id: 'sonprayag',
    name: 'Sonprayag - Triyuginarayan',
    district: 'Rudraprayag',
    lat: 30.630,
    long: 79.028,
    elevation: '1,820 m',
    type: 'River Confluence & Pilgrim Checkpoint',
    description: 'Confluence of Mandakini & Songanga rivers; vital transit neck subject to tributary surges.',
    hazard: 'Flash Flood',
    leadHours: 2,
    isMajor: false
  },
  {
    id: 'guptkashi',
    name: 'Guptkashi - Phata Ridge',
    district: 'Rudraprayag',
    lat: 30.523,
    long: 79.077,
    elevation: '1,319 m',
    type: 'Orographic Crest & Helipad Outpost',
    description: 'Mid-valley ridge sector subjected to intense thermodynamic CAPE buoyancy, lightning & cross-valley wind shear.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: true
  },
  {
    id: 'ukhimath',
    name: 'Ukhimath - Chopta Sub-sector',
    district: 'Rudraprayag',
    lat: 30.516,
    long: 79.096,
    elevation: '1,311 m',
    type: 'Alpine Foothill & Winter Seat',
    description: 'Opposite valley flank with heavy slope runoff feeding Madhyamaheshwar Ganga.',
    hazard: 'Flash Flood',
    leadHours: 2,
    isMajor: false
  },
  {
    id: 'agastyamuni',
    name: 'Agastyamuni Floodplain',
    district: 'Rudraprayag',
    lat: 30.392,
    long: 79.030,
    elevation: '1,000 m',
    type: 'Broad Valley Floodplain & Emergency Strip',
    description: 'Wide fluvial plain prone to lateral erosion, silt accumulation, and inundation during high discharge.',
    hazard: 'Flash Flood',
    leadHours: 3,
    isMajor: false
  },
  {
    id: 'rudraprayag',
    name: 'Rudraprayag Control Zone',
    district: 'Rudraprayag',
    lat: 30.285,
    long: 78.981,
    elevation: '890 m',
    type: 'District EOC & River Confluence',
    description: 'Confluence of Alaknanda & Mandakini rivers; critical downstream evacuation node and hydro-surge terminus.',
    hazard: 'Flash Flood',
    leadHours: 4,
    isMajor: true
  },

  // --- CHAMOLI DISTRICT ---
  {
    id: 'badrinath',
    name: 'Badrinath - Mana Valley',
    district: 'Chamoli',
    lat: 30.743,
    long: 79.493,
    elevation: '3,300 m',
    type: 'High Alpine Alaknanda Catchment',
    description: 'Upper Alaknanda headwaters near Saraswati confluence, prone to glacial lake overflows and rock avalanches.',
    hazard: 'Cloudburst',
    leadHours: 1,
    isMajor: false
  },
  {
    id: 'joshimath',
    name: 'Joshimath - Badrinath Corridor',
    district: 'Chamoli',
    lat: 30.556,
    long: 79.567,
    elevation: '1,890 m',
    type: 'Alaknanda - Dhauliganga Gorge & Pilgrim Axis',
    description: 'Steep upper Alaknanda valley subjected to moraine instability, slope creep, and tributary flash flood surges.',
    hazard: 'Flash Flood',
    leadHours: 2,
    isMajor: true
  },
  {
    id: 'hemkund',
    name: 'Hemkund Sahib / Valley of Flowers',
    district: 'Chamoli',
    lat: 30.698,
    long: 79.605,
    elevation: '4,329 m',
    type: 'Glacial Cirque & High-Altitude Trek',
    description: 'Alpine lake basin enclosed by steep peaks; vulnerable to cloud bursts and extreme rapid runoff.',
    hazard: 'Cloudburst',
    leadHours: 1,
    isMajor: false
  },
  {
    id: 'chamoli',
    name: 'Chamoli - Gopeshwar Headquarters',
    district: 'Chamoli',
    lat: 30.413,
    long: 79.324,
    elevation: '1,300 m',
    type: 'District HQ & Alaknanda Valley Basin',
    description: 'Administrative hub monitoring middle Alaknanda basin and mountain highway passes.',
    hazard: 'Flash Flood',
    leadHours: 3,
    isMajor: true
  },
  {
    id: 'karnaprayag',
    name: 'Karnaprayag Confluence Basin',
    district: 'Chamoli',
    lat: 30.260,
    long: 79.217,
    elevation: '860 m',
    type: 'Pindar - Alaknanda Confluence',
    description: 'Strategic junction of Pindar glacier runoff and Alaknanda mainstem, prone to severe seasonal flooding.',
    hazard: 'Flash Flood',
    leadHours: 3,
    isMajor: false
  },
  {
    id: 'gwaldam',
    name: 'Gwaldam - Tharali Ridge',
    district: 'Chamoli',
    lat: 30.015,
    long: 79.565,
    elevation: '1,940 m',
    type: 'Pindar Catchment Divide',
    description: 'High forested ridge bordering Bageshwar, subject to convective storms and squalls.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: false
  },
  {
    id: 'pipalkoti',
    name: 'Pipalkoti - Alaknanda Valley',
    district: 'Chamoli',
    lat: 30.430,
    long: 79.430,
    elevation: '1,260 m',
    type: 'Steep River Corridor & NH-58 Transit',
    description: 'Constricted valley segment between Joshimath and Chamoli, highly vulnerable to landslides and roadblock surges.',
    hazard: 'Flash Flood',
    leadHours: 2,
    isMajor: false
  },

  // --- UTTARKASHI DISTRICT ---
  {
    id: 'gangotri',
    name: 'Gangotri - Gaumukh Glacier',
    district: 'Uttarkashi',
    lat: 30.994,
    long: 78.939,
    elevation: '3,415 m',
    type: 'Glacial Source & Bhagirathi Canyon',
    description: 'Periglacial catchment of Bhagirathi river subject to rapid snowmelt, glacial lake surges, and cloudburst events.',
    hazard: 'Cloudburst',
    leadHours: 1,
    isMajor: true
  },
  {
    id: 'yamunotri',
    name: 'Yamunotri - Jankichatti Gorge',
    district: 'Uttarkashi',
    lat: 31.014,
    long: 78.460,
    elevation: '3,291 m',
    type: 'Upper Yamuna Canyon & Pilgrim Trail',
    description: 'Precipitous gorge enclosing Yamuna origin, vulnerable to high-intensity cloudbursts and rockfall.',
    hazard: 'Cloudburst',
    leadHours: 1,
    isMajor: false
  },
  {
    id: 'harsil',
    name: 'Harsil - Bhagirathi Valley',
    district: 'Uttarkashi',
    lat: 31.037,
    long: 78.737,
    elevation: '2,620 m',
    type: 'Valley Basin & Military Garrison',
    description: 'Glaciated river terrace with tributary streams prone to debris deposition during extreme convective rain.',
    hazard: 'Flash Flood',
    leadHours: 2,
    isMajor: false
  },
  {
    id: 'uttarkashi',
    name: 'Uttarkashi - Bhagirathi Basin',
    district: 'Uttarkashi',
    lat: 30.726,
    long: 78.435,
    elevation: '1,158 m',
    type: 'Upper Ganga Gorge & Tectonic Valley',
    description: 'Steep catchment of Bhagirathi River vulnerable to cloudburst deluge, landslide dams, and flash floods.',
    hazard: 'Cloudburst',
    leadHours: 1,
    isMajor: true
  },
  {
    id: 'barkot',
    name: 'Barkot - Yamuna Valley',
    district: 'Uttarkashi',
    lat: 30.812,
    long: 78.208,
    elevation: '1,220 m',
    type: 'Yamuna River Foothill Basin',
    description: 'Central junction in lower Yamuna valley, exposed to convective squalls and flood surges.',
    hazard: 'Flash Flood',
    leadHours: 2,
    isMajor: false
  },
  {
    id: 'mori',
    name: 'Mori - Tons Valley',
    district: 'Uttarkashi',
    lat: 31.018,
    long: 78.042,
    elevation: '1,150 m',
    type: 'Tons River Gorge & Forested Catchment',
    description: 'Deep isolated canyon system prone to flash floods from upstream Himachal border tributaries.',
    hazard: 'Flash Flood',
    leadHours: 2,
    isMajor: false
  },

  // --- TEHRI GARHWAL DISTRICT ---
  {
    id: 'newtehri',
    name: 'New Tehri - Bhagirathi Reservoir',
    district: 'Tehri Garhwal',
    lat: 30.392,
    long: 78.480,
    elevation: '1,750 m',
    type: 'Reservoir Rim & District HQ',
    description: 'High ridge overlooking Tehri Dam mega-reservoir, monitoring slope stability and squall line propagation.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: false
  },
  {
    id: 'chamba',
    name: 'Chamba - Mussoorie Ridge',
    district: 'Tehri Garhwal',
    lat: 30.347,
    long: 78.397,
    elevation: '1,600 m',
    type: 'Trans-Garhwal Mountain Saddle',
    description: 'Strategic crossroad linking Bhagirathi and Yamuna basins, vulnerable to lightning and high winds.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: false
  },
  {
    id: 'devprayag',
    name: 'Devprayag Ganga Confluence',
    district: 'Tehri Garhwal',
    lat: 30.146,
    long: 78.599,
    elevation: '830 m',
    type: 'Alaknanda - Bhagirathi Sacred Confluence',
    description: 'Origin of River Ganga; critical hydrological metering point integrating discharges of entire Garhwal Himalaya.',
    hazard: 'Flash Flood',
    leadHours: 4,
    isMajor: false
  },
  {
    id: 'ghuttu',
    name: 'Ghuttu - Bhilangna Valley',
    district: 'Tehri Garhwal',
    lat: 30.589,
    long: 78.761,
    elevation: '1,524 m',
    type: 'Bhilangna Catchment Gateway',
    description: 'Gateway to Khatling glacier valley prone to rapid cloudburst torrents and channel scouring.',
    hazard: 'Cloudburst',
    leadHours: 1,
    isMajor: false
  },

  // --- PAURI GARHWAL DISTRICT ---
  {
    id: 'srinagar',
    name: 'Srinagar Garhwal - Alaknanda Basin',
    district: 'Pauri Garhwal',
    lat: 30.222,
    long: 78.784,
    elevation: '560 m',
    type: 'Broad River Terrace & Academic Hub',
    description: 'Major urban center situated on the wide floodplain of Alaknanda; primary flood receptor downriver from Rudraprayag.',
    hazard: 'Flash Flood',
    leadHours: 4,
    isMajor: false
  },
  {
    id: 'pauri',
    name: 'Pauri Headquarters Ridge',
    district: 'Pauri Garhwal',
    lat: 30.150,
    long: 78.780,
    elevation: '1,814 m',
    type: 'District Headquarters Hill Crest',
    description: 'High ridge overlooking the Alaknanda canyon; exposed to severe lightning strikes and squalls.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: false
  },
  {
    id: 'kotdwar',
    name: 'Kotdwar - Khoh River Gateway',
    district: 'Pauri Garhwal',
    lat: 29.746,
    long: 78.528,
    elevation: '454 m',
    type: 'Sub-Himalayan Bhabar Gateway',
    description: 'Drainage outlet for the southern Pauri hills where Khoh river exits into plains with extreme flood velocities.',
    hazard: 'Flash Flood',
    leadHours: 2,
    isMajor: false
  },
  {
    id: 'lansdowne',
    name: 'Lansdowne Hill Outpost',
    district: 'Pauri Garhwal',
    lat: 29.838,
    long: 78.685,
    elevation: '1,706 m',
    type: 'Cantonment Ridge & Pine Crest',
    description: 'Pine-forested crest exposed to high orographic rain, lightning, and slope runoff.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: false
  },

  // --- PITHORAGARH DISTRICT ---
  {
    id: 'dharchula',
    name: 'Dharchula - Kali River Border',
    district: 'Pithoragarh',
    lat: 29.845,
    long: 80.535,
    elevation: '915 m',
    type: 'Trans-Himalayan Border Gorge',
    description: 'Precipitous international border gorge of Kali River vulnerable to trans-boundary flash floods and cloudburst debris flows.',
    hazard: 'Flash Flood',
    leadHours: 2,
    isMajor: true
  },
  {
    id: 'munsyari',
    name: 'Munsyari - Panchachuli Basin',
    district: 'Pithoragarh',
    lat: 30.067,
    long: 80.237,
    elevation: '2,200 m',
    type: 'Gori Ganga Glacial Valley',
    description: 'Dramatic amphitheatre facing Panchachuli peaks, prone to intense cloudburst cells and moraine erosion.',
    hazard: 'Cloudburst',
    leadHours: 1,
    isMajor: true
  },
  {
    id: 'pithoragarh_town',
    name: 'Pithoragarh Headquarters Basin',
    district: 'Pithoragarh',
    lat: 29.583,
    long: 80.217,
    elevation: '1,627 m',
    type: 'Shor Valley & Central EOC',
    description: 'District command center located in Shor valley, coordinating eastern Kumaon emergency response.',
    hazard: 'Flash Flood',
    leadHours: 3,
    isMajor: false
  },
  {
    id: 'didihat',
    name: 'Didihat - Askot Ridge',
    district: 'Pithoragarh',
    lat: 29.798,
    long: 80.258,
    elevation: '1,725 m',
    type: 'Goriganga - Kali Ridge Divide',
    description: 'High ridge experiencing severe thunderstorm activity, high-altitude wind shear and slope failures.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: false
  },
  {
    id: 'berinag',
    name: 'Berinag - Chaukori Valley',
    district: 'Pithoragarh',
    lat: 29.774,
    long: 80.053,
    elevation: '1,860 m',
    type: 'Mid-Himalayan Tea Terrace Ridge',
    description: 'Scenic agricultural ridge prone to squall lines and heavy orographic downpours.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: false
  },

  // --- BAGESHWAR DISTRICT ---
  {
    id: 'bageshwar_town',
    name: 'Bageshwar Confluence Basin',
    district: 'Bageshwar',
    lat: 29.839,
    long: 79.771,
    elevation: '1,004 m',
    type: 'Saryu - Gomti Sacred Confluence',
    description: 'Confluence basin of Saryu and Gomti rivers, subject to rapid hydro-surge and market inundation.',
    hazard: 'Flash Flood',
    leadHours: 3,
    isMajor: false
  },
  {
    id: 'kapkot',
    name: 'Kapkot - Saryu Headwaters',
    district: 'Bageshwar',
    lat: 29.938,
    long: 79.904,
    elevation: '1,120 m',
    type: 'Upper Saryu Mountain Valley',
    description: 'Steep valley gateway to Pindari glacier; vulnerable to cloudburst deluges and flash torrents.',
    hazard: 'Cloudburst',
    leadHours: 1,
    isMajor: false
  },
  {
    id: 'kausani',
    name: 'Kausani - Baijnath Ridge',
    district: 'Bageshwar',
    lat: 29.854,
    long: 79.601,
    elevation: '1,890 m',
    type: 'Panoramic Himalayan Crest',
    description: 'Exposed ridge with extensive vistas; frequently strikes by convective squalls and high winds.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: false
  },

  // --- ALMORA DISTRICT ---
  {
    id: 'almora_town',
    name: 'Almora - Kosi Valley',
    district: 'Almora',
    lat: 29.597,
    long: 79.659,
    elevation: '1,638 m',
    type: 'Ridge-Top Town & Kosi Catchment',
    description: 'Horse-saddle shaped ridge overlooking Kosi river basin; vulnerable to intense urban runoff and lightning.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: false
  },
  {
    id: 'ranikhet',
    name: 'Ranikhet - Chaubatia Ridge',
    district: 'Almora',
    lat: 29.643,
    long: 79.432,
    elevation: '1,869 m',
    type: 'Cantonment Crest & Forest Belt',
    description: 'High ridge subjected to strong thunderstorm wind gusts and convective precipitation.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: false
  },
  {
    id: 'dwarahat',
    name: 'Dwarahat Valley',
    district: 'Almora',
    lat: 29.778,
    long: 79.427,
    elevation: '1,510 m',
    type: 'Ramganga West Tributary Basin',
    description: 'Agricultural valley prone to stream flash surges during heavy monsoon downpours.',
    hazard: 'Flash Flood',
    leadHours: 2,
    isMajor: false
  },

  // --- NAINITAL DISTRICT ---
  {
    id: 'nainital_town',
    name: 'Nainital Lake Basin',
    district: 'Nainital',
    lat: 29.392,
    long: 79.454,
    elevation: '2,084 m',
    type: 'Endorheic Lake Basin & Steep Slopes',
    description: 'Steep slopes enclosing Naini Lake; vulnerable to slope saturation, debris slips and lake surge overflow.',
    hazard: 'Flash Flood',
    leadHours: 2,
    isMajor: false
  },
  {
    id: 'haldwani',
    name: 'Haldwani - Gaula River Bhabar',
    district: 'Nainital',
    lat: 29.218,
    long: 79.513,
    elevation: '424 m',
    type: 'Foothill Gateway & Bhabar Floodplain',
    description: 'Critical economic gateway where high-velocity Gaula torrents emerge from hills onto the plains.',
    hazard: 'Flash Flood',
    leadHours: 3,
    isMajor: false
  },
  {
    id: 'mukteshwar',
    name: 'Mukteshwar High Ridge',
    district: 'Nainital',
    lat: 29.472,
    long: 79.654,
    elevation: '2,171 m',
    type: 'Isolated High Ridge Observatory',
    description: 'High ridge with extreme exposure to lightning, convective clouds, and hail storms.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: false
  },
  {
    id: 'ramnagar',
    name: 'Ramnagar - Kosi Outflow',
    district: 'Nainital',
    lat: 29.395,
    long: 79.126,
    elevation: '345 m',
    type: 'Corbett Foothill Drainage Basin',
    description: 'Kosi river outflow into plain forests; prone to rapid midnight river surges from upstream cloudbursts.',
    hazard: 'Flash Flood',
    leadHours: 3,
    isMajor: false
  },

  // --- DEHRADUN DISTRICT ---
  {
    id: 'dehradun_city',
    name: 'Dehradun Capital Basin',
    district: 'Dehradun',
    lat: 30.316,
    long: 78.032,
    elevation: '640 m',
    type: 'Sub-Himalayan Drainage & Urban Basin',
    description: 'Inter-montane Dun valley catchment with high-velocity urban runoff, seasonal torrential choes, and thunderstorm fronts.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: true
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh - Ganga Gorge Outflow',
    district: 'Dehradun',
    lat: 30.087,
    long: 78.268,
    elevation: '372 m',
    type: 'Foothill Gorge & Holy Confluence Gate',
    description: 'Points where River Ganga exits the Outer Himalayan ranges into the Indo-Gangetic plains; downstream flood threshold.',
    hazard: 'Flash Flood',
    leadHours: 4,
    isMajor: false
  },
  {
    id: 'mussoorie',
    name: 'Mussoorie - Queen of Hills Ridge',
    district: 'Dehradun',
    lat: 30.459,
    long: 78.066,
    elevation: '2,005 m',
    type: 'Frontal Himalayan Ridge',
    description: 'Frontal mountain barrier causing sharp orographic uplift of moist southerly monsoon currents.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: false
  },
  {
    id: 'chakrata',
    name: 'Chakrata - Jaunsar High Pass',
    district: 'Dehradun',
    lat: 30.702,
    long: 77.869,
    elevation: '2,118 m',
    type: 'Northwestern Border Ridge',
    description: 'High ridge overlooking Yamuna and Tons watersheds, exposed to severe lightning and cloudburst systems.',
    hazard: 'Thunderstorm',
    leadHours: 1,
    isMajor: false
  },

  // --- CHAMPAWAT DISTRICT ---
  {
    id: 'champawat_town',
    name: 'Champawat - Lohaghat Ridge',
    district: 'Champawat',
    lat: 29.334,
    long: 80.091,
    elevation: '1,610 m',
    type: 'Eastern Kumaon Hill Saddle',
    description: 'District headquarters ridge prone to heavy convective spells and tributary flash torrents.',
    hazard: 'Flash Flood',
    leadHours: 2,
    isMajor: false
  },
  {
    id: 'tanakpur',
    name: 'Tanakpur - Sharda River Gateway',
    district: 'Champawat',
    lat: 29.072,
    long: 80.111,
    elevation: '255 m',
    type: 'Sharda River Barrage Basin',
    description: 'Barrage terminus of trans-boundary Kali/Sharda river; primary plains flood monitoring post.',
    hazard: 'Flash Flood',
    leadHours: 4,
    isMajor: false
  },

  // --- HARIDWAR DISTRICT ---
  {
    id: 'haridwar_city',
    name: 'Haridwar - Upper Ganga Plains',
    district: 'Haridwar',
    lat: 29.945,
    long: 78.164,
    elevation: '314 m',
    type: 'Ganga Canal Barrage & Pilgrimage Plain',
    description: 'Critical hydraulic regulator node controlling Ganga canal diversion and major pilgrimage ghats.',
    hazard: 'Flash Flood',
    leadHours: 5,
    isMajor: false
  },
  {
    id: 'roorkee',
    name: 'Roorkee - Solani River Basin',
    district: 'Haridwar',
    lat: 29.854,
    long: 77.888,
    elevation: '268 m',
    type: 'Alluvial Plains & Solani Aqueduct',
    description: 'Plains urban zone susceptible to seasonal river flooding and urban waterlogging.',
    hazard: 'Thunderstorm',
    leadHours: 2,
    isMajor: false
  },

  // --- UDHAM SINGH NAGAR DISTRICT ---
  {
    id: 'rudrapur',
    name: 'Rudrapur - Terai Basin',
    district: 'Udham Singh Nagar',
    lat: 28.980,
    long: 79.400,
    elevation: '205 m',
    type: 'Terai Industrial Center & Plain',
    description: 'Southernmost district headquarters; low-lying drainage plain susceptible to river backflow and flooding.',
    hazard: 'Flash Flood',
    leadHours: 4,
    isMajor: false
  },
  {
    id: 'kashipur',
    name: 'Kashipur - Dhela River Catchment',
    district: 'Udham Singh Nagar',
    lat: 29.210,
    long: 78.950,
    elevation: '218 m',
    type: 'Agricultural Terai Floodplain',
    description: 'Flat river basin prone to agricultural waterlogging and thunderstorm squalls.',
    hazard: 'Thunderstorm',
    leadHours: 2,
    isMajor: false
  }
];

export class SimulationEngine {
  constructor() {
    this.scenarioIndex = 0;
    this.totalSimulationsRun = 0;
  }

  getCurrentScenario() {
    const raw = SCENARIOS[this.scenarioIndex];
    return {
      scenarioId: raw.id,
      scenarioName: raw.name,
      simulatedTimestamp: raw.simulatedTimestamp,
      pipelineStages: this.generatePipelineSteps(),
      forecast: JSON.parse(JSON.stringify(raw.forecast)),
      signals: JSON.parse(JSON.stringify(raw.signals)),
      alerts: JSON.parse(JSON.stringify(raw.alerts)),
      places: JSON.parse(JSON.stringify(raw.places)),
      centers: JSON.parse(JSON.stringify(raw.centers)),
      explainability: JSON.parse(JSON.stringify(raw.explainability))
    };
  }

  advanceSimulation() {
    this.scenarioIndex = (this.scenarioIndex + 1) % SCENARIOS.length;
    this.totalSimulationsRun += 1;
    return this.getCurrentScenario();
  }

  resetSimulation() {
    this.scenarioIndex = 0;
    return this.getCurrentScenario();
  }

  getStats() {
    return {
      status: 'ONLINE',
      engine: 'VAJRA Deterministic Spatiotemporal Simulator v2.4',
      scenarioIndex: this.scenarioIndex,
      scenarioName: SCENARIOS[this.scenarioIndex].name,
      totalSimulationsRun: this.totalSimulationsRun,
      activeTimestamp: SCENARIOS[this.scenarioIndex].simulatedTimestamp,
      supportedHazards: ['Cloudburst', 'Flash Flood', 'Thunderstorm']
    };
  }

  generatePipelineSteps() {
    return [
      {
        step: 1,
        name: 'Processing satellite frames',
        source: 'INSAT-3D/3DR TIR1 & WV Bands',
        status: 'completed',
        executionTimeMs: 142,
        details: 'Extracted Integrated Water Vapour (IWV) & Cloud Top Temperature (-52°C to -64°C)'
      },
      {
        step: 2,
        name: 'Fusing atmospheric signals',
        source: 'NCMRWF IMDAA Regional Reanalysis (12km)',
        status: 'completed',
        executionTimeMs: 185,
        details: 'Computed CAPE (2,140–2,480 J/kg), CIN erosion, low-level wind convergence & shear'
      },
      {
        step: 3,
        name: 'Running spatiotemporal AI model',
        source: 'ConvLSTM + Spatial Transformer Multi-Task Net',
        status: 'completed',
        executionTimeMs: 230,
        details: 'Inferred multi-hazard probability tensor across 0–6 hour lead time window'
      },
      {
        step: 4,
        name: 'Generating probability maps',
        source: 'Probabilistic Spatial Grid Aggregator',
        status: 'completed',
        executionTimeMs: 110,
        details: 'Calibrated raster risk field for Cloudburst, Thunderstorm and Runoff zones'
      },
      {
        step: 5,
        name: 'Applying DEM terrain logic',
        source: 'SRTM 30m Digital Elevation Model + Flow Routing',
        status: 'completed',
        executionTimeMs: 165,
        details: 'Incorporated slope steepness, valley channeling and Mandakini flow accumulation'
      },
      {
        step: 6,
        name: 'Generating explainable alert',
        source: 'VAJRA Attribution & Decision Advisory Engine',
        status: 'completed',
        executionTimeMs: 95,
        details: 'Synthesized signal attribution, lead time confidence, and civil protection advisories'
      }
    ];
  }
}
