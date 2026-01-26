import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Squad from './pages/Squad';
import Roles from './pages/Roles';
import SprintPlanner from './pages/SprintPlanner';
import Presentation from './pages/Presentation';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/squad" element={<Squad />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/planning" element={<SprintPlanner />} />
          <Route path="/presentation" element={<Presentation />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
