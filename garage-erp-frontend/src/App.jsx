import React from 'react'
import './index.css'

function App() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl">
        <h1>🚗 Garage ERP</h1>
        <p className="text-lg text-text mb-4">
          Modern Garage Management System
        </p>
        <div className="card-custom mt-8">
          <h2>Welcome to Garage ERP</h2>
          <p className="text-text">
            Your all-in-one solution for garage management.
          </p>
          <div className="mt-4 flex gap-4 justify-center">
            <code>npm run dev</code>
            <code className="bg-accent-bg text-accent border border-accent-border">
              Ready
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App