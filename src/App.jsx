import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import DataEntry from './pages/DataEntry';
import AdminDashboard from './pages/AdminDashboard';
import ClientsSummary from './pages/admin/ClientsSummary';
import DailySummary from './pages/admin/DailySummary';
import StaffSummary from './pages/admin/StaffSummary';
import AddClientPage from './pages/admin/AddClientPage';
import ClientAssignment from './pages/admin/ClientAssignment';
import AddStaff from './pages/admin/AddStaff';
import StaffDashboard from './pages/StaffDashboard';
import DataEdit from './pages/DataEdit';


const App=()=> {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/signin" element={<SignIn/>}/>
        <Route path="/dataentry" element={<DataEntry/>}/>
        <Route path="/staffdashboard" element={<StaffDashboard/>}/>
        <Route path="/dataedit" element={<DataEdit/>}/>
        <Route path="/admindash" element={<AdminDashboard/>}/>
        <Route path="/admin/ClientsSummary" element={<ClientsSummary/>}/>
        <Route path="/admin/DailySummary" element={<DailySummary/>}/>
        <Route path="/admin/StaffSummary" element={<StaffSummary/>}/>
        <Route path="/admin/AddClientPage" element={<AddClientPage/>}/>
        <Route path="/admin/ClientAssignment" element={<ClientAssignment/>}/>
        <Route path="/admin/AddStaff" element={<AddStaff/>}/>"
      </Routes>
    </BrowserRouter>
  );
}

export default App;