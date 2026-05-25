import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE = 'http://localhost:5000/api'

function App() {
  const [laptops, setLaptops] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [newLaptop, setNewLaptop] = useState({ modelNumber: '', serialNumber: '', LocationId: '' })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [laptopRes, locationRes] = await Promise.all([
        axios.get(`${API_BASE}/laptops`),
        axios.get(`${API_BASE}/locations`)
      ])
      setLaptops(laptopRes.data)
      setLocations(locationRes.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setLoading(false)
    }
  }

  const handleAddLaptop = async (e, resolveConflict = false) => {
    if (e) e.preventDefault()
    if (!newLaptop.modelNumber || !newLaptop.serialNumber || !newLaptop.LocationId) {
      alert('Please fill in all fields')
      return
    }
    try {
      await axios.post(`${API_BASE}/laptops`, { ...newLaptop, resolveConflict })
      setNewLaptop({ modelNumber: '', serialNumber: '', LocationId: '' })
      fetchData()
    } catch (err) {
      if (err.response?.status === 409 && err.response.data.conflict) {
        const { existingLaptop } = err.response.data;
        if (window.confirm(`${err.response.data.error}\n\nMove the existing laptop (${existingLaptop.modelNumber} - ${existingLaptop.serialNumber}) to Storage Closet and continue?`)) {
          handleAddLaptop(null, true)
        }
      } else {
        console.error('Error adding laptop:', err)
        alert('Error adding laptop: ' + (err.response?.data?.error || err.message))
      }
    }
  }

  const handleCSVImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target.result
      const lines = text.split('\n')
      // Clean headers (remove \r and extra spaces)
      const headers = lines[0].split(',').map(h => h.trim().replace('\r', ''))
      
      const data = lines.slice(1).filter(line => line.trim() !== '').map(line => {
        const values = line.split(',')
        const obj = {}
        headers.forEach((header, i) => {
          if (values[i]) {
            obj[header] = values[i].trim().replace('\r', '')
          }
        })
        return obj
      })

      try {
        await axios.post(`${API_BASE}/laptops/bulk`, data)
        alert('CSV Imported Successfully')
        fetchData()
      } catch (err) {
        console.error('Error importing CSV:', err)
        alert('Error importing CSV: ' + (err.response?.data?.error || err.message))
      }
    }
    reader.readAsText(file)
  }

  const updateLocation = async (laptopId, newLocationId, resolveConflict = false) => {
    try {
      await axios.put(`${API_BASE}/laptops/${laptopId}`, { LocationId: newLocationId, resolveConflict })
      fetchData()
    } catch (err) {
      if (err.response?.status === 409 && err.response.data.conflict) {
        const { existingLaptop } = err.response.data;
        if (window.confirm(`${err.response.data.error}\n\nMove the existing laptop (${existingLaptop.modelNumber} - ${existingLaptop.serialNumber}) to Storage Closet?`)) {
          updateLocation(laptopId, newLocationId, true)
        }
      } else {
        console.error('Error updating location:', err)
        alert('Error: ' + (err.response?.data?.error || err.message))
      }
    }
  }

  const handleRetireLaptop = async (laptop) => {
    if (window.confirm(`Are you sure you want to retire this laptop?\n\nModel: ${laptop.modelNumber}\nSerial: ${laptop.serialNumber}`)) {
      try {
        await axios.delete(`${API_BASE}/laptops/${laptop.id}`)
        fetchData()
      } catch (err) {
        console.error('Error retiring laptop:', err)
        alert('Error retiring laptop: ' + (err.response?.data?.error || err.message))
      }
    }
  }

  const filteredLaptops = laptops.filter(laptop => 
    laptop.modelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    laptop.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    laptop.Location?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div>Loading...</div>

  return (
    <div className="App">
      <h1>Laptop Inventory Management</h1>
      
      <div className="controls">
        <div className="add-laptop-form">
          <h2>Add New Laptop</h2>
          <form onSubmit={handleAddLaptop}>
            <input 
              type="text" 
              placeholder="Model Number" 
              value={newLaptop.modelNumber}
              onChange={(e) => setNewLaptop({...newLaptop, modelNumber: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Serial Number" 
              value={newLaptop.serialNumber}
              onChange={(e) => setNewLaptop({...newLaptop, serialNumber: e.target.value})}
            />
            <select 
              value={newLaptop.LocationId}
              onChange={(e) => setNewLaptop({...newLaptop, LocationId: e.target.value})}
            >
              <option value="">Select Location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <button type="submit">Add Laptop</button>
          </form>
        </div>

        <div className="csv-import">
          <h2>Bulk Import (CSV)</h2>
          <p>Format: <code>modelNumber, serialNumber, LocationId</code></p>
          <input type="file" accept=".csv" onChange={handleCSVImport} />
        </div>
      </div>

      <div className="inventory-list">
        <h2>Inventory</h2>
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search by Model, Serial, or Location..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Serial Number</th>
              <th>Current Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLaptops.map(laptop => (
              <tr key={laptop.id}>
                <td>{laptop.modelNumber}</td>
                <td>{laptop.serialNumber}</td>
                <td>{laptop.Location?.name || 'Unknown'}</td>
                <td>
                  <div className="actions">
                    <select 
                      value={laptop.LocationId || ''} 
                      onChange={(e) => updateLocation(laptop.id, e.target.value)}
                    >
                      <option value="">Move to...</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                    <button 
                      className="retire-btn" 
                      onClick={() => handleRetireLaptop(laptop)}
                    >
                      Retire
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
