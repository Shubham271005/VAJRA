import React from 'react'
import ReactDOM from 'react-dom/client'
// @ts-expect-error Leaflet's CSS package does not provide TypeScript declarations.
import 'leaflet/dist/leaflet.css'
// @ts-expect-error CSS imports are handled by the bundler and have no TypeScript declarations.
import './styles.css'
import App from './App'
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
