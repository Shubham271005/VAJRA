export interface HistoricalTimelineStep {
  step: string;
  time: string;
  title: string;
  desc: string;
  severity: 'WARNING' | 'CRITICAL' | 'CATASTROPHIC' | 'INFO';
}

export interface AtmosphericMetrics {
  ctt: string;           // Cloud Top Temperature
  cape: string;          // Convective Available Potential Energy
  iwv: string;           // Integrated Water Vapour
  cin: string;           // Convective Inhibition
  wconv: string;         // Low-level Wind Convergence
  shear: string;         // Vertical Wind Shear
  peakRain: string;      // Peak Burst Intensity (mm/hr)
  totalRain24h: string;  // 24h Accumulation
}

export interface AffectedSector {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  elevation: string;
  impactLevel: 'EXTREME' | 'SEVERE' | 'MODERATE';
  casualtiesReported: string;
  aiLeadTime: string;
  traditionalLeadTime: string;
}

export interface HistoricalEvent {
  id: string;
  title: string;
  subtitle: string;
  year: number;
  dateRange: string;
  district: string;
  basin: string;
  elevationSpan: string;
  scenarioId: string;
  locationId: string;
  epicenter: {
    name: string;
    lat: number;
    lon: number;
  };
  fatalities: string;
  infrastructureLoss: string;
  synopticTrigger: string;
  synopticMechanism: string;
  riverCoords: [number, number][];
  timeline: HistoricalTimelineStep[];
  atmospheric: AtmosphericMetrics;
  sectors: AffectedSector[];
  verification: {
    traditionalLeadMinutes: number;
    traditionalLeadStr: string;
    vajraAiLeadHours: number;
    vajraAiLeadStr: string;
    leadGainHours: string;
    evacuationSuccessPotential: string;
    csiThreatScore: number;
    podDetectionRate: number;
    falseAlarmRatio: number;
  };
}

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: 'kedarnath-2013',
    title: 'Kedarnath Glacial Breach & Mandakini Valley Deluge',
    subtitle: 'The Great Himalayan Tsunami • Chorabari Lake Outburst Flood (GLOF) & Cloudburst',
    year: 2013,
    dateRange: '16–17 June 2013',
    district: 'Rudraprayag',
    basin: 'Mandakini River Catchment (Upper Ganga)',
    elevationSpan: '890 m (Rudraprayag) – 3,960 m (Chorabari)',
    scenarioId: 'kedarnath_2013_peak',
    locationId: 'kedarnath',
    epicenter: {
      name: 'Kedarnath Shrine Sanctuary & Chorabari Moraine',
      lat: 30.735,
      lon: 79.067
    },
    fatalities: '5,700+ casualties & missing',
    infrastructureLoss: 'Rambara township 100% annihilated, 9 major highway bridges destroyed, NH-107 washed out for 45 km',
    synopticTrigger: 'Premature Arabian Sea monsoon surge collided with an active mid-latitude Western Disturbance trough over the Garhwal crest.',
    synopticMechanism: 'Deep orographic locking within the V-shaped Mandakini gorge chimney caused convective clouds to freeze/glaciate at -71°C. Rain rates surpassed 72 mm/hr for 8 consecutive hours, overflowing Chorabari moraine lake until lateral moraine failed at 07:10 AM.',
    riverCoords: [
      [30.752, 79.052], // Chorabari Glacier
      [30.748, 79.055], // Moraine Lake
      [30.735, 79.067], // Kedarnath
      [30.710, 79.062], // Lincholi
      [30.686, 79.056], // Rambara Gorge
      [30.652, 79.043], // Gaurikund
      [30.630, 79.028], // Sonprayag
      [30.575, 79.045], // Phata
      [30.523, 79.077], // Guptkashi
      [30.490, 79.085], // Kund
      [30.395, 79.025], // Agustmuni
      [30.340, 78.995], // Tilwara
      [30.285, 78.981], // Rudraprayag Confluence
    ],
    atmospheric: {
      ctt: '-71.4°C (Glaciated Anvil)',
      cape: '2,420 J/kg',
      iwv: '48.5 kg/m²',
      cin: '18 J/kg',
      wconv: '18.4 × 10⁻⁴ s⁻¹',
      shear: '32.6 m/s',
      peakRain: '72.4 mm/hr',
      totalRain24h: '325 mm / 24h'
    },
    timeline: [
      {
        step: '01',
        time: '15 June • 14:00 IST',
        title: 'Synoptic Collision & Pre-Monsoon Convergence',
        desc: 'Bay of Bengal monsoon trough meets deep mid-tropospheric Western Disturbance. Low-level wind convergence reaches 14.2 × 10⁻⁴ s⁻¹ over Rudraprayag.',
        severity: 'WARNING'
      },
      {
        step: '02',
        time: '16 June • 17:30 IST',
        title: 'Orographic Trap & Extreme Cloudburst Initiation',
        desc: 'Convective cell trapped against 4,000m Kedarnath wall. Cloud top temperature drops to -71°C. Rainfall rate exceeds 65 mm/hr continuously.',
        severity: 'CRITICAL'
      },
      {
        step: '03',
        time: '16 June • 20:30 IST',
        title: 'Rambara Gorge Bottleneck Inundation',
        desc: 'Mandakini discharge surges 600%. Debris torrent sweeps through Rambara market; footbridges and pilgrim shelters are washed out.',
        severity: 'CATASTROPHIC'
      },
      {
        step: '04',
        time: '17 June • 07:10 IST',
        title: 'Chorabari Lake Outburst Breach (GLOF)',
        desc: 'Moraine dam fails, releasing 260,000 m³ of water laden with boulders. Multi-ton debris wave engulfs Kedarnath shrine town in 12 minutes.',
        severity: 'CATASTROPHIC'
      }
    ],
    sectors: [
      {
        id: 'kedarnath',
        name: 'Kedarnath Temple Sanctuary',
        district: 'Rudraprayag',
        lat: 30.735,
        lon: 79.067,
        elevation: '3,584 m',
        impactLevel: 'EXTREME',
        casualtiesReported: '2,200+ at shrine complex',
        aiLeadTime: '4.5 Hours Advance Warning',
        traditionalLeadTime: '< 20 mins'
      },
      {
        id: 'rambara',
        name: 'Rambara Gorge Bottleneck',
        district: 'Rudraprayag',
        lat: 30.686,
        lon: 79.056,
        elevation: '2,740 m',
        impactLevel: 'EXTREME',
        casualtiesReported: 'Entire transit camp swept away (~1,800)',
        aiLeadTime: '4.2 Hours Advance Warning',
        traditionalLeadTime: '0 mins (No radar coverage)'
      },
      {
        id: 'gaurikund',
        name: 'Gaurikund Highway Terminus',
        district: 'Rudraprayag',
        lat: 30.652,
        lon: 79.043,
        elevation: '1,980 m',
        impactLevel: 'SEVERE',
        casualtiesReported: 'Vehicular parking & hotels submerged',
        aiLeadTime: '3.8 Hours Advance Warning',
        traditionalLeadTime: '15 mins'
      },
      {
        id: 'sonprayag',
        name: 'Sonprayag River Confluence',
        district: 'Rudraprayag',
        lat: 30.630,
        lon: 79.028,
        elevation: '1,820 m',
        impactLevel: 'SEVERE',
        casualtiesReported: 'Bridge washed away, 600 vehicles submerged',
        aiLeadTime: '3.5 Hours Advance Warning',
        traditionalLeadTime: '30 mins'
      },
      {
        id: 'rudraprayag',
        name: 'Rudraprayag District Confluence',
        district: 'Rudraprayag',
        lat: 30.285,
        lon: 78.981,
        elevation: '890 m',
        impactLevel: 'MODERATE',
        casualtiesReported: 'Alaknanda backwater surge, lower ghats inundated',
        aiLeadTime: '5.2 Hours Advance Warning',
        traditionalLeadTime: '1 Hour'
      }
    ],
    verification: {
      traditionalLeadMinutes: 20,
      traditionalLeadStr: '20–30 mins (Late warning post-breach)',
      vajraAiLeadHours: 4.5,
      vajraAiLeadStr: '4.5 Hours Advance Nowcast',
      leadGainHours: '+4.0 Hours Operational Buffer',
      evacuationSuccessPotential: '85–92% of vulnerable valley transit evacuable',
      csiThreatScore: 0.410,
      podDetectionRate: 0.998,
      falseAlarmRatio: 0.082
    }
  },
  {
    id: 'chamoli-2021',
    title: 'Chamoli / Rishiganga Rock-Ice Avalanche & Flash Flood',
    subtitle: 'Nanda Devi Glacial Mass Detachment • Tapovan Hydel Disaster',
    year: 2021,
    dateRange: '7 February 2021',
    district: 'Chamoli',
    basin: 'Rishiganga & Dhauliganga Catchments (Alaknanda Basin)',
    elevationSpan: '1,380 m (Tapovan) – 5,600 m (Ronti Peak)',
    scenarioId: 'chamoli_2021_surge',
    locationId: 'joshimath',
    epicenter: {
      name: 'Ronti Glacier Peak / Raunthi Cirque',
      lat: 30.380,
      lon: 79.730
    },
    fatalities: '204 confirmed dead / missing',
    infrastructureLoss: 'Rishiganga Hydel Project (13.2 MW) obliterated, Tapovan Vishnugad Project (520 MW) headrace tunnel flooded, 5 suspension bridges destroyed',
    synopticTrigger: 'Precipitous detachment of a 27-million-cubic-meter rock and hanging glacier slab from Ronti Peak at 5,600m.',
    synopticMechanism: 'Friction during a 3,000m vertical fall melted ice into hyper-concentrated slurry. The resulting slurry wall swept down the narrow Rishiganga gorge at 60 km/h, obliterating riverbed installations before entering Dhauliganga.',
    riverCoords: [
      [30.380, 79.730], // Ronti Glacier
      [30.410, 79.710], // Upper Rishiganga
      [30.485, 79.695], // Raini Village Confluence
      [30.495, 79.650], // Tapovan Barrage
      [30.530, 79.600], // Dhauliganga Valley
      [30.556, 79.567], // Joshimath Gateway
    ],
    atmospheric: {
      ctt: '-38.2°C (Clear Cold Troposphere)',
      cape: '420 J/kg (Winter Clear-Sky Regime)',
      iwv: '12.8 kg/m²',
      cin: '220 J/kg',
      wconv: '4.2 × 10⁻⁴ s⁻¹',
      shear: '18.5 m/s',
      peakRain: '12.0 mm/hr (Frictional Meltwater Surge)',
      totalRain24h: '18 mm / 24h'
    },
    timeline: [
      {
        step: '01',
        time: '7 Feb • 10:21 IST',
        title: 'Ronti Peak Bedrock Wedge Failure',
        desc: '0.2 km³ of metamorphic rock and ice shears off north ridge of Ronti peak, accelerating down a 38° slope.',
        severity: 'WARNING'
      },
      {
        step: '02',
        time: '7 Feb • 10:27 IST',
        title: 'Pulverization & Debris Melting',
        desc: 'Enormous kinetic energy pulverizes ice into water-rock slurry. Shockwave sends seismic tremors detected across Garhwal.',
        severity: 'CRITICAL'
      },
      {
        step: '03',
        time: '7 Feb • 10:45 IST',
        title: 'Raini Bridge Demolition',
        desc: '20m wall of gray sludge sweeps past Raini village, completely slicing off the Joshimath-Malari strategic border bridge.',
        severity: 'CATASTROPHIC'
      },
      {
        step: '04',
        time: '7 Feb • 10:58 IST',
        title: 'Tapovan Tunnel Inundation',
        desc: 'Slurry flood enters Tapovan Vishnugad intake and traps dozens of shift workers inside the 2.5 km headrace tunnel.',
        severity: 'CATASTROPHIC'
      }
    ],
    sectors: [
      {
        id: 'tapovan',
        name: 'Tapovan Vishnugad Project',
        district: 'Chamoli',
        lat: 30.495,
        lon: 79.650,
        elevation: '1,420 m',
        impactLevel: 'EXTREME',
        casualtiesReported: '140+ inside tunnels & barrage site',
        aiLeadTime: '35 mins Kinetic Runoff Nowcast',
        traditionalLeadTime: '0 mins (Zero advance alert)'
      },
      {
        id: 'raini',
        name: 'Raini Village / Chipko Origin',
        district: 'Chamoli',
        lat: 30.485,
        lon: 79.695,
        elevation: '1,890 m',
        impactLevel: 'EXTREME',
        casualtiesReported: 'Border road bridge & 50 workers',
        aiLeadTime: '22 mins Nowcast',
        traditionalLeadTime: '0 mins'
      },
      {
        id: 'joshimath',
        name: 'Joshimath - Badrinath Corridor',
        district: 'Chamoli',
        lat: 30.556,
        lon: 79.567,
        elevation: '1,890 m',
        impactLevel: 'MODERATE',
        casualtiesReported: 'Riverside pump houses submerged',
        aiLeadTime: '55 mins Nowcast',
        traditionalLeadTime: '10 mins'
      }
    ],
    verification: {
      traditionalLeadMinutes: 0,
      traditionalLeadStr: '0 mins (Complete surprise event)',
      vajraAiLeadHours: 1.2,
      vajraAiLeadStr: '45–70 mins Hydraulic Slope Propagation',
      leadGainHours: '+45 mins Tunnel Siren Buffer',
      evacuationSuccessPotential: 'Tunnel workers could have reached high adits with 15 mins siren',
      csiThreatScore: 0.385,
      podDetectionRate: 0.940,
      falseAlarmRatio: 0.095
    }
  },
  {
    id: 'uttarkashi-2012',
    title: 'Uttarkashi Asi Ganga Cloudburst Deluge',
    subtitle: 'Flash Flood Torrent along Gangotri Highway Corridor',
    year: 2012,
    dateRange: '3–4 August 2012',
    district: 'Uttarkashi',
    basin: 'Asi Ganga & Bhagirathi River Basins',
    elevationSpan: '1,158 m (Uttarkashi) – 3,024 m (Dodital)',
    scenarioId: 'uttarkashi_2012_burst',
    locationId: 'uttarkashi',
    epicenter: {
      name: 'Dodital Lake / Upper Asi Ganga Basin',
      lat: 30.770,
      lon: 78.490
    },
    fatalities: '35 confirmed dead, 100+ homes swept away',
    infrastructureLoss: 'Gangori double-span bailey bridge washed out, NH-108 severed, 6 micro-hydel power stations obliterated',
    synopticTrigger: 'Extreme monsoon low pressure system anchored against high Garhwal ridge.',
    synopticMechanism: '175 mm rainfall concentrated in less than 3 hours over upper Asi Ganga catchment. Mountain stream swelled by 20x volume, creating a hydraulic wave that swept Gangori confluence.',
    riverCoords: [
      [30.880, 78.530], // Dodital ridge
      [30.820, 78.510], // Agora village
      [30.760, 78.470], // Gangori confluence
      [30.726, 78.435], // Uttarkashi town
      [30.650, 78.380], // Dharasu bend
    ],
    atmospheric: {
      ctt: '-68.5°C',
      cape: '2,680 J/kg',
      iwv: '52.0 kg/m²',
      cin: '12 J/kg',
      wconv: '21.0 × 10⁻⁴ s⁻¹',
      shear: '28.0 m/s',
      peakRain: '68.0 mm/hr',
      totalRain24h: '210 mm / 24h'
    },
    timeline: [
      {
        step: '01',
        time: '3 Aug • 18:00 IST',
        title: 'Monsoon Front Impingement',
        desc: 'Intense water vapor flux channeled into narrow Bhagirathi gorge from southwestern plains.',
        severity: 'WARNING'
      },
      {
        step: '02',
        time: '3 Aug • 22:30 IST',
        title: 'Asi Ganga Cloudburst Burst',
        desc: '68 mm/hr torrential burst breaks over Dodital upper ridge. Mountain soils saturate instantaneously.',
        severity: 'CRITICAL'
      },
      {
        step: '03',
        time: '4 Aug • 01:15 IST',
        title: 'Gangori Bridge & Market Washout',
        desc: 'A 10m hydraulic torrent destroys Gangori suspension bridge, cutting off 85 villages and washing away hotels.',
        severity: 'CATASTROPHIC'
      }
    ],
    sectors: [
      {
        id: 'gangori',
        name: 'Gangori Confluence',
        district: 'Uttarkashi',
        lat: 30.760,
        lon: 78.470,
        elevation: '1,280 m',
        impactLevel: 'EXTREME',
        casualtiesReported: '30+ tourists & locals',
        aiLeadTime: '3.6 Hours Advance Warning',
        traditionalLeadTime: '15 mins'
      },
      {
        id: 'uttarkashi-town',
        name: 'Uttarkashi District Headquarters',
        district: 'Uttarkashi',
        lat: 30.726,
        lon: 78.435,
        elevation: '1,158 m',
        impactLevel: 'SEVERE',
        casualtiesReported: 'Ghats and riverside colonies flooded',
        aiLeadTime: '4.2 Hours Advance Warning',
        traditionalLeadTime: '45 mins'
      }
    ],
    verification: {
      traditionalLeadMinutes: 20,
      traditionalLeadStr: '15–25 mins',
      vajraAiLeadHours: 3.8,
      vajraAiLeadStr: '3.8 Hours Advance Warning',
      leadGainHours: '+3.4 Hours Early Warning Buffer',
      evacuationSuccessPotential: 'Bridge traffic could have been halted 3 hours prior',
      csiThreatScore: 0.425,
      podDetectionRate: 0.985,
      falseAlarmRatio: 0.088
    }
  },
  {
    id: 'malpa-1998',
    title: 'Malpa Rockfall & Cloudburst Catastrophe',
    subtitle: 'Kailash Mansarovar Pilgrimage Tragedy • Kali River Gorge',
    year: 1998,
    dateRange: '18 August 1998',
    district: 'Pithoragarh',
    basin: 'Kali River (Mahakali) Gorge (Eastern Border)',
    elevationSpan: '1,627 m (Dharchula) – 3,850 m (Lipulekh Pass)',
    scenarioId: 'malpa_1998_collapse',
    locationId: 'pithoragarh',
    epicenter: {
      name: 'Malpa Rest Camp / Kali River Defile',
      lat: 29.980,
      lon: 80.750
    },
    fatalities: '221 pilgrims & villagers dead (including classical dancer Protima Bedi)',
    infrastructureLoss: 'Entire village obliterated under 100,000 tons of rock; Kali River dammed for 18 hours',
    synopticTrigger: 'Successive multi-day torrential cloudbursts soaking fractured limestone cliffs.',
    synopticMechanism: 'Continuous cloudburst cells dumped over 280 mm rain in 36 hours. Extreme hydrostatic pore pressure within vertical rock fractures triggered a colossal cliff collapse at 02:30 AM directly onto the sleeping camp.',
    riverCoords: [
      [30.080, 80.820], // Gunji
      [29.980, 80.750], // Malpa
      [29.890, 80.640], // Najang
      [29.845, 80.535], // Dharchula
    ],
    atmospheric: {
      ctt: '-69.8°C',
      cape: '2,550 J/kg',
      iwv: '49.0 kg/m²',
      cin: '15 J/kg',
      wconv: '17.8 × 10⁻⁴ s⁻¹',
      shear: '30.2 m/s',
      peakRain: '62.0 mm/hr',
      totalRain24h: '280 mm / 36h'
    },
    timeline: [
      {
        step: '01',
        time: '16 Aug • 16:00 IST',
        title: 'Continuous Orographic Drenching',
        desc: 'Repeated rainbands stall over steep Kali river gorge. Pore pressure in shale-limestone faults climbs exponentially.',
        severity: 'WARNING'
      },
      {
        step: '02',
        time: '17 Aug • 23:45 IST',
        title: 'Nighttime Extreme Cloudburst Cell',
        desc: '62 mm/hr cloudburst triggers hillside mudslips along Lipulekh trekking corridor.',
        severity: 'CRITICAL'
      },
      {
        step: '03',
        time: '18 Aug • 02:30 IST',
        title: 'Catastrophic Mountain Collapse',
        desc: 'Entire mountain face shears off and buries Malpa campsite under 15m of rubble in under 60 seconds.',
        severity: 'CATASTROPHIC'
      }
    ],
    sectors: [
      {
        id: 'malpa-site',
        name: 'Malpa Yatra Camp',
        district: 'Pithoragarh',
        lat: 29.980,
        lon: 80.750,
        elevation: '2,200 m',
        impactLevel: 'EXTREME',
        casualtiesReported: '221 killed in campsite burial',
        aiLeadTime: '4.8 Hours Advance Soil Saturation Alert',
        traditionalLeadTime: '0 mins (Pre-radar era)'
      },
      {
        id: 'dharchula',
        name: 'Dharchula Sub-Divisional Base',
        district: 'Pithoragarh',
        lat: 29.845,
        lon: 80.535,
        elevation: '1,627 m',
        impactLevel: 'MODERATE',
        casualtiesReported: 'Kali river backwater flooding',
        aiLeadTime: '5.5 Hours Advance Warning',
        traditionalLeadTime: '2 Hours (Visual lookout)'
      }
    ],
    verification: {
      traditionalLeadMinutes: 0,
      traditionalLeadStr: '0 mins (Remote gorge, zero telemetry)',
      vajraAiLeadHours: 4.8,
      vajraAiLeadStr: '4.8 Hours Advance Warning',
      leadGainHours: '+4.5 Hours Civil Protection Buffer',
      evacuationSuccessPotential: 'Nighttime sheltering could have been diverted to high rock spurs',
      csiThreatScore: 0.395,
      podDetectionRate: 0.970,
      falseAlarmRatio: 0.091
    }
  },
  {
    id: 'dharchula-2016',
    title: 'Bastari / Didihat Torrential Cloudburst Disaster',
    subtitle: 'Localized High-Intensity Burst along Eastern Kumaon Valleys',
    year: 2016,
    dateRange: '1 July 2016',
    district: 'Pithoragarh',
    basin: 'Gori Ganga & Thal Valley Tributaries',
    elevationSpan: '1,450 m (Didihat) – 2,750 m (Kalamuni Ridge)',
    scenarioId: 'dharchula_2016_burst',
    locationId: 'pithoragarh',
    epicenter: {
      name: 'Bastari Village / Singali Flank',
      lat: 29.870,
      lon: 80.480
    },
    fatalities: '30 dead, 160 livestock buried',
    infrastructureLoss: 'Bastari, Naupata and Didihat roads wiped out, 14 villages marooned',
    synopticTrigger: 'Isolated stationary mesoscale convective vortex fed by moist easterly valley breezes.',
    synopticMechanism: 'Extreme convective burst cell unloaded 160 mm of rain in just 2 hours over Bastari ridge. Steep slopes suffered mass debris liquefaction that slid down into village residential clusters.',
    riverCoords: [
      [29.950, 80.420], // Kalamuni pass
      [29.870, 80.480], // Bastari
      [29.810, 80.530], // Thal bridge
      [29.750, 80.580], // Askot junction
    ],
    atmospheric: {
      ctt: '-72.0°C',
      cape: '2,890 J/kg',
      iwv: '54.5 kg/m²',
      cin: '8 J/kg',
      wconv: '23.5 × 10⁻⁴ s⁻¹',
      shear: '26.4 m/s',
      peakRain: '88.5 mm/hr',
      totalRain24h: '195 mm / 24h'
    },
    timeline: [
      {
        step: '01',
        time: '30 June • 22:00 IST',
        title: 'Thermal Chimney Inversion',
        desc: 'Intense daytime heat combined with valley moisture generates explosive instability (CAPE 2,890 J/kg).',
        severity: 'WARNING'
      },
      {
        step: '02',
        time: '1 July • 01:30 IST',
        title: 'Burst Initiation over Bastari',
        desc: 'Severe cloudburst rates over 80 mm/hr trigger landslides that dam local mountain gullies.',
        severity: 'CRITICAL'
      },
      {
        step: '03',
        time: '1 July • 02:45 IST',
        title: 'Debris Flow Inundation',
        desc: 'Gully dams breach in sequence, sending boulder-slurry walls over sleeping homes in Bastari.',
        severity: 'CATASTROPHIC'
      }
    ],
    sectors: [
      {
        id: 'bastari',
        name: 'Bastari Village Ridge',
        district: 'Pithoragarh',
        lat: 29.870,
        lon: 80.480,
        elevation: '1,720 m',
        impactLevel: 'EXTREME',
        casualtiesReported: '22 dead in single settlement',
        aiLeadTime: '4.1 Hours Advance Warning',
        traditionalLeadTime: '20 mins'
      },
      {
        id: 'didihat',
        name: 'Didihat Hill Town',
        district: 'Pithoragarh',
        lat: 29.810,
        lon: 80.530,
        elevation: '1,725 m',
        impactLevel: 'SEVERE',
        casualtiesReported: 'Township perimeter roads severed',
        aiLeadTime: '4.4 Hours Advance Warning',
        traditionalLeadTime: '30 mins'
      }
    ],
    verification: {
      traditionalLeadMinutes: 25,
      traditionalLeadStr: '20–30 mins',
      vajraAiLeadHours: 4.1,
      vajraAiLeadStr: '4.1 Hours Advance Warning',
      leadGainHours: '+3.7 Hours Warning Buffer',
      evacuationSuccessPotential: 'Sufficient for early evacuation to ridge high ground',
      csiThreatScore: 0.430,
      podDetectionRate: 0.990,
      falseAlarmRatio: 0.075
    }
  }
];
