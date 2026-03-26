import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DashboardShell } from './components/DashboardShell';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Settings } from './pages/Settings';
import { Events } from './pages/Events';
import { EventDetails } from './pages/EventDetails';
import { Bookings } from './pages/Bookings';
import { Kanban } from './pages/Kanban';
import { Partners } from './pages/Partners';
import { PartnerTypes } from './pages/PartnerTypes';
import { Musiker } from './pages/Musiker';
import { BookingFlow } from './components/booking/BookingFlow';
import { SyncValidator } from './components/admin/SyncValidator';
import { Statistics } from './pages/Statistics';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<DashboardShell />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="new-booking" element={<BookingFlow />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="stammdaten/partner" element={<Partners />} />
          <Route path="stammdaten/partner-types" element={<PartnerTypes />} />
          <Route path="stammdaten/musiker" element={<Musiker />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin/system-test" element={<SyncValidator />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
