import { HashRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './hooks/useTheme'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Profile } from './pages/Profile'
import { Heatmap } from './pages/Heatmap'

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile/:code" element={<Profile />} />
            <Route path="/heatmap" element={<Heatmap />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
