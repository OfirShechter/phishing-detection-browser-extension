import React from 'react'
import ReactDOM from 'react-dom/client'
import { isPhishingSite } from './phishingDetector'
import { Banner } from './components/Banner'

const mount = document.createElement('div')
document.body.prepend(mount)

ReactDOM.createRoot(mount).render(
  <React.StrictMode>
    <Banner isPhishing={isPhishingSite()} />
  </React.StrictMode>
)
